# llm-uncertainty

Check whether an LLM gives the same answer when you ask it more than once.

Use `llm-uncertainty` when your app samples a prompt 3-5 times and needs a fast local signal before trusting the answer, showing it to a user, calling a tool, or escalating to review.

```ts
import { analyze } from "llm-uncertainty";

const result = analyze({
  runs: [
    "Approve the refund because the item arrived damaged.",
    "Approve the refund because the product arrived damaged.",
    "Approve the refund because the order arrived damaged.",
    "Do not approve the refund because the item was used."
  ]
});

if (result.status !== "stable") {
  // Retry, ask a cheaper verifier, lower automation, or send to review.
  console.log(result.status, result.confidence, result.outliers);
}
```

No model provider lock-in. No embeddings. No API calls. No runtime dependencies.

## When To Use It

LLM apps often need to know whether a response is merely plausible or actually repeatable. This library gives you a cheap consistency check for workflows like:

- routing uncertain support answers to a human
- blocking tool calls when sampled plans disagree
- detecting split classifications before writing to a database
- comparing prompt changes during development
- logging instability as an eval signal in production

Do not use it as a truth oracle. It checks agreement between strings, not factual correctness.

## Install

```bash
npm install llm-uncertainty
```

## The 30-Second Model

1. Run the same prompt multiple times in your LLM app.
2. Pass the text outputs to `analyze({ runs })`.
3. Use `status` and `confidence` to decide whether to trust, retry, escalate, or inspect.

```ts
const runs = await Promise.all(
  Array.from({ length: 4 }, () => callModel(prompt))
);

const uncertainty = analyze({ runs });

switch (uncertainty.status) {
  case "stable":
    return runs[0];
  case "unstable":
  case "split":
  case "no-consensus":
    return requestHumanReview({ prompt, runs, uncertainty });
}
```

## Result Shape

The default result is intentionally small enough to log or use in a guardrail:

```json
{
  "status": "unstable",
  "confidence": 0.71,
  "variance": 0.29,
  "consensus": "approve the refund because the arrive damage",
  "outliers": [
    "Do not approve the refund because the item was used."
  ]
}
```

`status` describes the shape of the sampled outputs:

- `stable`: one strong cluster contains most outputs and no major disagreements were found
- `unstable`: there is some agreement, but confidence is low or an outlier exists
- `split`: multiple meaningful clusters appear to represent competing interpretations
- `no-consensus`: outputs are mostly unrelated

`consensus` is a normalized hint, useful for debugging and logs. Use your original model output when displaying a final answer.

## Debug Mode

Pass `verbose: true` when you want to understand why a prompt is unstable:

```ts
const result = analyze({
  runs,
  verbose: true
});

console.log(result.details?.clusters);
console.log(result.details?.comparisons);
console.log(result.details?.unstablePhrases);
```

Verbose results include:

- `method: "heuristic"`
- `unstablePhrases`, such as `may`, `might`, and `likely`
- `clusters`, showing which runs grouped together
- `comparisons`, showing pairwise similarity and disagreement flags

## Custom Vocabulary

v0.1 uses lightweight heuristics. Add domain vocabulary when your app has synonyms that should count as agreement.

```ts
const result = analyze({
  runs,
  customGroups: {
    refundTerms: ["refund", "reimbursement", "credit"],
    outageTerms: ["outage", "incident", "service disruption"]
  }
});
```

You can also tune thresholds for stricter or looser routing:

```ts
const result = analyze({
  runs,
  thresholds: {
    stable: 0.8,
    unstable: 0.35,
    agreement: 0.45
  }
});
```

## Examples

Run examples directly with `tsx`:

```bash
npx tsx examples/basic.ts
npx tsx examples/guardrail.ts
npx tsx examples/verbose.ts
npx tsx examples/custom-groups.ts
npx tsx examples/split.ts
npx tsx examples/no-consensus.ts
```

- `basic.ts` shows the smallest useful analysis result.
- `guardrail.ts` shows how to route unstable sampled outputs away from automation.
- `verbose.ts` prints clusters, pairwise comparisons, and uncertainty phrases for prompt debugging.
- `custom-groups.ts` adds domain vocabulary for synonym-heavy workflows.
- `split.ts` demonstrates competing interpretations.
- `no-consensus.ts` demonstrates unrelated outputs.

## API

```ts
analyze({
  runs: string[];
  verbose?: boolean;
  customGroups?: Record<string, string[]>;
  thresholds?: {
    stable?: number;
    unstable?: number;
    agreement?: number;
  };
});
```

`runs` must contain at least two outputs from the same prompt or task.

## Notes

- Works with any LLM provider because it only analyzes strings.
- Does not require logits, embeddings, eval datasets, or model internals.
- Best used as an early warning signal next to retries, evals, human review, or provider-specific confidence tools.
- v0.1 is heuristic and intentionally small; it favors easy local adoption over deep semantic evaluation.

## Roadmap

- better consensus extraction
- richer disagreement vocabularies
- prompt sensitivity checks
- helper examples for common providers