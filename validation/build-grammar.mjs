// Development-only extraction of MIT-licensed marked compatibility rules.
import fs from 'node:fs';
import {Tokenizer} from '../baselines/vendor/marked/marked.esm.js';
let source=fs.readFileSync(new URL('../baselines/vendor/marked/marked.esm.js',import.meta.url),'utf8');
let prefix=source.slice(0,source.indexOf('var _=class'));
// Images use a plain-text emission mode rather than a second walk of a token tree.
prefix=prefix.replace('let d=n.inlineTokens(i),k=n.state.linkEmitted;', 'let oldAlt=n.alt;n.alt=oldAlt||l;let d=n.inlineTokens(i),k=n.state.linkEmitted;n.alt=oldAlt;');
const methods=['space','code','fences','heading','hr','html','def','lheading','paragraph','text','escape','tag','link','reflink','emStrong','codespan','br','del','autolink','url','inlineText'];
let body=methods.map(k=>Tokenizer.prototype[k].toString()).join('\n');
body=body.replaceAll('tokens:[{type:"text",raw:n,text:n}]','tokens:null');
fs.writeFileSync(new URL('../grammar.js',import.meta.url),prefix+'\nclass Rules {\nconstructor(lexer) { this.lexer=lexer; this.options={gfm:true}; this.rules={other:T,block:V.gfm,inline:G.gfm}; }\n'+body+'\n}\nexport { Rules, T, V, G, P as escapeHTML, he as cleanURL, Ie as decodeNumeric, F as normalizeLabel, de as splitCells, L as trimChar, J as expandTabs, Ae as pushMask, Ee as popMask };\n');
// These expressions only consume runs of '*'/'_'/'~', so length is ASCII.
let optimized=fs.readFileSync(new URL('../grammar.js',import.meta.url),'utf8')
 .replaceAll('[...g].length','g.length').replaceAll('[...i].length','i.length')
 .replaceAll('[...s[0]][0].length','(s[0].codePointAt(0)>65535?2:1)');
fs.writeFileSync(new URL('../grammar.js',import.meta.url),optimized);
optimized=fs.readFileSync(new URL('../grammar.js',import.meta.url),'utf8')
 .replace('function J(a,e=0){','function J(a,e=0){if(!a.includes("\\t"))return a;')
 .replaceAll('[...s[0]].length','pointLength(s[0])')
 .replace('[...t.slice(Math.max(0,l-2),l)].at(-1)??""','lastPoint(t,l)');
optimized+='\nfunction pointLength(s) { let count=s.length;for(let i=0;i<s.length-1;i++) {const c=s.charCodeAt(i);if(c>=0xD800&&c<=0xDBFF){const d=s.charCodeAt(i+1);if(d>=0xDC00&&d<=0xDFFF){count--;i++;}}}return count;}\nfunction lastPoint(s,end) { if(!end)return "";const c=s.charCodeAt(end-1);if(c>=0xDC00&&c<=0xDFFF&&end>1){const d=s.charCodeAt(end-2);if(d>=0xD800&&d<=0xDBFF)return s.slice(end-2,end);}return s[end-1]; }\n';
fs.writeFileSync(new URL('../grammar.js',import.meta.url),optimized);
