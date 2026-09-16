# obvious-en — expected

Input: `input.ts`, the same shape as `obvious-cn` in TypeScript.

Requirement: **zero comments added.** The produced file contains no comment lines at all.

- `// validate the order parameters` — restates `validateOrder`.
- `// loop over the items` — announces the loop.
- `// check the stock` — restates the condition below it.
- `// initialize the payment client` — labels the assignment to `client`.
- `// compute the line total` / `// compute the order total` — restate `lineTotal` / `orderTotal`.
- `// set the request timeout` — restates `setRequestTimeout`.

None survives step 3, so the correct output is the code with every comment removed.
