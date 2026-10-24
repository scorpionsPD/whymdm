import { describe, expect, it } from "vitest";
import { explain } from "../src/explain.js";
import { formatText } from "../src/format.js";
import { loadDataset } from "../src/load.js";
import { ERROR_RESPONSE_PLIST, NOTNOW_PLIST } from "./fixtures.js";

const dataset = loadDataset();

describe("explain", () => {
  it("attaches entries to the status and to known error codes", () => {
    const result = explain(ERROR_RESPONSE_PLIST, dataset);
    expect(result.status?.entry?.title).toBe("Command failed");
    expect(result.errors.map((e) => e.entry?.title)).toEqual(["Profile installation failed", "Invalid password"]);
    expect(result.unknown).toEqual([]);
  });

  it("lists codes that aren't in the dataset", () => {
    const result = explain("MCInstallationErrorDomain 4999", dataset);
    expect(result.errors[0].entry).toBeUndefined();
    expect(result.unknown).toEqual([{ domain: "MCInstallationErrorDomain", code: 4999 }]);
  });

  it("explains NotNow with Apple-documented next steps", () => {
    const result = explain(NOTNOW_PLIST, dataset);
    expect(result.status?.entry?.confidence).toBe("apple-documented");
    expect(result.status?.entry?.checks?.length).toBeGreaterThan(0);
  });
});

describe("formatText", () => {
  it("shows the device's own description, the confidence and a source", () => {
    const text = formatText(explain(ERROR_RESPONSE_PLIST, dataset));
    expect(text).toContain("Error 1 of 2: MCInstallationErrorDomain 4001 (Profile installation failed)");
    expect(text).toContain('Device said: "The profile could not be installed."');
    expect(text).toContain("Confidence: observed on devices");
    expect(text).toContain("Confidence: name only, no explanation yet");
    expect(text).toContain("Source: MicroMDM");
  });

  it("explains an Apple Configurator message", () => {
    const text = formatText(explain("Invalid Profile [MCProfileErrorDomain – 0x3E8 (1000)]", dataset));
    expect(text).toContain("Error: MCProfileErrorDomain 1000 (Invalid profile)");
  });

  it("invites a contribution for unknown codes", () => {
    expect(formatText(explain("MCInstallationErrorDomain 4999", dataset))).toContain("Not in WhyMDM yet");
  });

  it("says so when nothing is found", () => {
    expect(formatText(explain("nothing here", dataset))).toContain("No MDM status or error code found");
  });
});
