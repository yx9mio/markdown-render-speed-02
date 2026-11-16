import {parse} from '../parse.js';
import {marked} from '../baselines/vendor/marked/marked.esm.js';
import fs from 'node:fs';
let state=8112471;const rand=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state%n};
const parts=['hello <a href="x">\n', 'hello <code>\n','a *b* c\n','[a] **[b][a]**\n','[a]: /url "title"\n','[a\nb]: /url\n','[a\nb]\n','<a href="x">\n','</a>\n','<code>\n','</code>\n','a &amp; b &#0;\n','<script>hi</script>\n','> a\n> b\n','> - a\n- b\n','- [x] a\n  - b\n','- a\n\n  b\n','```js\n<a>\n```\n','a | b\n--- | ---\nx | y\n','a\n==\n','<i>hi</i>\n','<div>\nx\n</div>\n','\n','a\\\nb\n','    code\n','![a *b*](url)\n','www.x.org (http://x.a)\n','\x01\x02\0\n'];
for(let i=0;i<20000;i++) {
 let s='';let count=rand(15)+1;
 for(let j=0;j<count;j++)s+=['','> ','  ','\t','- '][rand(5)]+parts[rand(parts.length)];
 let a=parse(s),b=marked.parse(s);
 if(a!==b){fs.writeFileSync(new URL('./structured-failure.json',import.meta.url),JSON.stringify({i,s,a,b},null,2));console.log(JSON.stringify({i,s,a,b}));process.exit(1);}
}
console.log('20000 structured differential cases match');
