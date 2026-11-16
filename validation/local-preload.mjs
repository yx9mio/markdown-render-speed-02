// Development-only mount substitute. Runs the actual, unmodified main.ts.
import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
const read=fs.readFileSync,write=fs.writeFileSync;
fs.readFileSync=function(path,...args) {
  return read.call(this,path==='/input/cases.json'?new URL('../practice/input/cases.json',import.meta.url):path,...args);
};
fs.writeFileSync=function(path,...args) {
  return write.call(this,path==='/output/html.json'?'/tmp/markdown-direct-html.json':path,...args);
};
syncBuiltinESMExports();
process.on('beforeExit',()=>{
  const {user,system}=process.cpuUsage();
  process.stderr.write(JSON.stringify({user_us:user,system_us:system,total_us:user+system})+'\n');
});
