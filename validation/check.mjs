import fs from 'node:fs';
import {parse} from '../parse.js';
const cases=JSON.parse(fs.readFileSync(new URL('../practice/input/cases.json',import.meta.url)));
const expected=JSON.parse(fs.readFileSync(new URL('../practice/reference/expected.json',import.meta.url))).cases;
let passed=0;const failures=[];
for(let i=0;i<cases.length;i++) {
 const c=cases[i],actual=parse(c.markdown),want=expected[i].html;
 if(actual===want){passed++;continue;}
 let at=0;while(actual[at]===want[at]&&at<actual.length)at++;
 failures.push({id:c.id,at,source:c.markdown,actual,want});
}
fs.writeFileSync(new URL('./failures.json',import.meta.url),JSON.stringify(failures,null,2));
console.log(`${passed}/${cases.length}`);
for(const f of failures.slice(0,Number(process.argv[2]||12))) console.log(JSON.stringify(f));
