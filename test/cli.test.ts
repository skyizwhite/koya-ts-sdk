import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../src/cli.ts", import.meta.url));
const sdk = fileURLToPath(new URL("../src/index.ts", import.meta.url));

const destructive = { op: "remove_field", path: "tag.slug", destructive: true, description: "! - tag.slug (slug)" };
const requests: Array<{ method: string; url: string; auth: string | undefined; body: string }> = [];

const server = createServer(async (req, res) => {
  let body = "";
  for await (const chunk of req) body += chunk;
  requests.push({ method: req.method!, url: req.url!, auth: req.headers.authorization, body });
  const send = (status: number, value: unknown) => {
    res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(value));
  };
  if (req.method === "POST" && req.url === "/admin/api/schema/site/plan") {
    return send(200, { changes: [{ op: "add_model", path: "tag", destructive: false, description: "+ tag" }, destructive], destructive: true });
  }
  if (req.method === "PUT" && req.url === "/admin/api/schema/site") {
    return send(409, { error: { code: "destructive_changes", message: "retry with force=true", details: [destructive] } });
  }
  if (req.method === "PUT" && req.url === "/admin/api/schema/site?force=true") {
    return send(200, { applied: [destructive], schema: JSON.parse(body) });
  }
  if (req.method === "GET" && req.url === "/admin/api/schema/site") {
    return send(200, { koyaSchema: 1, models: [{ name: "tag", kind: "list", fields: [{ name: "name", type: "text" }] }] });
  }
  send(404, { error: { code: "not_found", message: "No such endpoint" } });
});

let dir: string;
let env: NodeJS.ProcessEnv;

before(async () => {
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address() as AddressInfo;
  dir = await mkdtemp(join(tmpdir(), "koya-cli-"));
  await writeFile(
    join(dir, "koya.config.ts"),
    `import { defineConfig, defineSchema } from ${JSON.stringify(sdk)};
export default defineConfig({
  space: "site",
  schema: defineSchema({ models: [{ name: "tag", kind: "list", fields: [{ name: "name", type: "text", required: true }] }] }),
  types: { out: "src/koya.gen.ts" },
});
`,
  );
  await import("node:fs/promises").then((fs) => fs.mkdir(join(dir, "src")));
  env = { ...process.env, KOYA_URL: `http://127.0.0.1:${port}`, KOYA_MANAGEMENT_KEY: "koya_mgmt_t", KOYA_SPACE: "" };
});

after(() => server.close());

function run(...args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((done) => {
    execFile(process.execPath, [cli, ...args], { cwd: dir, env }, (error, stdout, stderr) =>
      done({ code: error ? Number(error.code ?? 1) : 0, stdout, stderr }),
    );
  });
}

test("plan prints each change, destructive ones marked", async () => {
  const { code, stdout } = await run("plan");
  assert.equal(code, 0);
  assert.equal(stdout, "  + tag\n! - tag.slug (slug)\n");
  assert.equal(requests.at(-1)?.auth, "Bearer koya_mgmt_t");
});

test("deploy without a terminal refuses destructive changes", async () => {
  const { code, stdout, stderr } = await run("deploy");
  assert.equal(code, 1);
  assert.match(stdout, /destructive changes/);
  assert.match(stderr, /pass --force/);
});

test("deploy --force applies them", async () => {
  const { code, stdout } = await run("deploy", "--force");
  assert.equal(code, 0);
  assert.equal(stdout, "Applied 1 change.\n");
  assert.equal(JSON.parse(requests.at(-1)!.body).koyaSchema, 1);
});

test("pull prints the deployed schema", async () => {
  const { code, stdout } = await run("pull");
  assert.equal(code, 0);
  assert.equal(JSON.parse(stdout).models[0].name, "tag");
});

test("types writes where the config says, from the config's schema or the server", async () => {
  assert.equal((await run("types")).code, 0);
  assert.match(await readFile(join(dir, "src/koya.gen.ts"), "utf8"), /name: string;/);
  assert.equal((await run("types", "--from", "server", "-o", "server.gen.ts")).code, 0);
  assert.match(await readFile(join(dir, "server.gen.ts"), "utf8"), /name\?: string \| null;/);
});

test("a missing management key is reported without a stack trace", async () => {
  const saved = env.KOYA_MANAGEMENT_KEY;
  env.KOYA_MANAGEMENT_KEY = "";
  const { code, stderr } = await run("plan");
  env.KOYA_MANAGEMENT_KEY = saved;
  assert.equal(code, 1);
  assert.equal(stderr, "koya: The management key is not set: give it in koya.config.ts or KOYA_MANAGEMENT_KEY\n");
});
