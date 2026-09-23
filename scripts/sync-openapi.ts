// Copies koya's OpenAPI document into openapi/koya.yaml, which `npm run generate`
// reads. The source is the first argument, a path or a URL; by default koya's
// master branch on GitHub.
import { readFile, writeFile } from "node:fs/promises";

const DEFAULT = "https://raw.githubusercontent.com/skyizwhite/koya/master/docs/openapi.yaml";
const source = process.argv[2] ?? DEFAULT;

let text: string;
if (/^https?:\/\//.test(source)) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`${source}: HTTP ${response.status}`);
  text = await response.text();
} else {
  text = await readFile(source, "utf8");
}
if (!/^openapi: 3\./m.test(text)) throw new Error(`${source} is not an OpenAPI 3 document`);

await writeFile(new URL("../openapi/koya.yaml", import.meta.url), text);
const version = /^\s+version: (\S+)/m.exec(text)?.[1];
console.log(`openapi/koya.yaml <- ${source} (koya ${version ?? "?"})`);
