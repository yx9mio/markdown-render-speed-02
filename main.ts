import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from './parse.js';

// The kit supplies an ordered array of { id, markdown }; only HTML is returned.
const inputs = JSON.parse(readFileSync('/input/cases.json', 'utf8'));
const html: string[] = new Array(inputs.length);
for (let index = 0; index < inputs.length; index++) {
  html[index] = parse(inputs[index].markdown);
}
writeFileSync('/output/html.json', JSON.stringify(html));
