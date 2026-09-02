// Extracts calorie/protein/carbs/fat/fiber numbers from free-form pasted
// nutrition text — e.g. copied off a food packaging label, a nutrition
// website, or another tracking app. Purely local regex matching (no
// network, no AI): the numbers are already exact in the pasted text, there's
// nothing to estimate. Matches common English and Malay label wording.
// Returns only the keys it actually found a number for, so callers can
// leave any field it didn't recognize untouched.

const PATTERNS = {
  calories: /(?:calories|energy|kcal|tenaga|kalori)\D{0,15}?(\d+(?:\.\d+)?)\s*(?:kcal|cal)?\b/i,
  protein: /protein\D{0,10}?(\d+(?:\.\d+)?)\s*g?\b/i,
  carbs: /(?:total carbohydrate|carbohydrate|carbs?|karbohidrat)\D{0,15}?(\d+(?:\.\d+)?)\s*g?\b/i,
  fat: /(?:total fat|fat|lemak)\D{0,10}?(\d+(?:\.\d+)?)\s*g?\b/i,
  fiber: /(?:dietary fiber|fibre|fiber|serat)\D{0,10}?(\d+(?:\.\d+)?)\s*g?\b/i,
};

export function parseMacrosFromText(text) {
  const found = {};
  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const match = text.match(pattern);
    if (match) found[key] = Math.round(parseFloat(match[1]));
  }
  return found;
}
