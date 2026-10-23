import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Dataset } from "./types.js";

/** Path of the bundled dataset, relative to this file (works from src/ and dist/). */
export function defaultDatasetPath(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "data", "whymdm.json");
}

/** Loads the bundled dataset from disk (Node only). */
export function loadDataset(path = defaultDatasetPath()): Dataset {
  return JSON.parse(readFileSync(path, "utf8")) as Dataset;
}
