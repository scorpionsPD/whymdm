import { NEW_ENTRY_URL } from "./meta.js";
import type { Entry, Explanation } from "./types.js";

const CONFIDENCE_LABEL: Record<Entry["confidence"], string> = {
  "apple-documented": "documented by Apple",
  observed: "observed on devices",
  reported: "reported by a third party",
  inferred: "inferred, not confirmed",
  "name-only": "name only, no explanation yet",
};

function entryLines(entry: Entry, indent: string): string[] {
  const lines: string[] = [];
  if (entry.summary) lines.push(`${indent}${entry.summary}`);
  if (entry.causes?.length) {
    lines.push(`${indent}Likely causes:`);
    for (const c of entry.causes) lines.push(`${indent}  - ${c}`);
  }
  if (entry.checks?.length) {
    lines.push(`${indent}What to check:`);
    for (const c of entry.checks) lines.push(`${indent}  - ${c}`);
  }
  lines.push(`${indent}Confidence: ${CONFIDENCE_LABEL[entry.confidence]}`);
  for (const s of entry.sources) lines.push(`${indent}Source: ${s.title} <${s.url}>`);
  return lines;
}

/** Human-readable output for the terminal. */
export function formatText(result: Explanation): string {
  const lines: string[] = [];

  if (result.status) {
    lines.push(`Status: ${result.status.value}`);
    if (result.status.entry) lines.push(...entryLines(result.status.entry, "  "));
    lines.push("");
  }

  if (result.rejectionReason) {
    lines.push(`Rejection reason: ${result.rejectionReason}`, "");
  }

  result.errors.forEach((e, i) => {
    const label = result.errors.length > 1 ? `Error ${i + 1} of ${result.errors.length}` : "Error";
    lines.push(`${label}: ${e.domain} ${e.code}${e.entry ? ` (${e.entry.title})` : ""}`);
    if (e.description) lines.push(`  Device said: "${e.description}"`);
    if (e.entry) lines.push(...entryLines(e.entry, "  "));
    else lines.push(`  Not in WhyMDM yet. Please add it: ${NEW_ENTRY_URL}`);
    lines.push("");
  });

  if (!result.status && result.errors.length === 0) {
    lines.push("No MDM status or error code found in the input.");
  }

  return lines.join("\n").trimEnd() + "\n";
}
