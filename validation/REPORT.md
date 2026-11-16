# Validation report — 2026-11-16

The entry is prepared in place. No commit or submission was made. The speed goal
remains unmet by the local proxy measurement; no contest rank is claimed.

## Files

- `parse.js`: new direct block/inline HTML scanner and reference finalization.
- `grammar.js`, `containers.js`: adapted marked compatibility rules; no runtime
  dependency on the vendored oracle or the old `marked-core.js`.
- `main.ts`: ordered input/output driver, compatible with native type stripping.
- `DESIGN.md`, `README.md`, `NOTICE`: architecture, reproduction, provenance.
- `validation/`: correctness, differential, profiling, and timing tools/results.
  `profile-inline.mjs`, `no-cache.mjs`, and `with-cache.mjs` are development
  variants, not entry dependencies. The output itself is in
  `/tmp/markdown-direct-html.json`, outside the repository size allowance.

`LICENSE` had a pre-existing working-tree modification and was not edited by
this work. Practice inputs, expected outputs, rules, and oracle were unchanged.

## Correctness

Reproduce from the repository root:

```sh
node validation/check.mjs
node validation/fuzz.mjs
node validation/structured-fuzz.mjs
sh validation/bench.sh
```

Final results:

- Practice: **720/720**, strict JavaScript string equality, preserving order.
- Random differential testing against marked 18.1.3: **100,000/100,000**.
- Structured differential testing: **20,000/20,000**, including nested
  containers, multiline references, tables, HTML state, and control characters.
- Actual `main.ts`: three fresh executions, each producing an ordered JSON array
  of exactly 720 strings, all matching expected output. All three output files
  had identical SHA-256:
  `e7e89c4fba2c45b1c4aa96c46c987e46c75a9fcdd08916b58ae7f2a7d7851724`.

The local preload substitutes the kit's input and output mounts, allowing the
actual entry point to run without writing outside the workspace and `/tmp`.
It does not alter rendering or the input data. Successful string comparisons
are not a proof of compatibility for every possible Markdown string.

## Final CPU measurements

Environment: local Node **v24.22.1**, rather than the contest's pinned Node
22.23.4 container. `process.cpuUsage()` is sampled at `beforeExit` in each fresh
process. Values include Node startup, imports, JSON reading/parsing, rendering,
and serialization/writing. The empty process has no input/output work. Each
entry execution is followed by one empty control; the three adjusted values
are summarized by their median, following the practice timing pattern.

| Run | Raw entry CPU (µs) | Empty CPU (µs) | Adjusted CPU (µs) |
| --- | ---: | ---: | ---: |
| 1 | 1,426,588 | 102,282 | 1,324,306 |
| 2 | 1,421,320 | 109,019 | 1,312,301 |
| 3 | 1,393,889 | 93,444 | 1,300,445 |

Median raw CPU: **1,421,320 µs**. Median adjusted CPU: **1,312,301 µs**.
These are CPU measurements, not wall-clock times. Machine-readable user/system
components are in `results.json` and `raw-*.json` / `empty-*.json`.

The official kit runner (`cli/makefun.mjs`, `kit.json`, and scorer) is absent
from this repository. Official cgroup accounting, pinned-image execution,
one-CPU isolation, and the contest heat cannot be reproduced here. The local
proxy exceeds 1,150,000 µs, and the official target is **not verified**.

## Baseline and optimization evidence

Before replacement, the existing entry matched all 720 cases. Its single local
parse-only measurement was 1,273,872 µs CPU (943.876 ms wall). A separate vendored
marked parse-only run measured 1,538,792 µs CPU (1,321.635 ms wall). These exclude
startup/input/output and are **not comparable to the final full-entry totals**.
They are individual observations, not reliable speedup estimates.

CPU profiles were captured locally in `/tmp/direct.cpuprofile` and
`/tmp/direct2.cpuprofile`. Samples identified list-boundary scanning, inline
text regexes, delimiter matching/masking, and garbage collection as substantial
costs. Retained changes cache bullet regexes, avoid expanding spaces without
tabs, use indexed first-line extraction, skip unnecessary masking, and avoid
Unicode iterator allocations. A pure-fragment memoization experiment showed no
consistent benefit in alternating runs and was not retained in the entry.
The profiling variants and comparison script remain available in `validation/`.

The principal remaining limitation is speed: complex container grammar and
inline lookahead still allocate substrings and run compatibility regexes.
Further performance work must preserve the exact marked-specific semantics.
