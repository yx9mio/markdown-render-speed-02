import {parse} from '../parse.js';
import {marked} from '../baselines/vendor/marked/marked.esm.js';
let state=918273;const rand=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n};
const atoms=['a','b',' ', '\t','\n','\r','*','**','_','__','~','~~','`','``','\\','[',']','(',')','!', '<','>','&',';','#','-', '+','1.', 'http','https://a.b','www.x.org','mailto:x@y.z','foo_bar','😀','é','中','\u0000','\u2028','&#38;','&amp;','"',"'",':'];
for(let i=0;i<100000;i++){
 let s='';const count=rand(100);for(let j=0;j<count;j++)s+=atoms[rand(atoms.length)];
 const a=parse(s),b=marked.parse(s);if(a!==b){console.log(JSON.stringify({i,s,a,b}));process.exit(1)}
}
console.log('100000 differential fuzz cases match');
