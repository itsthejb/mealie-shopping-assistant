import test from "node:test";
import assert from "node:assert/strict";
import { shouldCelebrateCompletion } from "../src/core.js";

test("celebrates only a normally completed, fully checked list without reduced motion", () => {
  const checkedItems = [{ checked: true }, { checked: true }];

  assert.equal(shouldCelebrateCompletion(checkedItems, true, false), true);
  assert.equal(shouldCelebrateCompletion([{ checked: true }, { checked: false }], true, false), false);
  assert.equal(shouldCelebrateCompletion(checkedItems, false, false), false);
  assert.equal(shouldCelebrateCompletion(checkedItems, true, true), false);
  assert.equal(shouldCelebrateCompletion([], true, false), false);
});
