// Type-level checks: `npm run typecheck` fails when one of these stops holding.
import { test } from "node:test";
import type { AdminClient, Client, Delivered, Media } from "../src/index.ts";
import type { KoyaModels } from "./fixtures/koya.gen.ts";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
function expect<T extends true>(): void {}

type M = KoyaModels;
type Blog = Delivered<M, "blog">;
type BlogWithTags = Delivered<M, "blog", "tags" | "author.mentor">;

expect<Equal<Blog["tags"], string[] | null | undefined>>();
expect<Equal<Blog["cover"], Media | null | undefined>>();
expect<Equal<Blog["publishedAt"], string | null>>();
expect<Equal<BlogWithTags["tags"], Delivered<M, "tag">[] | null | undefined>>();
// author.mentor embeds author, and the mentor inside it
expect<Equal<NonNullable<BlogWithTags["author"]>["mentor"], Delivered<M, "author"> | null | undefined>>();
expect<Equal<Delivered<M, "blog", "tags">["author"], string | null | undefined>>();
expect<Equal<Delivered<M, "author", "mentor.mentor">["mentor"], Delivered<M, "author", "mentor"> | null | undefined>>();

// custom fields and repeaters: media expanded when delivered, references ids unless included through them
expect<Equal<Blog["gallery"], Media[] | null | undefined>>();
expect<Equal<M["blog"]["data"]["gallery"], string[] | null | undefined>>();
expect<Equal<NonNullable<Blog["meta"]>["image"], Media | null | undefined>>();
expect<Equal<NonNullable<Blog["meta"]>["author"], string | null | undefined>>();
expect<Equal<NonNullable<Delivered<M, "blog", "meta.author.mentor">["meta"]>["author"], Delivered<M, "author", "mentor"> | null | undefined>>();
type Block = Blog["blocks"][number];
expect<Equal<Extract<Block, { fieldId: "quote" }>["by"], string[] | null | undefined>>();
type BlockWithBy = Delivered<M, "blog", "blocks.by">["blocks"][number];
expect<Equal<Extract<BlockWithBy, { fieldId: "quote" }>["by"], Delivered<M, "author">[] | null | undefined>>();
expect<Equal<Extract<BlockWithBy, { fieldId: "heading" }>["text"], string>>();
expect<Equal<M["blog"]["data"]["blocks"][number]["fieldId"], "heading" | "quote">>();

declare const client: Client<M>;
async function calls() {
  const page = await client.getList("blog", { fields: ["title"] });
  // fields narrows the content's own fields; the system fields are always there
  expect<Equal<keyof (typeof page.contents)[number], "id" | "createdAt" | "updatedAt" | "publishedAt" | "revisedAt" | "title">>();
  const settings = await client.getObject("site-settings");
  expect<Equal<typeof settings.maintenance, boolean>>();
  // @ts-expect-error an object model is not listed
  client.getList("site-settings");
  // @ts-expect-error only reference fields can be included
  client.getList("blog", { include: ["title"] });
  // @ts-expect-error nor a media field inside an embedded content
  client.getList("blog", { include: ["author.avatar"] });
  client.getList("blog", { include: ["meta.author.mentor", "blocks.by"] });
  // @ts-expect-error a custom field is included through its references, not whole
  client.getList("blog", { include: ["meta"] });
  // @ts-expect-error nor a repeater
  client.getList("blog", { include: ["blocks"] });
  // @ts-expect-error a list model is not an object
  client.getObject("blog");
}
void calls;

declare const admin: AdminClient<M>;
async function adminCalls() {
  const settings = await admin.objects.get("site-settings");
  expect<Equal<typeof settings.published, M["site-settings"]["data"] | null>>();
  await admin.objects.save("site-settings", { maintenance: true });
  // @ts-expect-error a list model's contents are reached through their ids
  admin.objects.get("blog");
  // @ts-expect-error an object model's content is reached through the model
  admin.contents.get("site-settings", "id");
  // @ts-expect-error nor made as one of many
  admin.contents.create("site-settings", {});
}
void adminCalls;

declare const untyped: Client;
async function untypedCalls() {
  const page = await untyped.getList("anything", { include: ["a.b"], fields: ["id", "x"] });
  expect<Equal<(typeof page.contents)[number]["x"], unknown>>();
  const item = await untyped.getItem("anything", "id");
  expect<Equal<typeof item.id, string>>();
  await untyped.getObject("settings");
}
void untypedCalls;

test("types hold (checked by tsc)", () => {});
