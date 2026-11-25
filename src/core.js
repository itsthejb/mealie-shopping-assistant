export function normalizeSettings({ mealieUrl, apiToken, supermarketName, searchUrlTemplate }) {
  let baseUrl;
  try {
    baseUrl = new URL(mealieUrl.trim());
  } catch {
    throw new Error("Enter a valid Mealie URL.");
  }

  if (!["http:", "https:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password) {
    throw new Error("Mealie URL must use HTTP or HTTPS and must not contain credentials.");
  }

  const template = searchUrlTemplate.trim();
  const placeholderCount = (template.match(/\{query\}|%s/g) || []).length;
  let searchUrl;
  try {
    searchUrl = new URL(template.replace(/\{query\}|%s/, "search-term"));
  } catch {
    throw new Error("Enter a valid supermarket search URL with a {query} or %s placeholder.");
  }

  if (
    !["http:", "https:"].includes(searchUrl.protocol) ||
    searchUrl.username ||
    searchUrl.password ||
    placeholderCount !== 1 ||
    !supermarketName.trim() ||
    !apiToken.trim()
  ) {
    throw new Error("Enter a supermarket name, API token, and exactly one search placeholder.");
  }

  return {
    mealieUrl: baseUrl.origin + baseUrl.pathname.replace(/\/+$/, ""),
    apiToken: apiToken.trim(),
    supermarketName: supermarketName.trim(),
    searchUrlTemplate: template,
  };
}

export function createSearchUrl(template, query) {
  const placeholder = template.includes("{query}") ? "{query}" : "%s";
  if (!template.includes(placeholder)) {
    throw new Error("The supermarket search URL has no supported query placeholder.");
  }
  return template.replace(placeholder, encodeURIComponent(query));
}

const QUANTITY_PREFIX =
  /^((?:\d+\s+\d+\s*[/⁄]\s*\d+|\d+(?:\s*[/⁄]\s*\d+)?|\d*\.\d+|[½⅓⅔¼¾⅛⅜⅝⅞]))(?:\s+|$)/u;
const COMMON_UNITS = new Set([
  "bag", "bags", "bottle", "bottles", "block", "blocks", "bunch", "bunches",
  "can", "cans", "carton", "cartons", "clove", "cloves", "cup", "cups",
  "dash", "dashes", "drop", "drops", "g", "gallon", "gallons", "gram", "grams",
  "handful", "handfuls", "kg", "kilogram", "kilograms", "litre", "litres",
  "liter", "liters", "loaf", "loaves", "millilitre", "millilitres", "milliliter",
  "milliliters", "ml", "ounce", "ounces", "oz", "pack", "packs", "package",
  "packages", "piece", "pieces", "pinch", "pinches", "pint", "pints", "pound",
  "pounds", "quart", "quarts", "lb", "lbs", "slice", "slices", "sprig",
  "sprigs", "stalk", "stalks", "tbsp", "tsp", "tablespoon", "tablespoons",
  "teaspoon", "teaspoons", "tin", "tins",
]);

function splitLeadingQuantity(display, unitName) {
  const quantityMatch = display.match(QUANTITY_PREFIX);
  if (!quantityMatch) return { details: "", name: display };

  const quantity = quantityMatch[1];
  const remainder = display.slice(quantityMatch[0].length).trim();
  const unitMatch = unitName
    ? remainder.match(new RegExp(`^${unitName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "i"))
    : null;
  const firstWord = remainder.match(/^[^\s]+/)?.[0] || "";
  const unit = unitMatch?.[0] || (COMMON_UNITS.has(firstWord.toLowerCase()) ? firstWord : "");

  return {
    details: [quantity, unit].filter(Boolean).join(" "),
    name: unit ? remainder.slice(unit.length).trim() : remainder,
  };
}

function formatQuantity(item) {
  if (item.quantity === null || item.quantity === undefined) return "";
  const quantity = Number(item.quantity);
  if (!Number.isFinite(quantity) || quantity === 1) return "";
  return String(item.quantity);
}

export function getItemPresentation(item) {
  const display = item.display?.trim() || "";
  const foodName = item.food?.name?.trim();
  const unitName = item.unit?.name?.trim() || "";
  let name;
  let details = "";

  if (foodName) {
    name = foodName;
    if (display.toLowerCase().endsWith(foodName.toLowerCase())) {
      details = display.slice(0, -foodName.length).trim();
    }
  } else {
    const parsed = splitLeadingQuantity(display, unitName);
    name = parsed.name || item.label?.name || "Shopping list item";
    details = parsed.details;
  }

  if (!details) {
    details = [formatQuantity(item), unitName].filter(Boolean).join(" ");
  }

  return {
    name: name || "Shopping list item",
    details,
    label: item.label?.name?.trim() || "",
    labelColor: item.label?.color?.trim() || "",
    description: item.note?.trim() || "",
  };
}

export function getItemName(item) {
  return getItemPresentation(item).name;
}

export function getSubstitutions(item) {
  return (item.food?.substitutions || [])
    .map((substitution) => ({
      name: substitution.substituteFood?.name,
      note: substitution.note,
    }))
    .filter((substitution) => substitution.name);
}

export function createCheckedItemUpdate(item) {
  return {
    shoppingListId: item.shoppingListId,
    checked: true,
    position: item.position,
    quantity: item.quantity,
    foodId: item.foodId,
    labelId: item.labelId,
    unitId: item.unitId,
    extras: item.extras,
    food: item.food,
    unit: item.unit,
    referencedRecipe: item.referencedRecipe,
    note: item.note,
    display: item.display,
    recipeReferences: item.recipeReferences,
  };
}

export function shouldCelebrateCompletion(items, completedNormally, prefersReducedMotion) {
  return (
    completedNormally &&
    !prefersReducedMotion &&
    items.length > 0 &&
    items.every((item) => item.checked === true)
  );
}
