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

export function getItemName(item) {
  return item.display || item.food?.name || item.label?.name || "Shopping list item";
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
