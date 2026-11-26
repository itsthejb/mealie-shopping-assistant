import test from "node:test";
import assert from "node:assert/strict";
import { startCelebration } from "../src/celebration.js";

function createCelebrationFixture() {
  const classes = new Set();
  const layer = {
    children: [],
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
    },
    replaceChildren() {
      this.children = [];
    },
    append(child) {
      this.children.push(child);
    },
    get offsetWidth() {
      return 100;
    },
  };
  const document = {
    createElement() {
      return { style: { setProperty() {} } };
    },
  };
  return { layer, document, classes };
}

test("starts ticker-tape animation on the celebration layer", () => {
  const { layer, document, classes } = createCelebrationFixture();

  startCelebration(layer, document, false);

  assert.equal(layer.children.length, 18);
  assert.ok(layer.children.every((tape) => tape.className === "ticker-tape"));
  assert.ok(classes.has("celebrating"));
});

test("does not create animated elements when reduced motion is preferred", () => {
  const { layer, document, classes } = createCelebrationFixture();

  startCelebration(layer, document, true);

  assert.equal(layer.children.length, 0);
  assert.ok(!classes.has("celebrating"));
});
