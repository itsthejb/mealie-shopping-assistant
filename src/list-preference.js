export async function saveLastShoppingListId(storage, listId) {
  if (listId) {
    await storage.set({ lastShoppingListId: listId });
  }
}

export async function restoreShoppingListSelection(storage, lists) {
  const { lastShoppingListId } = await storage.get("lastShoppingListId");
  if (lastShoppingListId && lists.some((list) => list.id === lastShoppingListId)) {
    return lastShoppingListId;
  }

  if (lastShoppingListId) {
    await storage.remove("lastShoppingListId");
  }

  const fallbackId = lists.length === 1 ? lists[0].id : "";
  if (fallbackId) {
    await saveLastShoppingListId(storage, fallbackId);
  }
  return fallbackId;
}
