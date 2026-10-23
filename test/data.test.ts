import { describe, expect, it } from "vitest";
import { loadDataset } from "../src/load.js";

const { entries } = loadDataset();

describe("dataset", () => {
  it("has entries", () => {
    expect(entries.length).toBeGreaterThan(100);
  });

  it("has unique domain/code pairs", () => {
    const keys = entries.map((e) => `${e.domain}/${e.code}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every explained entry a summary and an https source", () => {
    for (const e of entries) {
      expect(e.sources.length, `${e.domain}/${e.code}`).toBeGreaterThan(0);
      for (const s of e.sources) expect(s.url.startsWith("https://"), `${e.domain}/${e.code}`).toBe(true);
      if (e.confidence !== "name-only") expect(e.summary, `${e.domain}/${e.code}`).toBeTruthy();
    }
  });

  it("covers all five Apple command status values", () => {
    const statuses = entries.filter((e) => e.domain === "MDMCommandStatus").map((e) => e.code);
    expect(statuses.sort()).toEqual(["Acknowledged", "CommandFormatError", "Error", "Idle", "NotNow"]);
  });
});
