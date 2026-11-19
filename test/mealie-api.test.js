import test from "node:test";
import assert from "node:assert/strict";
import {
  getShoppingList,
  getShoppingLists,
  markShoppingItemChecked,
} from "../src/mealie-api.js";

test("uses Mealie shopping list and item endpoints with Bearer authentication", async () => {
  const requests = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ items: [], listItems: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  try {
    const settings = { mealieUrl: "https://mealie.example", apiToken: "local-token" };
    assert.deepEqual(await getShoppingLists(settings), []);
    assert.deepEqual(await getShoppingList(settings, "list/id"), []);
    await markShoppingItemChecked(settings, "item/id", {
      shoppingListId: "list",
      checked: true,
    });

    assert.deepEqual(
      requests.map(({ url, options }) => [url, options.method || "GET"]),
      [
        ["https://mealie.example/api/households/shopping/lists?page=1&perPage=-1", "GET"],
        ["https://mealie.example/api/households/shopping/lists/list%2Fid", "GET"],
        ["https://mealie.example/api/households/shopping/items/item%2Fid", "PUT"],
      ],
    );
    assert.ok(requests.every(({ options }) => options.headers.Authorization === "Bearer local-token"));
    assert.deepEqual(JSON.parse(requests[2].options.body), {
      shoppingListId: "list",
      checked: true,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
