import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreShoppingListSelection,
  saveLastShoppingListId,
} from "../src/list-preference.js";

function createStorage(values = {}) {
  return {
    values,
    async get(key) {
      return { [key]: this.values[key] };
    },
    async set(entries) {
      Object.assign(this.values, entries);
    },
    async remove(key) {
      delete this.values[key];
    },
  };
}

test("persists and restores the last selected list while it remains available", async () => {
  const storage = createStorage();
  await saveLastShoppingListId(storage, "list-b");

  const selected = await restoreShoppingListSelection(storage, [
    { id: "list-a" },
    { id: "list-b" },
  ]);

  assert.equal(selected, "list-b");
  assert.equal(storage.values.lastShoppingListId, "list-b");
});

test("clears a stale list preference and selects only a sole available list", async () => {
  const storage = createStorage({ lastShoppingListId: "removed-list" });

  assert.equal(
    await restoreShoppingListSelection(storage, [{ id: "list-a" }, { id: "list-b" }]),
    "",
  );
  assert.equal(storage.values.lastShoppingListId, undefined);

  storage.values.lastShoppingListId = "removed-list";
  assert.equal(await restoreShoppingListSelection(storage, [{ id: "list-c" }]), "list-c");
  assert.equal(storage.values.lastShoppingListId, "list-c");
});
