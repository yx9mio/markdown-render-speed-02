// Aggregate fresh-process measurements produced by bench.sh. This environment
// prevents Node spawning children, so the shell launches each process instead.
import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url)));
const runs=[];let hash;
for(let i=1;i<=3;i++) {
 const actual=read(`raw-${i}.json`),empty=read(`empty-${i}.json`),output=read(`output-${i}.json`);
 if(output.passed!==720||output.length!==720)throw new Error('Incorrect output');
 if(hash&&hash!==output.sha256)throw new Error('Nondeterministic output');
 hash=output.sha256;
 runs.push({run:i,actual,empty,adjusted_cpu_us:actual.total_us-empty.total_us,passed:720});
}
const median=a=>a.toSorted((a,b)=>a-b)[1];
const result={runtime:process.version,method:'Local process.cpuUsage at beforeExit, fresh processes, actual main.ts with filesystem mount substitution. Not official cgroup/container measurement.',runs,median_raw_cpu_us:median(runs.map(r=>r.actual.total_us)),median_adjusted_cpu_us:median(runs.map(r=>r.adjusted_cpu_us)),output_sha256:hash};
fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
