import plist from "plist";
import type { ErrorItem, ParsedInput } from "./types.js";

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/** Case-insensitive key lookup, so vendor logs that lower-case keys still work. */
function pick(obj: Obj, key: string): unknown {
  if (key in obj) return obj[key];
  const lower = key.toLowerCase();
  for (const k of Object.keys(obj)) if (k.toLowerCase() === lower) return obj[k];
  return undefined;
}

function toInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && /^-?\d+$/.test(v.trim())) return Number(v.trim());
  return undefined;
}

function errorItemFrom(obj: Obj): ErrorItem | undefined {
  const domain = pick(obj, "ErrorDomain");
  const code = toInt(pick(obj, "ErrorCode"));
  if (typeof domain !== "string" || code === undefined) return undefined;
  const description = pick(obj, "USEnglishDescription") ?? pick(obj, "LocalizedDescription");
  return { domain, code, ...(typeof description === "string" ? { description } : {}) };
}

/**
 * Walks any parsed structure (plist or JSON) and collects the first Status,
 * the first RejectionReason and every ErrorChain item, wherever they are nested.
 * Device identifiers (UDID, serial number, tokens) are never read or kept.
 */
function collect(value: unknown, out: ParsedInput, depth = 0): void {
  if (depth > 20) return;
  if (Array.isArray(value)) {
    for (const v of value) collect(v, out, depth + 1);
    return;
  }
  if (!isObj(value)) return;

  const status = pick(value, "Status");
  if (out.status === undefined && typeof status === "string") out.status = status;

  const reason = pick(value, "RejectionReason");
  if (out.rejectionReason === undefined && typeof reason === "string") out.rejectionReason = reason;

  const chain = pick(value, "ErrorChain");
  if (Array.isArray(chain)) {
    for (const item of chain) {
      if (isObj(item)) {
        const e = errorItemFrom(item);
        if (e) out.errors.push(e);
      }
    }
  } else {
    const single = errorItemFrom(value);
    if (single) out.errors.push(single);
  }

  for (const [k, v] of Object.entries(value)) {
    if (k.toLowerCase() === "errorchain") continue;
    collect(v, out, depth + 1);
  }
}

// `Error Domain=MCInstallationErrorDomain Code=4009 "..."`, as printed by NSError.
const NSERROR_RE = /Domain=([A-Za-z][\w.]*)\s+Code=(-?\d+)/g;
// `MCInstallationErrorDomain 4009`, `MCInstallationErrorDomain:4009`, `MCInstallationErrorDomain error 4009`
// The separator class leaves out "-" so negative codes keep their sign.
const LOOSE_RE = /\b([A-Za-z][\w.]*(?:ErrorDomain|Domain))\b[\s:/#,(=]*(?:error|code)?[\s:#=]*(-?\d+)/gi;
const STATUS_RE = /\b(Acknowledged|NotNow|CommandFormatError|Idle)\b|\bStatus\W{0,4}(Error)\b/;

function parseText(text: string): ParsedInput {
  const out: ParsedInput = { errors: [] };
  const seen = new Set<string>();
  for (const re of [NSERROR_RE, LOOSE_RE]) {
    re.lastIndex = 0;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const key = `${m[1]}/${m[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.errors.push({ domain: m[1], code: Number(m[2]) });
    }
  }
  const s = STATUS_RE.exec(text);
  if (s) out.status = s[1] ?? s[2];
  return out;
}

/** Accepts an XML property list, JSON, or free text containing error domains and codes. */
export function parseInput(input: string): ParsedInput {
  const text = input.trim();
  if (text === "") return { errors: [] };

  if (text.startsWith("<?xml") || text.startsWith("<plist") || text.includes("<!DOCTYPE plist")) {
    try {
      const out: ParsedInput = { errors: [] };
      collect(plist.parse(text), out);
      return out;
    } catch {
      // Not a valid plist after all: fall back to text.
    }
  }

  if (text.startsWith("{") || text.startsWith("[")) {
    try {
      const out: ParsedInput = { errors: [] };
      collect(JSON.parse(text), out);
      if (out.status || out.errors.length || out.rejectionReason) return out;
    } catch {
      // Not valid JSON: fall back to text.
    }
  }

  return parseText(text);
}
