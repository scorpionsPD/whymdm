/**
 * Validates every entry in data/entries against the schema and writes data/whymdm.json.
 * Fails (exit 1) on any invalid entry, duplicate, or file whose path doesn't match its domain/code.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { parse } from "yaml";
import type { Dataset, Entry } from "../src/types.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entriesDir = join(root, "data", "entries");
const schema = JSON.parse(readFileSync(join(root, "data", "schema", "entry.schema.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

function yamlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return yamlFiles(path);
    return name.endsWith(".yaml") ? [path] : [];
  });
}

const problems: string[] = [];
const entries: Entry[] = [];
const seen = new Map<string, string>();

for (const file of yamlFiles(entriesDir).sort()) {
  const rel = relative(root, file);
  let data: unknown;
  try {
    data = parse(readFileSync(file, "utf8"));
  } catch (err) {
    problems.push(`${rel}: invalid YAML (${(err as Error).message})`);
    continue;
  }
  if (!validate(data)) {
    for (const e of validate.errors ?? []) problems.push(`${rel}: ${e.instancePath || "(root)"} ${e.message}`);
    continue;
  }
  const entry = data as Entry;
  const expectedDir = basename(dirname(file));
  const expectedName = `${entry.code}.yaml`;
  if (expectedDir !== entry.domain || basename(file) !== expectedName) {
    problems.push(`${rel}: should be data/entries/${entry.domain}/${expectedName}`);
  }
  if (entry.confidence !== "name-only" && !entry.summary) {
    problems.push(`${rel}: a summary is required unless confidence is name-only`);
  }
  const key = `${entry.domain}/${entry.code}`;
  if (seen.has(key)) problems.push(`${rel}: duplicate of ${seen.get(key)}`);
  seen.set(key, rel);
  entries.push(entry);
}

if (problems.length) {
  console.error(`Data check failed (${problems.length} problem${problems.length === 1 ? "" : "s"}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

entries.sort((a, b) =>
  a.domain === b.domain
    ? String(a.code).localeCompare(String(b.code), undefined, { numeric: true })
    : a.domain.localeCompare(b.domain),
);

const dataset: Dataset = { version: pkg.version, generated: new Date().toISOString().slice(0, 10), entries };
writeFileSync(join(root, "data", "whymdm.json"), JSON.stringify(dataset, null, 2) + "\n");

const domains = new Set(entries.map((e) => e.domain)).size;
const explained = entries.filter((e) => e.confidence !== "name-only").length;
console.log(`OK: ${entries.length} entries in ${domains} domains (${explained} explained) -> data/whymdm.json`);
