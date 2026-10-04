import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { defineSchema, generateTypes } from "../src/index.ts";
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

test("a custom field and a model that would share a type name are refused", () => {
  const schema = defineSchema({
    models: [{ name: "seo", kind: "object", fields: [{ name: "meta", type: "custom", customField: "seo" }] }],
    customFields: [{ name: "seo", fields: [{ name: "title", type: "text" }] }],
  });
  assert.throws(() => generateTypes(schema), /model seo and custom field seo would both be typed Seo/);
});

test("only the custom fields a model uses are typed", () => {
  const schema = defineSchema({
    models: [{ name: "page", kind: "list", fields: [{ name: "blocks", type: "repeater", customFields: ["heading"] }] }],
    customFields: [
      { name: "heading", fields: [{ name: "text", type: "text" }] },
      { name: "footer", fields: [{ name: "note", type: "text" }] },
    ],
  });
  const types = generateTypes(schema);
  assert.match(types, /export interface HeadingData /);
  assert.doesNotMatch(types, /Footer/);
});
