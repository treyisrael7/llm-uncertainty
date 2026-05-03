import { analyze } from "../src";

const result = analyze({
  runs: [
    "The customer is likely eligible for a refund because the item arrived damaged.",
    "The customer may be eligible for a refund since the item was damaged.",
    "The customer could qualify for a refund because the item arrived broken.",
    "The customer is not eligible for a refund because the item was used."
  ]
});

console.log("Basic analysis");
console.log("--------------");
console.log(result);