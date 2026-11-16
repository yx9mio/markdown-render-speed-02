import fs from 'node:fs';
import {createHash} from 'node:crypto';
const html=fs.readFileSync('/tmp/markdown-direct-html.json');
const actual=JSON.parse(html);
const expected=JSON.parse(fs.readFileSync(new URL('../practice/reference/expected.json',import.meta.url))).cases;
const passed=actual.filter((s,i)=>typeof s==='string'&&s===expected[i].html).length;
if(actual.length!==720||passed!==720)throw new Error(`${passed}/720`);
console.log(JSON.stringify({passed,length:actual.length,sha256:createHash('sha256').update(html).digest('hex')}));
