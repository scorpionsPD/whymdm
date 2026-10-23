// Synthetic samples shaped like real MDM traffic. They contain no real device identifiers.

export const ERROR_RESPONSE_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CommandUUID</key>
  <string>00000000-0000-0000-0000-000000000001</string>
  <key>ErrorChain</key>
  <array>
    <dict>
      <key>ErrorCode</key>
      <integer>4001</integer>
      <key>ErrorDomain</key>
      <string>MCInstallationErrorDomain</string>
      <key>LocalizedDescription</key>
      <string>The profile could not be installed.</string>
    </dict>
    <dict>
      <key>ErrorCode</key>
      <integer>9000</integer>
      <key>ErrorDomain</key>
      <string>MCCertificateErrorDomain</string>
      <key>USEnglishDescription</key>
      <string>The password for the certificate is incorrect.</string>
    </dict>
  </array>
  <key>Status</key>
  <string>Error</string>
  <key>UDID</key>
  <string>00000000-0000000000000000</string>
</dict>
</plist>`;

export const NOTNOW_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0">
<dict>
  <key>CommandUUID</key>
  <string>00000000-0000-0000-0000-000000000002</string>
  <key>Status</key>
  <string>NotNow</string>
</dict>
</plist>`;

export const VENDOR_JSON = JSON.stringify({
  device: { serial: "C00000000000" },
  command: {
    request_type: "InstallApplication",
    response: {
      status: "Error",
      RejectionReason: "PurchaseMethodNotSupported",
      errorchain: [{ errordomain: "MCMDMErrorDomain", errorcode: "12021" }],
    },
  },
});

export const NSERROR_TEXT =
  'Install failed: Error Domain=MCInstallationErrorDomain Code=4009 "The device is locked." UserInfo={...}';
