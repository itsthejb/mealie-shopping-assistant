import test from "node:test";
import assert from "node:assert/strict";
import {
  createCheckedItemUpdate,
  createSearchUrl,
  getSubstitutions,
  normalizeSettings,
} from "../src/core.js";

test("encodes search terms for both supported supermarket template formats", () => {
  assert.equal(
    createSearchUrl("https://www.ocado.com/search?q=%s", "button mushrooms"),
    "https://www.ocado.com/search?q=button%20mushrooms",
  );
  assert.equal(
    createSearchUrl("https://shop.example/search/{query}", "crème fraîche"),
    "https://shop.example/search/cr%C3%A8me%20fra%C3%AEche",
  );
});

test("rejects unsafe or ambiguous settings", () => {
  assert.throws(
    () =>
      normalizeSettings({
        mealieUrl: "javascript:alert(1)",
        apiToken: "token",
        supermarketName: "Shop",
        searchUrlTemplate: "https://shop.example/?q=%s",
      }),
    /HTTP or HTTPS/,
  );
  assert.throws(
    () =>
      normalizeSettings({
        mealieUrl: "https://mealie.example",
        apiToken: "token",
        supermarketName: "Shop",
        searchUrlTemplate: "https://shop.example/?q=%s&term={query}",
      }),
    /exactly one/,
  );
});

test("uses named Mealie substitutions and preserves item data when checking it", () => {
  assert.deepEqual(
    getSubstitutions({
      food: {
        substitutions: [
          { substituteFood: { name: "Chickpeas" }, note: "canned" },
          { substituteFood: null },
        ],
      },
    }),
    [{ name: "Chickpeas", note: "canned" }],
  );
  assert.deepEqual(
    createCheckedItemUpdate({
      id: "ignored",
      shoppingListId: "list",
      checked: false,
      position: 4,
      quantity: 2,
      display: "Tomatoes",
      recipeReferences: [],
    }),
    {
      shoppingListId: "list",
      checked: true,
      position: 4,
      quantity: 2,
      foodId: undefined,
      labelId: undefined,
      unitId: undefined,
      extras: undefined,
      food: undefined,
      unit: undefined,
      referencedRecipe: undefined,
      note: undefined,
      display: "Tomatoes",
      recipeReferences: [],
    },
  );
});
