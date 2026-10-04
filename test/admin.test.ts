import assert from "node:assert/strict";
import { test } from "node:test";
import { createAdminClient, defineSchema } from "../src/index.ts";
import type { KoyaModels } from "./fixtures/koya.gen.ts";
import { mockFetch } from "./support.ts";

const options = { baseUrl: "https://cms.example.com", space: "website", managementKey: "koya_mgmt_x" };
const schema = defineSchema({ models: [{ name: "tag", kind: "list", fields: [{ name: "name", type: "text" }] }] });

test("the admin API is called with the management key as a Bearer token", async () => {
  const { fetch, calls } = mockFetch({ body: { owner: false, management: true, space: "website", version: "0.8.0" } });
  const me = await createAdminClient({ ...options, fetch }).me();
  assert.equal(me.space, "website");
  assert.equal(calls[0]?.url.pathname, "/admin/api/me");
  assert.equal(calls[0]?.headers.get("authorization"), "Bearer koya_mgmt_x");
  assert.equal(calls[0]?.headers.get("x-koya-delivery-key"), null);
});

test("deploy sends the schema, with force=true only when asked", async () => {
  const answer = { body: { applied: [], schema } };
  const { fetch, calls } = mockFetch(answer, answer);
  const admin = createAdminClient({ ...options, fetch });
  await admin.schema.deploy(schema);
  await admin.schema.deploy(schema, { force: true });
  assert.equal(calls[0]?.method, "PUT");
  assert.equal(calls[0]?.url.pathname, "/admin/api/website/schema");
  assert.equal(calls[0]?.url.search, "");
  assert.equal(calls[1]?.url.searchParams.get("force"), "true");
  assert.deepEqual(JSON.parse(String(calls[0]?.body)), schema);
});

test("content writes send what the admin API takes", async () => {
  const { fetch, calls } = mockFetch({ status: 201, body: {} }, { body: {} }, { body: {} }, { body: { draftKey: "dk" } });
  const admin = createAdminClient<KoyaModels>({ ...options, fetch });
  await admin.contents.create("blog", { title: "Hello", tags: ["t1"] }, { publish: true, id: "hello" });
  await admin.contents.updateDraft("blog", "hello", { slug: null });
  await admin.contents.publish("blog", "hello", { publishedAt: "2026-09-20T00:00:00.000Z" });
  assert.equal(await admin.contents.draftKey("blog", "hello"), "dk");
  assert.equal(calls[0]?.url.pathname, "/admin/api/website/lists/blog");
  assert.deepEqual(JSON.parse(String(calls[0]?.body)), { data: { title: "Hello", tags: ["t1"] }, publish: true, id: "hello" });
  assert.equal(calls[1]?.method, "PATCH");
  assert.deepEqual(JSON.parse(String(calls[1]?.body)), { data: { slug: null } });
  assert.equal(calls[2]?.url.pathname, "/admin/api/website/lists/blog/hello/publish");
  assert.equal(calls[3]?.url.pathname, "/admin/api/website/lists/blog/hello/draft-key");
});

test("an object model's content is reached through its model, without an id", async () => {
  const { fetch, calls } = mockFetch(
    { body: {} }, { body: {} }, { body: {} }, { body: {} }, { body: {} }, { body: { draftKey: "dk" } },
  );
  const admin = createAdminClient<KoyaModels>({ ...options, fetch });
  await admin.objects.get("site-settings");
  await admin.objects.save("site-settings", { maintenance: true });
  await admin.objects.publish("site-settings", { data: { maintenance: true }, publishedAt: "2026-10-05T00:00:00.000Z" });
  await admin.objects.unpublish("site-settings");
  await admin.objects.discardDraft("site-settings");
  assert.equal(await admin.objects.draftKey("site-settings"), "dk");
  const base = "/admin/api/website/objects/site-settings";
  assert.deepEqual(
    calls.map((c) => `${c.method} ${c.url.pathname}`),
    [`GET ${base}`, `PATCH ${base}`, `POST ${base}/publish`, `POST ${base}/unpublish`, `POST ${base}/discard-draft`, `POST ${base}/draft-key`],
  );
  assert.deepEqual(JSON.parse(String(calls[1]?.body)), { data: { maintenance: true } });
  assert.deepEqual(JSON.parse(String(calls[2]?.body)), { data: { maintenance: true }, publishedAt: "2026-10-05T00:00:00.000Z" });
});

test("the admin list searches with q", async () => {
  const { fetch, calls } = mockFetch({ body: { contents: [], totalCount: 0, offset: 0, limit: 10 } });
  await createAdminClient<KoyaModels>({ ...options, fetch }).contents.list("blog", { q: "macros", filters: "title[exists]" });
  assert.equal(calls[0]?.url.pathname, "/admin/api/website/lists/blog");
  assert.deepEqual(Object.fromEntries(calls[0]!.url.searchParams), { q: "macros", filters: "title[exists]" });
});

test("media upload is multipart with one file part per file", async () => {
  const { fetch, calls } = mockFetch({ status: 201, body: { media: [{ id: "m1" }, { id: "m2" }] } });
  const admin = createAdminClient({ ...options, fetch });
  const media = await admin.media.upload([new File(["a"], "a.png"), new File(["b"], "b.png")], { alt: "Cover" });
  assert.deepEqual(media.map((m) => m.id), ["m1", "m2"]);
  const form = calls[0]?.body;
  assert.ok(form instanceof FormData);
  assert.deepEqual(form.getAll("file").map((f) => (f as File).name), ["a.png", "b.png"]);
  assert.equal(form.get("alt"), "Cover");
});
