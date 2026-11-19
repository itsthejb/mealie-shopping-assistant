import test from "node:test";
import assert from "node:assert/strict";
import { navigateSearchTab } from "../src/search-tab.js";

function createStorage(values = {}) {
  return {
    values,
    async get(key) {
      return { [key]: this.values[key] };
    },
    async set(entries) {
      Object.assign(this.values, entries);
    },
  };
}

test("opens one separate search tab and reuses it for later searches", async () => {
  const storage = createStorage();
  const created = [];
  const updated = [];
  const tabs = {
    async create(properties) {
      created.push(properties);
      return { id: 17 };
    },
    async update(id, properties) {
      updated.push({ id, properties });
      return { id };
    },
  };

  assert.equal(await navigateSearchTab(tabs, storage, "https://shop.example/search?q=first"), 17);
  assert.equal(
    await navigateSearchTab(tabs, storage, "https://shop.example/search?q=next"),
    17,
  );
  assert.deepEqual(created, [{ url: "https://shop.example/search?q=first", active: true }]);
  assert.deepEqual(updated, [
    { id: 17, properties: { url: "https://shop.example/search?q=next", active: true } },
  ]);
  assert.equal(storage.values.supermarketSearchTabId, 17);
});

test("opens and remembers a replacement when the remembered search tab was closed", async () => {
  const storage = createStorage({ supermarketSearchTabId: 17 });
  const created = [];
  const tabs = {
    async update(id) {
      assert.equal(id, 17);
      throw new Error("No tab with id: 17.");
    },
    async create(properties) {
      created.push(properties);
      return { id: 23 };
    },
  };

  assert.equal(
    await navigateSearchTab(tabs, storage, "https://shop.example/search?q=replacement"),
    23,
  );
  assert.deepEqual(created, [
    { url: "https://shop.example/search?q=replacement", active: true },
  ]);
  assert.equal(storage.values.supermarketSearchTabId, 23);
});

test("serializes overlapping searches into one tab", async () => {
  const storage = createStorage();
  const created = [];
  const updated = [];
  const tabs = {
    async create(properties) {
      created.push(properties);
      return { id: 31 };
    },
    async update(id, properties) {
      updated.push({ id, properties });
      return { id };
    },
  };

  await Promise.all([
    navigateSearchTab(tabs, storage, "https://shop.example/search?q=first"),
    navigateSearchTab(tabs, storage, "https://shop.example/search?q=second"),
  ]);

  assert.equal(created.length, 1);
  assert.equal(updated.length, 1);
  assert.equal(updated[0].id, 31);
  assert.equal(updated[0].properties.active, true);
});
