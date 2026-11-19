export async function mealieRequest(settings, path, options = {}) {
  const response = await fetch(`${settings.mealieUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${settings.apiToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = typeof body.detail === "string" ? `: ${body.detail}` : "";
    } catch {
      // Some API errors return an empty or non-JSON body.
    }
    throw new Error(`Mealie request failed (${response.status})${detail}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function getShoppingLists(settings) {
  const response = await mealieRequest(
    settings,
    "/api/households/shopping/lists?page=1&perPage=-1",
  );
  if (!Array.isArray(response.items)) {
    throw new Error("Mealie returned an unexpected shopping-list response.");
  }
  return response.items;
}

export async function getShoppingList(settings, listId) {
  const response = await mealieRequest(
    settings,
    `/api/households/shopping/lists/${encodeURIComponent(listId)}`,
  );
  if (!Array.isArray(response.listItems)) {
    throw new Error("Mealie returned an unexpected shopping-list detail response.");
  }
  return response.listItems;
}

export async function markShoppingItemChecked(settings, itemId, update) {
  return mealieRequest(
    settings,
    `/api/households/shopping/items/${encodeURIComponent(itemId)}`,
    {
      method: "PUT",
      body: JSON.stringify(update),
    },
  );
}
