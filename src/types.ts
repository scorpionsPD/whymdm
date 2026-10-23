export type Confidence =
  | "apple-documented"
  | "observed"
  | "reported"
  | "inferred"
  | "name-only";

export interface Source {
  title: string;
  url: string;
}

/** One error code or status value, as stored in data/entries/<domain>/<code>.yaml. */
export interface Entry {
  domain: string;
  code: number | string;
  symbol?: string;
  title: string;
  summary?: string;
  causes?: string[];
  checks?: string[];
  platforms?: string[];
  confidence: Confidence;
  sources: Source[];
  last_confirmed?: string;
}

/** The built dataset, data/whymdm.json. */
export interface Dataset {
  version: string;
  generated: string;
  entries: Entry[];
}

/** One item from a command response's ErrorChain, or a code found in text. */
export interface ErrorItem {
  domain: string;
  code: number;
  /** The device's own description, if it sent one. */
  description?: string;
}

/** What we could extract from the pasted input. */
export interface ParsedInput {
  status?: string;
  rejectionReason?: string;
  errors: ErrorItem[];
}

export interface ExplainedError extends ErrorItem {
  entry?: Entry;
}

export interface Explanation {
  status?: { value: string; entry?: Entry };
  rejectionReason?: string;
  errors: ExplainedError[];
  /** Codes we couldn't find, ready to suggest as new entries. */
  unknown: ErrorItem[];
}
