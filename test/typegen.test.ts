import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { generateTypes } from "../src/index.ts";
import type { Schema } from "../src/index.ts";

const fixture = (name: string) => new URL(`./fixtures/${name}`, import.meta.url);

test("the types for the fixture schema are the checked-in ones", async () => {
  const schema = JSON.parse(await readFile(fixture("schema.json"), "utf8")) as Schema;
  const expected = await readFile(fixture("koya.gen.ts"), "utf8");
  assert.equal(generateTypes(schema, { from: "../../src/index.ts" }), expected);
});

test("two models that would share a type name are refused", () => {
  const schema: Schema = { koyaSchema: 1, models: [{ name: "v-2", kind: "list" }, { name: "v2", kind: "list" }] };
  assert.throws(() => generateTypes(schema), /v-2 and v2 would both be typed V2/);
});
