#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { Index } from "./dataset.js";
import { explain } from "./explain.js";
import { formatText } from "./format.js";
import { loadDataset } from "./load.js";

const USAGE = `whymdm: plain-English explanations for Apple MDM and DDM error codes

Usage:
  whymdm explain <file | ->     Explain a command response (plist or JSON) or any text with error codes
  whymdm lookup <domain> <code>  Explain one code, e.g. whymdm lookup MCInstallationErrorDomain 4009
  whymdm list [domain]           List domains, or the codes in one domain

Options:
  --json     Machine-readable output
  --help     Show this help

Everything runs locally. Nothing you paste is sent anywhere.
`;

function readInput(arg: string | undefined): string {
  if (!arg || arg === "-") return readFileSync(0, "utf8");
  return readFileSync(arg, "utf8");
}

function main(argv: string[]): number {
  const json = argv.includes("--json");
  const args = argv.filter((a) => !a.startsWith("--"));
  const [command, ...rest] = args;

  if (!command || argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(USAGE);
    return command ? 0 : 1;
  }

  const index = new Index(loadDataset());

  switch (command) {
    case "explain": {
      const result = explain(readInput(rest[0]), index);
      process.stdout.write(json ? JSON.stringify(result, null, 2) + "\n" : formatText(result));
      return result.errors.length || result.status ? 0 : 2;
    }
    case "lookup": {
      const [domain, code] = rest;
      if (!domain || code === undefined) {
        process.stderr.write("Usage: whymdm lookup <domain> <code>\n");
        return 1;
      }
      // Numeric codes are error codes; anything else (e.g. MDMCommandStatus NotNow) is a status-style value.
      const value = /^-?\d+$/.test(code) ? Number(code) : code;
      const entry = index.get(domain, value);
      if (json) {
        process.stdout.write(JSON.stringify(entry ?? null, null, 2) + "\n");
      } else if (typeof value === "number") {
        const item = { domain, code: value };
        process.stdout.write(formatText({ errors: [{ ...item, entry }], unknown: entry ? [] : [item] }));
      } else {
        process.stdout.write(formatText({ status: { value, entry }, errors: [], unknown: [] }));
      }
      return entry ? 0 : 2;
    }
    case "list": {
      const [domain] = rest;
      if (!domain) {
        const domains = index.domains().map((d) => ({ domain: d, count: index.inDomain(d).length }));
        process.stdout.write(
          json ? JSON.stringify(domains, null, 2) + "\n" : domains.map((d) => `${d.domain} (${d.count})`).join("\n") + "\n",
        );
        return 0;
      }
      const entries = index.inDomain(domain);
      process.stdout.write(
        json
          ? JSON.stringify(entries, null, 2) + "\n"
          : entries.map((e) => `${e.code}\t${e.title}\t[${e.confidence}]`).join("\n") + "\n",
      );
      return entries.length ? 0 : 2;
    }
    default:
      process.stderr.write(`Unknown command: ${command}\n\n${USAGE}`);
      return 1;
  }
}

process.exitCode = main(process.argv.slice(2));
