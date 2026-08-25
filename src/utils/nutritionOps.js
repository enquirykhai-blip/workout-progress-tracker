// A nutrition entry is one logged item
// ({ id, date, label, calories, protein, carbs, fat, fiber, mealType }) —
// multiple can exist per day (breakfast, lunch, a snack...) and get summed
// for that day's totals, unlike body weight which is naturally one reading
// a day. Entries logged before carbs/fat/fiber were tracked simply lack
// those fields, which contribute 0 to totals — same treatment as any other
// missing value. Entries logged before mealType existed fall back to
// "snack" wherever entries are grouped by meal.

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_TYPE_META = {
  breakfast: { label: "Breakfast", emoji: "🍳" },
  lunch: { label: "Lunch", emoji: "🥗" },
  dinner: { label: "Dinner", emoji: "🍽️" },
  snack: { label: "Snack", emoji: "🍎" },
};

// Guesses which meal a new entry probably belongs to based on the time of
// day, so the add-entry form starts on a sensible default instead of
// always defaulting to the same meal.
export function currentMealType(date = new Date()) {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

export function entriesForDate(entries, date) {
  return entries.filter((e) => e.date === date);
}

// Groups a day's entries by meal, in a fixed breakfast → snack order,
// skipping meals with nothing logged, each with its own calorie subtotal.
export function groupEntriesByMealType(entries, date) {
  const todays = entriesForDate(entries, date);
  return MEAL_TYPES.map((type) => {
    const group = todays.filter((e) => (e.mealType || "snack") === type);
    return {
      type,
      ...MEAL_TYPE_META[type],
      entries: group,
      totalCalories: group.reduce((sum, e) => sum + (e.calories || 0), 0),
    };
  }).filter((group) => group.entries.length > 0);
}

export function totalsForDate(entries, date) {
  return entriesForDate(entries, date).reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
      fiber: acc.fiber + (e.fiber || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

// Daily totals across all history, sorted oldest to newest — for trend charts.
export function dailyTotalsSeries(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = { date: e.date, calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    byDate[e.date].calories += e.calories || 0;
    byDate[e.date].protein += e.protein || 0;
    byDate[e.date].carbs += e.carbs || 0;
    byDate[e.date].fat += e.fat || 0;
    byDate[e.date].fiber += e.fiber || 0;
  }
  return Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1));
}
