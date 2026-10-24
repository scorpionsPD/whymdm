import { describe, expect, it } from "vitest";
import { parseInput } from "../src/parse.js";
import { ERROR_RESPONSE_PLIST, NOTNOW_PLIST, NSERROR_TEXT, VENDOR_JSON } from "./fixtures.js";

describe("parseInput", () => {
  it("reads Status and every ErrorChain item from a plist command response", () => {
    const parsed = parseInput(ERROR_RESPONSE_PLIST);
    expect(parsed.status).toBe("Error");
    expect(parsed.errors).toEqual([
      { domain: "MCInstallationErrorDomain", code: 4001, description: "The profile could not be installed." },
      { domain: "MCCertificateErrorDomain", code: 9000, description: "The password for the certificate is incorrect." },
    ]);
  });

  it("never keeps device identifiers", () => {
    const parsed = parseInput(ERROR_RESPONSE_PLIST);
    expect(JSON.stringify(parsed)).not.toContain("00000000-0000000000000000");
  });

  it("reads a NotNow status with no errors", () => {
    expect(parseInput(NOTNOW_PLIST)).toEqual({ status: "NotNow", errors: [] });
  });

  it("finds nested, lower-cased keys in vendor JSON", () => {
    const parsed = parseInput(VENDOR_JSON);
    expect(parsed.status).toBe("Error");
    expect(parsed.rejectionReason).toBe("PurchaseMethodNotSupported");
    expect(parsed.errors).toEqual([{ domain: "MCMDMErrorDomain", code: 12021 }]);
    expect(JSON.stringify(parsed)).not.toContain("C00000000000");
  });

  it("finds codes in NSError-style text", () => {
    expect(parseInput(NSERROR_TEXT).errors).toEqual([{ domain: "MCInstallationErrorDomain", code: 4009 }]);
  });

  it("finds codes in loose text without duplicating them", () => {
    const parsed = parseInput("Saw MCProfileErrorDomain 1005 then MCProfileErrorDomain:1005 and MCMDMErrorDomain error 12023");
    expect(parsed.errors).toEqual([
      { domain: "MCProfileErrorDomain", code: 1005 },
      { domain: "MCMDMErrorDomain", code: 12023 },
    ]);
  });

  it("reads Apple Configurator messages, with its D prefix and hex codes", () => {
    const configurator = 'The profile must be installed using a device management tool. [DMCInstallationErrorDomain – 0xFB4 (4020)]';
    expect(parseInput(configurator).errors).toEqual([{ domain: "MCInstallationErrorDomain", code: 4020 }]);
    expect(parseInput("invalid profile [MCProfileErrorDomain - 0x3e8 (1000)]").errors).toEqual([
      { domain: "MCProfileErrorDomain", code: 1000 },
    ]);
  });

  it("reads a hex code without the decimal, and never as code 0", () => {
    expect(parseInput("MCProfileErrorDomain – 0x3E8").errors).toEqual([{ domain: "MCProfileErrorDomain", code: 1000 }]);
    expect(parseInput("MCProfileErrorDomain 0x3E8").errors).toEqual([{ domain: "MCProfileErrorDomain", code: 1000 }]);
  });

  it("handles negative codes", () => {
    expect(parseInput("NSPOSIXErrorDomain -2").errors).toEqual([{ domain: "NSPOSIXErrorDomain", code: -2 }]);
  });

  it("returns nothing for empty or unrelated input", () => {
    expect(parseInput("")).toEqual({ errors: [] });
    expect(parseInput("hello world").errors).toEqual([]);
  });

  it("falls back to text when a plist is malformed", () => {
    expect(parseInput("<plist> broken MCInstallationErrorDomain 4001").errors).toEqual([
      { domain: "MCInstallationErrorDomain", code: 4001 },
    ]);
  });
});
