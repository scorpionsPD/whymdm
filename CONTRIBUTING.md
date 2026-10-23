# Contributing to WhyMDM

Thank you. Every explained code saves the next admin an afternoon of searching.

## The rules that keep WhyMDM trustworthy

1. **Every claim needs a source.** Link to Apple's documentation, a public forum thread, a blog post or a public issue. If you've seen it on your own devices, say so and choose `observed`, with a link to a public write-up if one exists.
2. **Write in your own words.** Summarise and link; don't paste text from Apple's documentation or anyone else's article.
3. **Pick the honest confidence level.** Use `inferred` when you're reasoning from the name, and leave it as `name-only` if you don't know.
4. **No private data.** Never include UDIDs, serial numbers, push tokens, customer names or internal URLs in entries, issues or examples.
5. **Vendor-neutral.** Explain the code, not a product. It's fine to say how a fix works in a specific MDM if you link to that vendor's public documentation.

## Adding or improving an entry

1. Find the file: `data/entries/<ErrorDomain>/<code>.yaml`. Create it if it doesn't exist; the folder name must match `domain` and the file name must match `code`.
2. Fill in what you know:
   - `title`: short and plain, e.g. "Device locked"
   - `summary`: what it means, one to three sentences
   - `causes`: the most common first
   - `checks`: concrete next steps
   - `platforms`: where it applies
   - `confidence` and `sources`
   - `last_confirmed`: e.g. `"iOS 26.1"`, if you've seen it recently
3. Run `npm run check`. It validates every file against the schema.
4. Open a pull request. One code or a small group of related codes per PR is ideal.

Not comfortable with Git? Open an issue with the "Add or correct an entry" form and we'll turn it into a file.

## Code changes

The decoder is TypeScript in `src/`, with tests in `test/`. Please add a test with a synthetic sample (no real identifiers) for any new input format.

## Code of conduct

Be kind, assume good intent, and keep discussion about the work. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
