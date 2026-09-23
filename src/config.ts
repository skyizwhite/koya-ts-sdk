import type { Field, Model, Schema, Webhook } from "./generated/koya.ts";

/** A schema document (`koyaSchema: 1`), as SCHEMA.md in koya specifies it. */
export function defineSchema(schema: { webhooks?: Webhook[]; models: Model[] }): Schema {
  return { koyaSchema: 1, ...schema };
}

export interface Config {
  /** The server; `KOYA_URL` overrides it. */
  url?: string;
  /** The space the schema is deployed to; `KOYA_SPACE` overrides it. */
  space?: string;
  /** What `koya plan` / `deploy` send, and what `koya types` reads without `--from`. */
  schema?: Schema;
  types?: {
    /** Where `koya types` writes, relative to the config file. Default `koya.gen.ts`. */
    out?: string;
  };
}

/**
 * The shape of `koya.config.ts`. The management key is never in it: the CLI reads
 * it from `KOYA_MANAGEMENT_KEY`.
 */
export function defineConfig(config: Config): Config {
  return config;
}

export type { Field, Model, Schema, Webhook };
