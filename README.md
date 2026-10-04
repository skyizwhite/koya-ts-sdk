# koya-ts-sdk

A TypeScript client for [koya](https://github.com/skyizwhite/koya), a
self-hosted headless CMS:

- **Delivery API** — `getList` / `getItem` / `getObject`, typed by model,
  `include` and `fields` included.
- **Admin API** — schema, contents, delivery keys and media, with a management key.
- **A `koya` CLI** — `plan`, `deploy`, `pull` and `types`, to run from npm scripts.

ESM, nothing at runtime but `fetch`: Node 22.18+, Deno, Bun, edge runtimes.

```sh
npm install github:skyizwhite/koya-ts-sdk#v0.4.0
```

It is not on the npm registry yet. npm builds `dist/` on install, so the first
one takes a moment.

## Reading content

```ts
import { createClient } from "koya-ts-sdk";
import type { KoyaModels } from "./koya.gen.ts";

const koya = createClient<KoyaModels>({
  baseUrl: "https://cms.example.com",
  space: "website",
  deliveryKey: process.env.KOYA_DELIVERY_KEY!,
});

const { contents, totalCount } = await koya.getList("blog", {
  limit: 10,
  orders: ["-publishedAt"],
  filters: "title[contains]lisp",
  include: ["tags", "author.team"], // embeds tags, author, and team inside author
});
contents[0]?.tags; // the tag contents; ids when not included

const found = await koya.getList("blog", { q: "macros" }); // the text fields, rich text as its text, or a whole id

const post = await koya.getItem("blog", id, { draftKey }); // a draft, for previews
const about = await koya.getObject("about");
```

`createClient` works on a server and in a browser: the delivery API answers
cross-origin requests from any site. A delivery key in a page can be read by
anyone who loads it, and it reads only what is published. Keep draft keys on
preview pages.

`KoyaModels` is what `koya types` writes (below). Without it every model and
field is accepted and every content is `{ [field: string]: unknown }`.

A reference inside a custom field or a repeater's rows is included through it:
`include: ["meta.author", "blocks.by"]` embeds `author` in `meta`, and `by` in
each row that has it.

`fields` narrows the result type too: `fields: ["title"]` gives `{ title }`
with the system fields (`id`, `createdAt`, `updatedAt`, `publishedAt`,
`revisedAt`), which are always delivered. Errors are thrown as `KoyaError` with the server's `status`,
`code`, `message` and `details`.

## Managing content

The management key can change everything in its space: use it on a server only.

```ts
import { createAdminClient } from "koya-ts-sdk";
import { openAsBlob } from "node:fs";

const admin = createAdminClient<KoyaModels>({
  baseUrl: "https://cms.example.com",
  space: "website",
  managementKey: process.env.KOYA_MANAGEMENT_KEY!,
});

const [cover] = await admin.media.upload(new File([await openAsBlob("cover.png")], "cover.png"), { alt: "Cover" });
const post = await admin.contents.create("blog", { title: "Hello", cover: cover!.id }); // a draft
await admin.contents.updateDraft("blog", post.id, { slug: null }); // null removes a key
await admin.contents.publish("blog", post.id);

await admin.objects.save("about", { body: "<p>Hi</p>" }); // an object model's content: no id
await admin.objects.publish("about");
```

| | |
|---|---|
| `admin.me()` | the key's space and the server version |
| `admin.schema` | `get`, `plan(schema)`, `deploy(schema, { force })` |
| `admin.contents` | a `list` model's contents: `list` (with `q`), `get`, `create`, `updateDraft`, `publish`, `unpublish`, `discardDraft`, `delete`, `draftKey` |
| `admin.objects` | an `object` model's content, through the model: `get`, `save` (the first save makes it), `publish`, `unpublish`, `discardDraft`, `draftKey` |
| `admin.deliveryKeys` | `list` (with the webhook secret), `create(label)`, `delete(id)` |
| `admin.media` | `list`, `get`, `upload`, `update(id, { alt })`, `delete` |

## The CLI

`koya.config.ts` at the project root holds the schema, when the project owns it:

```ts
import { defineConfig, defineSchema } from "koya-ts-sdk";

export default defineConfig({
  url: "https://cms.example.com",
  space: "website",
  schema: defineSchema({
    webhooks: [{ label: "revalidate", url: "https://example.com/api/revalidate" }],
    models: [
      {
        name: "blog",
        kind: "list",
        label: "title",
        fields: [
          { name: "title", type: "text", required: true },
          { name: "slug", type: "slug", from: "title", unique: true },
          { name: "tags", type: "reference", model: "tag", many: true },
          { name: "gallery", type: "media", many: true },
          { name: "meta", type: "custom", customField: "seo" },
          { name: "blocks", type: "repeater", customFields: ["heading", "quote"] },
        ],
      },
      { name: "tag", kind: "list", fields: [{ name: "name", type: "text", required: true }] },
    ],
    customFields: [
      { name: "seo", fields: [{ name: "title", type: "text" }, { name: "image", type: "media", help: "1200x630" }] },
      { name: "heading", fields: [{ name: "text", type: "text", required: true }] },
      { name: "quote", fields: [{ name: "text", type: "textarea" }, { name: "by", type: "text" }] },
    ],
  }),
  types: { out: "src/koya.gen.ts" },
});
```

The document is the one koya's
[SCHEMA.md](https://github.com/skyizwhite/koya/blob/master/docs/SCHEMA.md)
specifies, typed field by field. The space itself is made in koya's admin UI.

A custom field is a set of fields defined once in `customFields`: a `custom`
field holds one of them as an object, and a `repeater` holds any number of rows,
each naming its custom field in `fieldId`. A `media` field with `many` holds
several files in order. `help` on any field is shown under it in the editor,
and on the generated property.

`koya types` types a custom field's value as its own `<Name>Data` /
`<Name>Fields` pair (`SeoData`, `SeoFields`), a repeater's as an array of
`{ fieldId: "heading" } & HeadingData` rows, and a `many` media field's as
`Media[]` when delivered: a file that is gone drops out.

```json
{
  "scripts": {
    "koya:plan": "koya plan",
    "koya:deploy": "koya deploy",
    "koya:types": "koya types"
  }
}
```

| Command | |
|---|---|
| `koya plan` | what `deploy` would change; `!` marks a destructive change, and the contents a tightened option would leave out of fit are listed under it |
| `koya deploy` | deploys the schema. Destructive changes are asked about on a terminal and refused elsewhere, unless `--force`; while stored contents do not fit, it is refused whatever `--force` says |
| `koya pull [-o file]` | the deployed schema as JSON |
| `koya types [--from config\|server\|file.json] [-o file]` | writes `KoyaModels` and a `<Name>Data` / `<Name>Fields` pair per model and per custom field a model uses |

`types` reads the config's schema when it has one, the server's otherwise — so a
project whose schema lives elsewhere (a Lisp site, say) can still type its content.

The CLI reads `KOYA_URL`, `KOYA_SPACE` and `KOYA_MANAGEMENT_KEY`, over the
config's `url` and `space`, and a `.env` in the current directory. The
management key is only ever read from the environment.

## Developing

Node comes from [devbox](https://www.jetify.com/devbox): `devbox shell`, or
prefix commands with `devbox run --`.

```sh
npm install
npm run openapi:sync [-- ../koya/docs/openapi.yaml]   # default: koya's master on GitHub
npm run generate    # openapi/koya.yaml -> src/generated/koya.ts (orval)
npm test
npm run typecheck   # also checks the type-level tests in test/types.test.ts
npm run build
```

`src/generated/` is generated from koya's OpenAPI document and checked in; the
hand-written layer over it is `client.ts`, `admin.ts`, `models.ts`, `typegen.ts`
and `cli.ts`. Every generated call goes through `koyaFetch` in `http.ts`, which
adds the key the path needs and turns error answers into `KoyaError`.

## License

MIT
