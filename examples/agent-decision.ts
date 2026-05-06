import { analyze } from "../src";

const decision = "Should the agent automatically cancel this subscription?";
const agentVotes = [
  "Cancel the subscription because the user explicitly requested cancellation.",
  "Cancel the subscription because the user asked to stop renewal.",
  "Cancel the subscription because the account owner requested it.",
  "Do not cancel the subscription because the request is unclear."
];

const result = analyze(agentVotes, {
  verbose: true
});

console.log("Agent decision guardrail");
console.log("------------------------");
console.log(`Decision: ${decision}`);
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Why it matters: ${result.explanation}`);
console.log("Outliers:", result.outliers);

if (result.status === "stable") {
  console.log("Action: proceed with the agent decision.");
} else {
  console.log("Action: pause automation and ask for review.");
}
