# llm-uncertainty

Check whether an LLM gives the same answer when you ask it more than once.

Use `llm-uncertainty` when your app samples a prompt 3-5 times and needs a fast local signal before trusting the answer, showing it to a user, calling a tool, or escalating to review.

```ts
import { analyze } from "llm-uncertainty";

const outputs = [
  "Approve the refund because the item arrived damaged.",
  "Approve the refund because the product arrived damaged.",
  "Approve the refund because the order arrived damaged.",
  "Do not approve the refund because the item was used."
];

const result = analyze(outputs);

if (result.status !== "stable") {
  // Retry, ask a cheaper verifier, lower automation, or send to review.
  console.log(result.status, result.confidence, result.outliers);
}
```

Lightweight by design: no model provider lock-in, no embeddings, no API calls, no model internals, and no runtime dependencies.

## When To Use This Library

LLM apps often need to know whether a response is merely plausible or actually repeatable. This library gives you a cheap consistency check for workflows like:

- routing uncertain support answers to a human
- blocking tool calls when sampled plans disagree
- detecting split classifications before writing to a database
- comparing prompt changes during development
- logging instability as an eval signal in production

It is most useful as a guardrail before automation. Run the same prompt a few times, analyze the strings locally, then decide whether to trust, retry, escalate, or inspect.

## When Not To Use This Library

Do not use it as a truth oracle. It checks agreement between strings, not factual correctness.

This is not the right tool when you need:

- retrieval quality scoring
- embedding-based semantic search
- calibrated model confidence
- access to logits, attention, or other model internals
- a replacement for eval datasets or human review
- a guarantee that a stable answer is correct

## Install

```bash
npm install llm-uncertainty
```

## The 30-Second Model

1. Run the same prompt multiple times in your LLM app.
2. Pass the text outputs to `analyze(outputs)`.
3. Use `status` and `confidence` to decide whether to trust, retry, escalate, or inspect.

```ts
const runs = await Promise.all(
  Array.from({ length: 4 }, () => callModel(prompt))
);

const uncertainty = analyze(runs);

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

## Configurable Strictness

Use `strictness` to control how easily outputs group together:

```ts
const result = analyze(outputs, {
  strictness: "strict"
});
```

`strictness` can be `"loose"`, `"normal"`, or `"strict"`. `"normal"` is the default. Use `"loose"` when wording varies but the intent is usually the same. Use `"strict"` when small differences should trigger review.

If you need direct control, `minAgreement` overrides the strictness preset:

```ts
const result = analyze(outputs, {
  minAgreement: 0.7
});
```

## Verbose Explanations

Pass `verbose: true` when you want to understand why a prompt is unstable:

```ts
const result = analyze(outputs, {
  verbose: true
});

console.log(result.explanation);
console.log(result.details?.clusters);
console.log(result.details?.comparisons);
console.log(result.details?.unstablePhrases);
```

Verbose results include a short `explanation` plus debug details:

- `explanation`, a human-readable reason for `stable`, `unstable`, `split`, or `no-consensus`
- `method: "heuristic"`
- `unstablePhrases`, such as `may`, `might`, and `likely`
- `clusters`, showing which runs grouped together
- `comparisons`, showing pairwise similarity and disagreement flags

## Custom Vocabulary

v0.2 uses lightweight heuristics. Add domain vocabulary when your app has synonyms that should count as agreement.

```ts
const result = analyze(runs, {
  customGroups: {
    refundTerms: ["refund", "reimbursement", "credit"],
    outageTerms: ["outage", "incident", "service disruption"]
  }
});
```

## Custom Outlier Detection

Pass `outlierDetector` when your app already knows how to identify bad or unsafe outputs. The function receives the sampled outputs and returns the outlier strings to include in the result.

```ts
const result = analyze(runs, {
  outlierDetector: (outputs) =>
    outputs.filter((output) => output.includes("manual review required"))
});
```

When provided, `outlierDetector` replaces the built-in outlier logic. Status uses your returned outlier list, while clustering, confidence, and verbose details still use the library's normal local heuristics.

## Examples

Run examples directly with `tsx`:

```bash
npx tsx examples/basic.ts
npx tsx examples/guardrail.ts
npx tsx examples/verbose.ts
npx tsx examples/custom-groups.ts
npx tsx examples/split.ts
npx tsx examples/no-consensus.ts
npx tsx examples/customer-support.ts
npx tsx examples/rag-consistency.ts
npx tsx examples/agent-decision.ts
```

- `basic.ts` shows the smallest useful analysis result.
- `guardrail.ts` shows how to route unstable sampled outputs away from automation.
- `verbose.ts` prints clusters, pairwise comparisons, and uncertainty phrases for prompt debugging.
- `custom-groups.ts` adds domain vocabulary for synonym-heavy workflows.
- `split.ts` demonstrates competing interpretations.
- `no-consensus.ts` demonstrates unrelated outputs.
- `customer-support.ts` shows routing a risky support reply to review.
- `rag-consistency.ts` checks whether retrieved-answer samples agree before responding.
- `agent-decision.ts` pauses an automated decision when sampled agent votes disagree.

## API

```ts
analyze(
  outputs: string[],
  options?: {
    minAgreement?: number;
    strictness?: "loose" | "normal" | "strict";
    verbose?: boolean;
    customGroups?: Record<string, string[]>;
    outlierDetector?: (outputs: string[]) => string[];
  }
);
```

`outputs` must contain at least two outputs from the same prompt or task. `minAgreement` controls how similar two outputs must be before they are grouped together, and defaults to the `"normal"` strictness threshold of `0.4`.

The original object form is still supported for existing callers:

```ts
analyze({
  runs,
  verbose: true,
  outlierDetector: (outputs) =>
    outputs.filter((output) => output.includes("manual review required")),
  customGroups: {
    refundTerms: ["refund", "reimbursement", "credit"]
  }
});
```

## Limitations Of v0.2

- It only analyzes strings, so it works with any LLM provider but cannot inspect model confidence.
- It does not use APIs, embeddings, logits, eval datasets, or model internals.
- It can detect repeated agreement, split outputs, and obvious outliers, but not factual correctness.
- Short or highly technical outputs may need `customGroups`, `strictness`, or a custom `outlierDetector`.
- Treat it as an early warning signal next to retries, evals, human review, or provider-specific confidence tools.
- v0.2 is intentionally small and local; it favors easy adoption over deep semantic evaluation.

## Roadmap

- better consensus extraction
- richer disagreement vocabularies
- prompt sensitivity checks
- helper examples for common providers