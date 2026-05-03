import { analyze } from "../src";

const result = analyze({
  runs: [
    "The answer is stable and safe to use.",
    "The answer is stable and safe to use.",
    "The answer is stable and safe to use."
  ]
});

if (result.status !== "stable") {
  console.log("Needs review:", result);
} else {
  console.log("Looks stable:", result);
}