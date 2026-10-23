# WhyMDM

**Plain-English explanations for Apple MDM and declarative device management (DDM) error codes.**

When an iPhone, iPad or Mac rejects an MDM command, you get something like `MCInstallationErrorDomain 4009` and very little else. Apple doesn't publish a single table of these codes, so admins piece answers together from forum threads. WhyMDM is an open, vendor-neutral dictionary of those codes, plus a decoder: paste a command response and get what each code means, what usually causes it and what to check next, with sources.

It works with any MDM (Jamf, Intune, Kandji, Mosyle, Fleet, NanoMDM, your own) because it only reads what the device sends back.

> **Early days.** The dataset starts with every code name and number from MicroMDM's list, plus Apple's five command status values explained. Most codes are still `name-only`. Explanations are being added one by one, each with a source. [Contributions are very welcome](CONTRIBUTING.md).

## Use it

Until the first npm release, run it from a clone:

```sh
git clone https://github.com/scorpionsPD/whymdm && cd whymdm
npm install && npm run build
node dist/cli.js lookup MDMCommandStatus NotNow
```

After the release:

```sh
npx whymdm explain response.plist     # a command response (XML plist or JSON)
pbpaste | npx whymdm explain -        # or anything copied from a log
npx whymdm lookup MCInstallationErrorDomain 4009
npx whymdm lookup MDMCommandStatus NotNow
npx whymdm list                       # domains and how many codes each has
npx whymdm explain response.plist --json
```

Example:

```text
$ npx whymdm lookup MDMCommandStatus NotNow
Status: NotNow
  The device received the command but can't run it at the moment. A later retry may succeed. ...
  Likely causes:
    - Some commands won't run until the device has been unlocked for the first time after it restarts.
    ...
  Confidence: documented by Apple
  Source: Apple: Handling NotNow status responses <https://developer.apple.com/documentation/devicemanagement/handling-notnow-status-responses>
```

**Privacy:** everything runs locally. WhyMDM never sends what you paste anywhere, and it ignores device identifiers such as UDIDs and serial numbers. Even so, redact them before sharing output publicly.

### As a library

```ts
import { explain, loadDataset, formatText } from "whymdm";

const result = explain(responseText, loadDataset());
console.log(formatText(result));
```

The dataset is also published as a single JSON file (`data/whymdm.json`) for tools that want to show explanations of their own.

## What an entry looks like

Each code is one YAML file in `data/entries/<domain>/<code>.yaml`:

```yaml
domain: MDMCommandStatus
code: NotNow
title: Device can't run the command yet
summary: The device received the command but can't run it at the moment. ...
causes:
  - Some commands won't run until the device has been unlocked for the first time after it restarts.
checks:
  - Resend the command when the device next checks in.
platforms: [iOS, iPadOS, macOS]
confidence: apple-documented
sources:
  - title: "Apple: Handling NotNow status responses"
    url: https://developer.apple.com/documentation/devicemanagement/handling-notnow-status-responses
```

`confidence` tells you how much to trust it:

| Value | Meaning |
|---|---|
| `apple-documented` | Apple's documentation says so |
| `observed` | Seen on real devices, with a public source |
| `reported` | Stated by a third-party source |
| `inferred` | Reasoned from the name or context, not confirmed |
| `name-only` | Only the identifier is known so far |

The schema is in [`data/schema/entry.schema.json`](data/schema/entry.schema.json).

## Contributing

The most useful thing you can do is explain a code you've actually hit, with a link to where you learned it. See [CONTRIBUTING.md](CONTRIBUTING.md). One code is one small file, so a first pull request takes minutes.

```sh
npm install
npm run check    # validates every entry, type-checks and runs the tests
```

## Licence and credits

- Code: [MIT](LICENSE).
- Data: [CC0](data/LICENSE). Use it anywhere, including in commercial MDM products.
- The initial list of code names and numbers comes from [MicroMDM](https://github.com/micromdm/mdm) (MIT). See [THIRD_PARTY_NOTICES](data/THIRD_PARTY_NOTICES.md).

WhyMDM is not affiliated with or endorsed by Apple Inc. Apple, iPhone, iPad and Mac are trademarks of Apple Inc.

Maintained by Pradeep Dahiya. I'm founder and software architect at ScotiTech, which makes an MDM product. WhyMDM is independent and vendor-neutral, and it will stay that way.
