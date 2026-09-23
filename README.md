# koya-ts-sdk

A TypeScript client for [koya](https://github.com/skyizwhite/koya), a
self-hosted headless CMS:

- **Delivery API** — `getList` / `getItem` / `getObject`, typed by model,
  `include` and `fields` included.
- **Admin API** — schema, contents, delivery keys and media, with a management key.
- **A `koya` CLI** — `plan`, `deploy`, `pull` and `types`, to run from npm scripts.

ESM, nothing at runtime but `fetch`: Node 22.18+, Deno, Bun, edge runtimes.

```sh
npm install koya-ts-sdk
```

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

const post = await koya.getItem("blog", id, { draftKey }); // a draft, for previews
const about = await koya.getObject("about");
```

`KoyaModels` is what `koya types` writes (below). Without it every model and
field is accepted and every content is `{ [field: string]: unknown }`.

`fields` narrows the result type too: `fields: ["id", "title"]` gives
`{ id; title }`. Errors are thrown as `KoyaError` with the server's `status`,
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
```

| | |
|---|---|
| `admin.me()` | the key's space and the server version |
| `admin.schema` | `get`, `plan(schema)`, `deploy(schema, { force })` |
| `admin.contents` | `list`, `get`, `create`, `updateDraft`, `publish`, `unpublish`, `discardDraft`, `delete`, `draftKey` |
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
        ],
      },
      { name: "tag", kind: "list", fields: [{ name: "name", type: "text", required: true }] },
    ],
  }),
  types: { out: "src/koya.gen.ts" },
});
```

The document is the one koya's
[SCHEMA.md](https://github.com/skyizwhite/koya/blob/master/docs/SCHEMA.md)
specifies, typed field by field. The space itself is made in koya's admin UI.

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
| `koya plan` | what `deploy` would change; `!` marks a destructive change |
| `koya deploy` | deploys the schema. Destructive changes are asked about on a terminal and refused elsewhere, unless `--force` |
| `koya pull [-o file]` | the deployed schema as JSON |
| `koya types [--from config\|server\|file.json] [-o file]` | writes `KoyaModels` and a `<Model>Data` / `<Model>Fields` pair per model |

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
