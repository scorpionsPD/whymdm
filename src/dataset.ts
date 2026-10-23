import type { Dataset, Entry } from "./types.js";

/** Pseudo-domain for the Status values of an MDM command response. */
export const STATUS_DOMAIN = "MDMCommandStatus";

export function entryKey(domain: string, code: number | string): string {
  return `${domain}/${code}`;
}

/** Fast lookups over a dataset. */
export class Index {
  private readonly byKey = new Map<string, Entry>();

  constructor(readonly dataset: Dataset) {
    for (const entry of dataset.entries) {
      this.byKey.set(entryKey(entry.domain, entry.code), entry);
    }
  }

  get(domain: string, code: number | string): Entry | undefined {
    return this.byKey.get(entryKey(domain, code));
  }

  status(value: string): Entry | undefined {
    return this.get(STATUS_DOMAIN, value);
  }

  domains(): string[] {
    return [...new Set(this.dataset.entries.map((e) => e.domain))].sort();
  }

  inDomain(domain: string): Entry[] {
    return this.dataset.entries
      .filter((e) => e.domain === domain)
      .sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }));
  }
}
