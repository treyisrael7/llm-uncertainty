import { analyze } from "../src";

const result = analyze({
  runs: [
    "The customer is likely eligible for a refund.",
    "The customer may be eligible for a refund.",
    "The customer could qualify for a refund."
  ]
});

console.log(result);
