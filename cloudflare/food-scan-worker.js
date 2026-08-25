// Cloudflare Worker — food photo, nutrition label, or a typed description →
// macros via OpenRouter.
//
// This exists purely as a reference copy for the repo; the actual deploy
// target is the Cloudflare dashboard (Workers & Pages), not this file. Paste
// this into the Worker's editor and set OPENROUTER_API_KEY as an encrypted
// secret in the Worker's settings — never as plaintext, and never in this
// repo. The API key never reaches the browser: the client only ever talks to
// this Worker's URL, and this Worker is the only thing that talks to
// OpenRouter.
//
// Two input modes, mutually exclusive per request:
//  - image: a plated/prepared food shot (macros are visually estimated) or a
//    printed nutrition facts label on packaging (macros are read verbatim
//    off the label instead of guessed) — the model decides which one it's
//    looking at and reports which it did via `source`.
//  - text: a plain-text description of what was eaten (e.g. "nasi lemak" or
//    "2 slices of toast with peanut butter") — macros are estimated from a
//    typical serving of whatever's described; `source` is always "estimate"
//    since there's nothing exact to read.
//
// Request:  POST { image: "data:image/jpeg;base64,..." } or POST { text: "..." }
// Response: { label, calories, protein, carbs, fat, fiber, confidence, source } or { error }

const ALLOWED_ORIGIN = "https://enquirykhai-blip.github.io";
// NOTE: set this to whatever model slug is confirmed working on your deployed
// Worker (openrouter.ai/models) — "google/gemini-2.0-flash-001" 404'd for one
// user; "openai/gpt-4o-mini" is a solid, well-established fallback.
const MODEL = "openai/gpt-4o-mini";
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // ~6MB base64, generous for a phone photo
const MAX_TEXT_LENGTH = 300; // a food description, not an essay

const IMAGE_PROMPT =
  "You are a nutrition estimator. This image is either (a) a printed nutrition " +
  "facts / nutrition information label from food packaging, or (b) a photo of " +
  "prepared or plated food with no label. Decide which. If it's a label: read the " +
  "exact stated calories, protein, carbohydrates, fat, and fiber directly from the " +
  "label text for ONE serving, using the serving size printed on the label — do not " +
  "estimate, use the printed numbers, and set confidence to \"high\". If it's a food " +
  "photo with no label: visually estimate calories and protein/carbohydrates/fat/fiber " +
  "in grams for the visible portion, and set confidence based on how certain you are. " +
  "Reply with ONLY raw JSON, no markdown, no explanation, in exactly this shape: " +
  '{"label": "short food or product name", "calories": <integer>, "protein": <integer>, ' +
  '"carbs": <integer>, "fat": <integer>, "fiber": <integer>, ' +
  '"confidence": "low" | "medium" | "high", "source": "label" | "estimate"}. If the ' +
  "image contains neither food nor a nutrition label, reply " +
  '{"label": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, ' +
  '"confidence": "low", "source": "estimate"}.';

function textPrompt(description) {
  return (
    "You are a nutrition estimator. The user typed a plain-text description of " +
    "a food or meal they ate (it may be in Malay, English, or a mix, and may be " +
    'brief like a dish name or more detailed). Description: "' +
    description +
    '". Estimate calories and protein/carbohydrates/fat/fiber in grams for a ' +
    "typical single serving of what they described (assume one standard portion " +
    "unless a quantity is mentioned), and set confidence based on how specific " +
    "the description was. Reply with ONLY raw JSON, no markdown, no explanation, " +
    "in exactly this shape: " +
    '{"label": "short food name", "calories": <integer>, "protein": <integer>, ' +
    '"carbs": <integer>, "fat": <integer>, "fiber": <integer>, ' +
    '"confidence": "low" | "medium" | "high", "source": "estimate"}. If the ' +
    "description doesn't describe any food, reply " +
    '{"label": "", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0, ' +
    '"confidence": "low", "source": "estimate"}.'
  );
}

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
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const hasImage = typeof image === "string" && image.length > 0;

    if (!hasImage && !text) {
      return json({ error: "Provide either a photo or a text description." }, 400);
    }
    if (hasImage && !image.startsWith("data:image/")) {
      return json({ error: "Invalid image." }, 400);
    }
    if (hasImage && image.length > MAX_IMAGE_BYTES) {
      return json({ error: "Image too large." }, 413);
    }
    if (!hasImage && text.length > MAX_TEXT_LENGTH) {
      return json({ error: "Description is too long." }, 413);
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
              content: hasImage
                ? [
                    { type: "text", text: IMAGE_PROMPT },
                    { type: "image_url", image_url: { url: image } },
                  ]
                : textPrompt(text),
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
      return json({ error: "Could not read the AI's estimate. Try again with a clearer photo or description." }, 502);
    }

    return json({
      label: String(parsed.label || "").slice(0, 60),
      calories: Math.max(0, Math.round(Number(parsed.calories) || 0)),
      protein: Math.max(0, Math.round(Number(parsed.protein) || 0)),
      carbs: Math.max(0, Math.round(Number(parsed.carbs) || 0)),
      fat: Math.max(0, Math.round(Number(parsed.fat) || 0)),
      fiber: Math.max(0, Math.round(Number(parsed.fiber) || 0)),
      confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "low",
      source: ["label", "estimate"].includes(parsed.source) ? parsed.source : "estimate",
    });
  },
};
