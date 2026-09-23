import assert from "node:assert/strict";
import { test } from "node:test";
import { createClient, KoyaError } from "../src/index.ts";
import type { KoyaModels } from "./fixtures/koya.gen.ts";
import { mockFetch } from "./support.ts";

const options = { baseUrl: "https://cms.example.com/", space: "website", deliveryKey: "koya_d" };

test("getList sends the delivery key and joins list parameters", async () => {
  const { fetch, calls } = mockFetch({ body: { contents: [], totalCount: 0, offset: 0, limit: 5 } });
  const client = createClient<KoyaModels>({ ...options, fetch });
  const page = await client.getList("blog", {
    limit: 5,
    orders: ["-publishedAt", "title"],
    filters: "title[contains]lisp",
    include: ["tags", "author.mentor"],
    fields: ["id", "title", "tags", "author"],
  });
  assert.equal(page.totalCount, 0);
  const [call] = calls;
  assert.equal(call?.url.origin + call!.url.pathname, "https://cms.example.com/api/v1/website/blog");
  assert.equal(call?.headers.get("x-koya-delivery-key"), "koya_d");
  assert.deepEqual(Object.fromEntries(call!.url.searchParams), {
    limit: "5",
    orders: "-publishedAt,title",
    filters: "title[contains]lisp",
    include: "tags,author.mentor",
    fields: "id,title,tags,author",
  });
});

test("getItem and getObject address the content and pass the draft key", async () => {
  const { fetch, calls } = mockFetch({ body: { id: "a" } }, { body: { id: "b" } });
  const client = createClient<KoyaModels>({ ...options, fetch });
  await client.getItem("blog", "a", { draftKey: "dk" });
  await client.getObject("site-settings");
  assert.equal(calls[0]?.url.pathname, "/api/v1/website/blog/a");
  assert.equal(calls[0]?.url.searchParams.get("draftKey"), "dk");
  assert.equal(calls[1]?.url.pathname, "/api/v1/website/site-settings");
  assert.equal(calls[1]?.url.search, "");
});

test("an error answer becomes a KoyaError with the server's code", async () => {
  const { fetch } = mockFetch({ status: 400, body: { error: { code: "bad_query", message: "unknown field \"x\"" } } });
  const client = createClient({ ...options, fetch });
  await assert.rejects(client.getList("blog", { orders: "x" }), (e: unknown) => {
    assert.ok(e instanceof KoyaError);
    assert.equal(e.status, 400);
    assert.equal(e.code, "bad_query");
    assert.equal(e.message, 'unknown field "x"');
    return true;
  });
});

test("a non-JSON error still becomes a KoyaError", async () => {
  const fetch = (async () => new Response("Bad Gateway", { status: 502 })) as typeof globalThis.fetch;
  const client = createClient({ ...options, fetch });
  await assert.rejects(client.getItem("blog", "a"), { name: "KoyaError", status: 502, code: "http_error" });
});
