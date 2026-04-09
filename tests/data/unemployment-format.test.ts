import test from "node:test";
import assert from "node:assert/strict";
import { formatUnemploymentValue } from "../../lib/data/unemployment.ts";

test("formats unemployment as rate plus claimant count", () => {
  assert.equal(formatUnemploymentValue({ rate: 4.8, count: 3240 }), "4.8% (3,240 people)");
});

test("falls back to rate only or count only when one value is missing", () => {
  assert.equal(formatUnemploymentValue({ rate: 4.8, count: null }), "4.8%");
  assert.equal(formatUnemploymentValue({ rate: null, count: 3240 }), "3,240 people");
  assert.equal(formatUnemploymentValue({ rate: null, count: null }), "Unavailable");
});
