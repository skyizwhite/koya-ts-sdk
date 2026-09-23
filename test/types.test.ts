// Type-level checks: `npm run typecheck` fails when one of these stops holding.
import { test } from "node:test";
import type { Client, Delivered, Media } from "../src/index.ts";
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

declare const client: Client<M>;
async function calls() {
  const page = await client.getList("blog", { fields: ["id", "title"] });
  expect<Equal<keyof (typeof page.contents)[number], "id" | "title">>();
  const settings = await client.getObject("site-settings");
  expect<Equal<typeof settings.maintenance, boolean>>();
  // @ts-expect-error an object model is not listed
  client.getList("site-settings");
  // @ts-expect-error only reference fields can be included
  client.getList("blog", { include: ["title"] });
  // @ts-expect-error nor a media field inside an embedded content
  client.getList("blog", { include: ["author.avatar"] });
  // @ts-expect-error a list model is not an object
  client.getObject("blog");
}
void calls;

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
