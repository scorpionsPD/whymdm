/**
 * One-off seed: creates name-only entries from MicroMDM's list of Apple profile/MDM error codes
 * (data/third_party/micromdm-errors.go, MIT licensed, see data/THIRD_PARTY_NOTICES.md).
 *
 * Existing entry files are never overwritten, so it's safe to re-run after entries have been explained.
 * Usage: npx tsx scripts/import-micromdm.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "data", "third_party", "micromdm-errors.go"), "utf8");
const SOURCE_URL = "https://github.com/micromdm/mdm/blob/master/errors.go";

// Words whose capitalisation we keep when turning identifiers into titles.
const ACRONYMS = ["MDM", "UUIDs", "UUID", "HTTP", "APN", "SMIME", "IMAP", "POP", "SMTP", "WAPI", "UI"];
// Typos in the source identifiers, fixed in titles only (the symbol keeps the original).
const TYPO_FIXES: Record<string, string> = { Unnacceptable: "Unacceptable" };

function titleFromSymbol(symbol: string): string {
  const withoutPrefix = symbol.replace(/^(posix|apn|mdm|pr|pl|rs|in|pc|kc|em|wc|ce|de)(?=[A-Z])/, "");
  const words = withoutPrefix.match(/SMIME|[A-Z]{2,}s?(?=[A-Z][a-z]|$)|[A-Z][a-z]+|[A-Z]+|\d+/g) ?? [withoutPrefix];
  return words
    .map((w, i) => {
      const fixed = TYPO_FIXES[w] ?? w;
      if (ACRONYMS.includes(fixed)) return fixed;
      return i === 0 ? fixed : fixed.toLowerCase();
    })
    .join(" ");
}

interface Found {
  domain: string;
  code: number;
  symbol: string;
}

function parseGo(go: string): Found[] {
  const found: Found[] = [];
  // Each `type X int` is followed by a const block whose first line sets `iota + base` (or a literal).
  const blockRe = /type (\w+) int\s+const \(([\s\S]*?)\n\)/g;
  for (let m = blockRe.exec(go); m; m = blockRe.exec(go)) {
    const domain = m[1];
    let next: number | undefined;
    for (const raw of m[2].split("\n")) {
      const line = raw.replace(/\/\/.*$/, "").trim();
      if (!line) continue;
      const first = /^(\w+)\s+\w+\s*=\s*iota\s*\+\s*(-?\d+)$/.exec(line);
      const literal = /^(\w+)\s+\w+\s*=\s*(-?\d+)$/.exec(line);
      if (first) {
        next = Number(first[2]);
        found.push({ domain, code: next, symbol: first[1] });
        next++;
      } else if (literal) {
        found.push({ domain, code: Number(literal[2]), symbol: literal[1] });
        next = undefined;
      } else if (/^\w+$/.test(line) && next !== undefined) {
        if (line !== "_") found.push({ domain, code: next, symbol: line });
        next++;
      }
    }
  }
  return found;
}

let created = 0;
let skipped = 0;
for (const f of parseGo(source)) {
  const path = join(root, "data", "entries", f.domain, `${f.code}.yaml`);
  if (existsSync(path)) {
    skipped++;
    continue;
  }
  mkdirSync(dirname(path), { recursive: true });
  const entry = {
    domain: f.domain,
    code: f.code,
    symbol: f.symbol,
    title: titleFromSymbol(f.symbol),
    confidence: "name-only",
    sources: [{ title: "MicroMDM: Apple MDM error code list (errors.go)", url: SOURCE_URL }],
  };
  writeFileSync(path, stringify(entry));
  created++;
}
console.log(`Created ${created} name-only entries, kept ${skipped} existing.`);
