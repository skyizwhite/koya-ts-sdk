#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { createAdminClient } from "./admin.ts";
import type { Config } from "./config.ts";
import type { Change, Schema } from "./generated/koya.ts";
import { KoyaError } from "./http.ts";
import { generateTypes } from "./typegen.ts";

const USAGE = `Usage: koya <command> [options]

Commands:
  plan               Show what deploy would change in the space
  deploy             Deploy the config's schema; asks before destructive changes
  pull               Print the space's deployed schema as JSON
  types              Write TypeScript types for the schema

Options:
  -c, --config <file>  Config file (default: koya.config.ts, .mts, .js or .mjs)
      --space <name>   Space, over the config's and KOYA_SPACE
  -f, --force          deploy: apply destructive changes without asking
  -o, --out <file>     pull: write to a file; types: where to write
      --from <source>  types: "config" (default when it has a schema), "server",
                       or a schema JSON file

Environment: KOYA_URL, KOYA_SPACE, KOYA_MANAGEMENT_KEY (a .env file in the
current directory is read when present).`;

const CONFIG_NAMES = ["koya.config.ts", "koya.config.mts", "koya.config.js", "koya.config.mjs"];

class UsageError extends Error {}

async function loadConfig(path: string | undefined): Promise<{ config: Config; dir: string }> {
  const file = path ? resolve(path) : CONFIG_NAMES.map((n) => resolve(n)).find((f) => existsSync(f));
  if (!file) return { config: {}, dir: process.cwd() };
  if (!existsSync(file)) throw new UsageError(`No config file at ${file}`);
  const module = await import(pathToFileURL(file).href);
  return { config: (module.default ?? {}) as Config, dir: dirname(file) };
}

function setting(value: string | undefined, env: string, what: string): string {
  const v = process.env[env] || value;
  if (!v) throw new UsageError(`${what} is not set: give it in koya.config.ts or ${env}`);
  return v;
}

function admin(config: Config, space: string | undefined) {
  return createAdminClient({
    baseUrl: setting(config.url, "KOYA_URL", "The server URL"),
    space: space ?? setting(config.space, "KOYA_SPACE", "The space"),
    managementKey: setting(undefined, "KOYA_MANAGEMENT_KEY", "The management key"),
  });
}

function configSchema(config: Config): Schema {
  if (!config.schema) throw new UsageError("The config has no schema to send");
  return config.schema;
}

function printChanges(changes: readonly Change[]) {
  if (changes.length === 0) console.log("No changes.");
  // the server's description already starts with "!" on a destructive change
  for (const change of changes) console.log(change.destructive ? change.description : `  ${change.description}`);
}

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return /^y(es)?$/i.test((await rl.question(`${question} [y/N] `)).trim());
  } finally {
    rl.close();
  }
}

async function deploy(client: ReturnType<typeof admin>, schema: Schema, force: boolean): Promise<number> {
  try {
    const { applied } = await client.schema.deploy(schema, { force });
    console.log(`Applied ${applied.length} change${applied.length === 1 ? "" : "s"}.`);
    return 0;
  } catch (e) {
    if (!(e instanceof KoyaError && e.code === "destructive_changes")) throw e;
    console.log("The deploy contains destructive changes:");
    printChanges((e.details ?? []) as Change[]);
    if (!(await confirm("Apply them anyway?"))) {
      console.error(process.stdin.isTTY ? "Nothing deployed." : "Nothing deployed; pass --force to apply them.");
      return 1;
    }
    return deploy(client, schema, true);
  }
}

async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      config: { type: "string", short: "c" },
      space: { type: "string" },
      force: { type: "boolean", short: "f", default: false },
      out: { type: "string", short: "o" },
      from: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [command] = positionals;
  if (values.help || !command) {
    console.log(USAGE);
    return values.help ? 0 : 1;
  }
  if (existsSync(".env")) process.loadEnvFile(".env");
  const { config, dir } = await loadConfig(values.config);

  switch (command) {
    case "plan": {
      const plan = await admin(config, values.space).schema.plan(configSchema(config));
      printChanges(plan.changes);
      return 0;
    }
    case "deploy":
      return deploy(admin(config, values.space), configSchema(config), values.force);
    case "pull": {
      const json = JSON.stringify(await admin(config, values.space).schema.get(), null, 2) + "\n";
      if (values.out) await writeFile(values.out, json);
      else process.stdout.write(json);
      return 0;
    }
    case "types": {
      const from = values.from ?? (config.schema ? "config" : "server");
      const schema =
        from === "config"
          ? configSchema(config)
          : from === "server"
            ? await admin(config, values.space).schema.get()
            : (JSON.parse(await readFile(from, "utf8")) as Schema);
      const out = values.out ?? resolve(dir, config.types?.out ?? "koya.gen.ts");
      await writeFile(out, generateTypes(schema));
      console.log(`Wrote ${out}`);
      return 0;
    }
    default:
      throw new UsageError(`Unknown command ${command}\n\n${USAGE}`);
  }
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (e: unknown) => {
    if (e instanceof KoyaError) {
      console.error(`koya: ${e.status} ${e.code}: ${e.message}`);
      if (e.code === "validation_failed" || e.code === "invalid_schema") console.error(JSON.stringify(e.details ?? [], null, 2));
    } else if (e instanceof UsageError || (e instanceof Error && "code" in e && String(e.code).startsWith("ERR_PARSE_ARGS"))) {
      console.error(`koya: ${e.message}`);
    } else {
      console.error(e);
    }
    process.exit(1);
  },
);
