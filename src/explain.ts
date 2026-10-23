import { Index } from "./dataset.js";
import { parseInput } from "./parse.js";
import type { Dataset, Explanation } from "./types.js";

/** Parses the input and looks every status and error code up in the dataset. */
export function explain(input: string, dataset: Dataset | Index): Explanation {
  const index = dataset instanceof Index ? dataset : new Index(dataset);
  const parsed = parseInput(input);

  const errors = parsed.errors.map((e) => ({ ...e, entry: index.get(e.domain, e.code) }));
  const unknown = errors.filter((e) => !e.entry).map(({ entry: _entry, ...item }) => item);

  return {
    ...(parsed.status ? { status: { value: parsed.status, entry: index.status(parsed.status) } } : {}),
    ...(parsed.rejectionReason ? { rejectionReason: parsed.rejectionReason } : {}),
    errors,
    unknown,
  };
}
