# markdown-render-speed-02

[![make.fun](https://make.fun/badge/markdown-render-speed-02.svg)](https://make.fun/bounty/markdown-render-speed-02)
[![rank](https://make.fun/badge/markdown-render-speed-02/yx9mio/markdown-render-speed-02/rank.svg)](https://make.fun/bounty/markdown-render-speed-02)
[![reward](https://make.fun/badge/markdown-render-speed-02/yx9mio/markdown-render-speed-02/reward.svg)](https://make.fun/bounty/markdown-render-speed-02)

A fast drop-in replacement for `marked.parse` (marked 18.1.3, default options), built for the [make.fun markdown-render-speed-02](https://make.fun/bounty/markdown-render-speed-02) competition.

`parse.js` exports `parse(markdown)`, which returns exactly the HTML that marked 18.1.3 renders with its default options (GFM on, breaks off, pedantic off). `main.ts` reads `/input/cases.json`, renders each case with `parse`, and writes `/output/html.json`.

The parser is an optimized fork of marked (`marked-core.js`, MIT, see LICENSE and NOTICE). All 720 practice cases match marked exactly, and it runs about 1.20x faster than the marked baseline on a single CPU.
