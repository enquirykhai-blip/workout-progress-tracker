// Cloudflare Worker — food photo → estimated macros via OpenRouter.
//
// This exists purely as a reference copy for the repo; the actual deploy
// target is the Cloudflare dashboard (Workers & Pages), not this file. Paste
// this into the Worker's editor and set OPENROUTER_API_KEY as an encrypted
// secret in the Worker's settings — never as plaintext, and never in this
// repo. The API key never reaches the browser: the client only ever talks to
// this Worker's URL, and this Worker is the only thing that talks to
// OpenRouter.
//
// Request:  POST { image: "data:image/jpeg;base64,..." }
// Response: { label, calories, protein, carbs, fat, fiber, confidence } or { error }

const ALLOWED_ORIGIN = "https://enquirykhai-blip.github.io";
// NOTE: set this to whatever model slug is confirmed working on your deployed
// Worker (openrouter.ai/models) — "google/gemini-2.0-flash-001" 404'd for one
// user; "openai/gpt-4o-mini" is a solid, well-established fallback.
const MODEL = "openai/gpt-4o-mini";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB base64, generous for a phone photo

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// The model is asked to reply with only JSON, but vision models sometimes
// wrap it in a markdown code fence anyway — strip that before parsing.
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid request body." }, 400);
    }

    const image = body?.image;
    if (typeof image !== "string" || !image.startsWith("data:image/")) {
      return json({ error: "Missing or invalid image." }, 400);
    }
    if (image.length > MAX_IMAGE_BYTES) {
      return json({ error: "Image too large." }, 413);
    }

    let aiResponse;
    try {
      aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": ALLOWED_ORIGIN,
          "X-Title": "Workout Progress Tracker",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text:
                    "You are a nutrition estimator. Look at this food photo and estimate, for the " +
                    "visible portion: calories, and protein/carbohydrates/fat/fiber in grams. " +
                    "Reply with ONLY raw JSON, no markdown, no explanation, in exactly this shape: " +
                    '{"label": "short food name", "calories": <integer>, "protein": <integer>, ' +
                    '"carbs": <integer>, "fat": <integer>, "fiber": <integer>, ' +
                    '"confidence": "low" | "medium" | "high"}. If the image does not contain food, ' +
                    'reply {"label": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, "confidence": "low"}.',
                },
                { type: "image_url", image_url: { url: image } },
              ],
            },
          ],
        }),
      });
    } catch {
      return json({ error: "Could not reach the AI service. Check your connection and try again." }, 502);
    }

    if (!aiResponse.ok) {
      return json({ error: `AI service error (${aiResponse.status}). Try again in a moment.` }, 502);
    }

    const data = await aiResponse.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      return json({ error: "AI service returned an empty response." }, 502);
    }

    let parsed;
    try {
      parsed = extractJson(content);
    } catch {
      return json({ error: "Could not read the AI's estimate. Try a clearer photo." }, 502);
    }

    return json({
      label: String(parsed.label || "").slice(0, 60),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      fiber: Math.max(0, Math.round(Number(parsed.fiber) || 0)),
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
    });
  },
};
