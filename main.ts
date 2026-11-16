import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from './parse.js';

const cases = JSON.parse(readFileSync('/input/cases.json', 'utf8'));
const output = new Array(cases.length);
for (let index = 0; index < cases.length; index++) {
  output[index] = parse(cases[index].markdown);
}
writeFileSync('/output/html.json', JSON.stringify(output));
