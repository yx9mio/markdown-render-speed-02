import fs from 'node:fs';
import {Tokenizer} from '../baselines/vendor/marked/marked.esm.js';
let list=Tokenizer.prototype.list.toString();
list=list.slice(0,list.indexOf('for(let u of i.items)'))+'return this.lexer.renderList(i)}}';
list=list.replace('loose:!1,text:d,tokens:[]','text:d');
let quote=Tokenizer.prototype.blockquote.toString().replace('o=[]','o=this.lexer.context(true)')
.replace('this.lexer.blockTokens(u,o,!0)','this.lexer.scanBlocks(u,o,!0)')
.replaceAll('o.at(-1)','o.last').replace('o[o.length-1]=f','this.lexer.replaceLast(o,f)').replace('o[o.length-1]=m','this.lexer.replaceLast(o,m)')
.replace('return{type:"blockquote",raw:s,tokens:o,text:r}', 'this.lexer.flush(o);return{type:"blockquote",raw:s,html:"<blockquote>\\n"+o.html+"</blockquote>\\n",text:r}');
fs.writeFileSync(new URL('../containers.js',import.meta.url),`// List indentation and quote continuation rules adapted from marked 18.1.3 (MIT).\nimport { Rules, trimChar as L, expandTabs as J } from './grammar.js';\nexport class Containers extends Rules {\n${list}\n${quote}\n}\n`);
let optimized=fs.readFileSync(new URL('../containers.js',import.meta.url),'utf8');
optimized=optimized.replaceAll('e.split(`\n`,1)[0]','firstLine(e)').replaceAll('t[2].split(`\n`,1)[0]','firstLine(t[2])');
optimized+='\nfunction firstLine(source) { const end=source.indexOf("\\n"); return end<0?source:source.slice(0,end); }\n';
fs.writeFileSync(new URL('../containers.js',import.meta.url),optimized);
