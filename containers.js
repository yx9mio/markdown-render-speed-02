// List indentation and quote continuation rules adapted from marked 18.1.3 (MIT).
import { Rules, trimChar as L, expandTabs as J } from './grammar.js';
export class Containers extends Rules {
list(e){let t=this.rules.block.list.exec(e);if(t){let n=e,s=()=>n.length-e.length,r=t[1].trim(),o=r.length>1,i={type:"list",raw:"",ordered:o,start:o?+r.slice(0,-1):"",loose:!1,items:[]};r=o?`\\d{1,9}\\${r.slice(-1)}`:`\\${r}`,this.options.pedantic&&(r=o?r:"[*+-]");let l=this.rules.other.listItemRegex(r),p=!1;for(;e;){let u=!1,d="";if(!(t=l.exec(e))||this.rules.block.hr.test(e))break;let k=s();e=e.substring(t[0].length);let g=firstLine(t[2]),b=t[1].length,m=this.options.pedantic?J(g,b):expandLeadingTabs(g,b,this.rules.other.leadingSpaceTab),f=firstLine(e),y=!m.trim(),R=0;if(this.options.pedantic?(R=2,d=m.trimStart()):y?R=b+1:(R=m.search(this.rules.other.nonSpaceChar),R=R>4?1:R,d=m.slice(R),R+=b),y&&this.rules.other.blankLine.test(f)&&(e=e.substring(f.length+1),u=!0),!u){let v=this.rules.other.nextBulletRegex(R),Q=this.rules.other.hrRegex(R),ee=this.rules.other.fencesBeginRegex(R),te=this.options.pedantic?this.rules.other.pedanticHeadingBeginRegex(R):this.rules.other.headingBeginRegex(R),M=this.rules.other.htmlBeginRegex(R),ne=this.rules.other.blockquoteBeginRegex(R);for(;e;){let U=firstLine(e),Z;if(f=U,this.options.pedantic?(f=f.replace(this.rules.other.listReplaceNesting,"  "),Z=f):Z=expandLeadingTabs(f,0,this.rules.other.leadingSpaceTab),ee.test(f)||te.test(f)||M.test(f)||ne.test(f)||v.test(f)||Q.test(f))break;if(Z.search(this.rules.other.nonSpaceChar)>=R||!f.trim())d+=`
`+Z.slice(R);else{if(y||m.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||ee.test(m)||te.test(m)||M.test(m)||Q.test(m))break;let qe=!this.options.pedantic&&/^ {0,3}(?:=+|-+) *$/.test(f)&&this.rules.block.lheading.test(`${m}
${f}`)?`    ${Z.replace(/^ {0,3}/,"")}`:f;d+=`
`+qe}y=!f.trim(),e=e.substring(U.length+1),m=Z.slice(R)}}let A=n.slice(k,s());i.loose||(p?i.loose=!0:this.rules.other.doubleBlankLine.test(A)&&(p=!0)),i.items.push({type:"list_item",raw:A,task:!!this.options.gfm&&this.rules.other.listIsTask.test(d),text:d})}let h=i.items.at(-1);if(h)h.raw=h.raw.trimEnd(),h.text=h.text.trimEnd();else return;i.raw=n.slice(0,s()).trimEnd();return this.lexer.renderList(i)}}
blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let n=L(t[0],`
`).split(`
`),s="",r="",o=this.lexer.context(true);for(;n.length>0;){let i=!1,l=[],p;for(p=0;p<n.length;p++)if(this.rules.other.blockquoteStart.test(n[p]))l.push(n[p]),i=!0;else if(!i)l.push(n[p]);else break;n=n.slice(p);let h=l.join(`
`),u=h.replace(this.rules.other.blockquoteMarkerWhitespace,(g,b,m)=>b+J(m,b.length)).replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");s=s?`${s}
${h}`:h,r=r?`${r}
${u}`:u;let d=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.scanBlocks(u,o,!0),this.lexer.state.top=d,n.length===0)break;let k=o.last;if(k?.type==="code"||k?.type==="heading"||k?.type==="hr"||k?.type==="html"||k?.type==="table")break;if(k?.type==="blockquote"){let g=k,b=n.join(`
`),m=g.raw+`
`+b.replace(this.rules.other.blockquoteSetextReplace2,""),f=this.blockquote(m);this.lexer.replaceLast(o,f);let y=m.substring(f.raw.length).replace(/^\n/,""),R=y?y.split(`
`).length:0,A=R?n.slice(0,-R):n;if(A.length>0&&(s=`${s}
${A.join(`
`)}`),r=r.substring(0,r.length-g.text.length)+f.text,n=n.slice(A.length),n.length>0&&this.rules.other.blockquoteStart.test(n[0]))continue;break}else if(k?.type==="list"){let g=k,b=g.raw+`
`+n.join(`
`),m=this.list(b);this.lexer.replaceLast(o,m);let f=m.raw.length>g.raw.length?b.slice(g.raw.length+1,m.raw.length).split(`
`).length:0;if(f>0){let y=n.slice(0,f).join(`
`);s=`${s}
${y}`,r=`${r}
${y}`}n=n.slice(f);continue}}this.lexer.flush(o);return{type:"blockquote",raw:s,html:"<blockquote>\n"+o.html+"</blockquote>\n",text:r}}}
}

function firstLine(source) { const end=source.indexOf("\n"); return end<0?source:source.slice(0,end); }

// Expanding ASCII spaces alone is an identity operation. Avoid the regex,
// callback and replacement string unless a tab can actually occur.
function expandLeadingTabs(line, column, rule) {
  return line.indexOf('\t')<0 ? line : line.replace(rule, prefix=>J(prefix,column));
}
