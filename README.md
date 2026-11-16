# markdown-render-speed-02

Dependency-free synchronous GFM renderer targeting the default output of marked
18.1.3. `parse.js` exports `parse(markdown)`. `main.ts` reads the kit's ordered
`{id, markdown}[]` from `/input/cases.json` and writes the corresponding HTML
string array to `/output/html.json`.

The runtime consists of `main.ts`, `parse.js`, `grammar.js`, `containers.js`, and
`package.json`. It uses Node built-ins only. `marked-core.js` is the previous
entry and is **not imported by the new renderer**. The vendored reference under
`baselines/` is used only by development tools.

The renderer scans blocks and inline content by index and emits HTML directly.
It does not construct a token tree or invoke marked's Lexer or Parser. The leaf
recognizers and container indentation rules are adapted from marked's MIT
licensed grammar; their transient matches are consumed immediately. See
[DESIGN.md](DESIGN.md) for reference resolution and list/quote handling.

Validation (requires the supplied practice fixtures and development oracle):

```sh
node validation/check.mjs
node validation/fuzz.mjs
node validation/structured-fuzz.mjs
sh validation/bench.sh
```

The final measurements and exact limitations are recorded in
[validation/REPORT.md](validation/REPORT.md). The official container/cgroup speed
threshold has not been verified. Nothing has been committed or submitted.
