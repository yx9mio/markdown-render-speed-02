import fs from 'node:fs';
import {parse as cached} from './with-cache.mjs';
import {parse as uncached} from './no-cache.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('../practice/input/cases.json',import.meta.url)));
for(let i=0;i<4;i++)for(const [name,parse] of (i%2?[['uncached',uncached],['cached',cached]]:[['cached',cached],['uncached',uncached]])) {
 const start=process.cpuUsage();for(const c of cases)parse(c.markdown);
 const cpu=process.cpuUsage(start);console.log(name,cpu.user+cpu.system);
}
