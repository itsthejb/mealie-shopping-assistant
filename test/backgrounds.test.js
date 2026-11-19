import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseRandomBackground,
  CURATED_BACKGROUNDS,
  DEFAULT_BACKGROUND_THEME,
} from "../src/backgrounds.js";

test("randomly chooses from curated direct Unsplash photo URLs", () => {
  assert.equal(DEFAULT_BACKGROUND_THEME, "supermarket, food");
  assert.ok(CURATED_BACKGROUNDS.length >= 3);
  assert.ok(CURATED_BACKGROUNDS.every(({ imageUrl }) =>
    imageUrl.startsWith("https://images.unsplash.com/photo-"),
  ));
  assert.equal(chooseRandomBackground(() => 0), CURATED_BACKGROUNDS[0]);
  assert.equal(
    chooseRandomBackground(() => 0.999),
    CURATED_BACKGROUNDS[CURATED_BACKGROUNDS.length - 1],
  );
});
