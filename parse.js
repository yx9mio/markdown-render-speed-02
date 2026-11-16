// Direct HTML scanner. Compatibility grammar derived from marked 18.1.3 (MIT).
// No block or inline token tree is built. Only the previous block and the item
// spans required to decide list looseness are retained by each block context.
import { Containers } from './containers.js';
import { T, G, escapeHTML as esc, cleanURL, decodeNumeric, normalizeLabel,
  splitCells, trimChar, pushMask, popMask } from './grammar.js';

const bulletCache=new Map();
const makeBullet=T.listItemRegex;
T.listItemRegex=bullet=>{let rule=bulletCache.get(bullet);if(!rule){rule=makeBullet(bullet);bulletCache.set(bullet,rule);}return rule;};
const quickInlineText=/^(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|$)|[^ ](?= {2,}\n)))/;
const CHECK='<input disabled="" type="checkbox"> ';
const CHECKED='<input checked="" disabled="" type="checkbox"> ';
class Scanner {
  constructor(source) {
    this.rules=new Containers(this);
    this.state={inLink:false,inRawBlock:false,linkEmitted:false,linkParenPossible:true,top:true};
    this.links=Object.create(null);
    this.tokens={links:this.links}; // reference lookup only, not a token collection
    this.alt=false;
    this.deferred=[];
    this.marker='\0';
    while(source.includes(this.marker)) this.marker+='\0';
    this.openText=this.marker+'P'+this.marker;
    this.closeText=this.marker+'p'+this.marker;
    this.defer=source.includes(']:');
  }
  inline(source) { return source; } // leaf grammar reports source, never queues tokens
  emitInline(source, prefix='') {
    if(this.defer) {
      const id=this.deferred.length;
      this.deferred.push([source,prefix]);
      return this.marker+id+this.marker;
    }
    this.state.inRawBlock=false;
    return prefix+this.inlineTokens(source);
  }
  finish(html) {
    if(!this.deferred.length) return html;
    const marker=this.marker;
    let result='',start=0,pos;
    while((pos=html.indexOf(marker,start))!==-1) {
      result+=html.slice(start,pos);
      const end=html.indexOf(marker,pos+marker.length);
      const [source,prefix]=this.deferred[+html.slice(pos+marker.length,end)];
      this.state.inRawBlock=false;
      result+=prefix+this.inlineTokens(source);
      start=end+marker.length;
    }
    return result+html.slice(start);
  }
  context(top, list=false) {
    return {top,list,html:'',last:null,pending:null,loose:false,first:null,task:null};
  }
  replaceLast(ctx, block) {
    this.flush(ctx);
    ctx.html=ctx.html.slice(0,ctx.last.start)+block.html;
    block.start=ctx.last.start;
    ctx.last=block;
  }
  flush(ctx) {
    const p=ctx.pending;
    if(!p) return;
    let prefix='';
    if(ctx.first===null) {
      ctx.first=p.type;
      if(ctx.task && (p.type==='text'||p.type==='paragraph') && T.listIsTask.test(p.text)) {
        p.text=p.text.replace(T.listReplaceTask,'');
        prefix=ctx.task;
      }
    }
    const inside=this.emitInline(p.text,prefix);
    p.start=ctx.html.length;
    if(p.type==='text' && ctx.list) ctx.html+=this.openText+inside+this.closeText;
    else if(p.type==='text') ctx.html+=inside;
    else ctx.html+='<p>'+inside+'</p>\n';
    ctx.last=p;
    ctx.pending=null;
  }
  append(ctx,block,html) {
    this.flush(ctx);
    if(ctx.first===null)ctx.first=block.type;
    block.start=ctx.html.length;
    ctx.html+=html;
    ctx.last=block;
  }
  scanBlocks(source,ctx=this.context(true),continuation=false) {
    const r=this.rules;
    let pos=0;
    while(pos<source.length) {
      const rest=source.slice(pos);
      let b;
      const ch=rest.charCodeAt(0);
      this.state.top=ctx.top;
      if((ch===10||ch===32||ch===9||ch===13) && (b=r.space(rest))) {
        pos+=b.raw.length;
        if(b.raw.length===1 && (ctx.pending||ctx.last)) {
          (ctx.pending||ctx.last).raw+='\n';
        } else {
          this.flush(ctx);
          if(T.anyLine.test(b.raw)) ctx.loose=true;
          b.start=ctx.html.length;ctx.last=b;
        }
        continue;
      }
      if((ch===32||ch===9)&&(b=r.code(rest))) {
        pos+=b.raw.length;
        if(ctx.pending) {
          ctx.pending.raw+=(ctx.pending.raw.endsWith('\n')?'':'\n')+b.raw;
          ctx.pending.text+='\n'+b.text;
        } else this.append(ctx,b,this.codeHTML(b));
        continue;
      }
      if((ch===96||ch===126||ch===32)&&(b=r.fences(rest))) {
        pos+=b.raw.length;this.append(ctx,b,this.codeHTML(b));continue;
      }
      if((ch===35||ch===32)&&(b=r.heading(rest))) {
        pos+=b.raw.length;
        this.flush(ctx);
        this.append(ctx,b,`<h${b.depth}>${this.emitInline(b.text)}</h${b.depth}>\n`);continue;
      }
      if((ch===42||ch===45||ch===95||ch===32)&&(b=r.hr(rest))) {
        pos+=b.raw.length;this.append(ctx,b,'<hr>\n');continue;
      }
      if((ch===62||ch===32)&&r.rules.block.blockquote.test(rest))this.flush(ctx);
      if((ch===62||ch===32)&&(b=r.blockquote(rest))) {
        pos+=b.raw.length;this.append(ctx,b,b.html);continue;
      }
      if((ch===42||ch===45||ch===43||ch===32||(ch>=48&&ch<=57))&&r.rules.block.list.test(rest))this.flush(ctx);
      if((ch===42||ch===45||ch===43||ch===32||(ch>=48&&ch<=57))&&(b=r.list(rest))) {
        pos+=b.raw.length;this.append(ctx,b,b.html);ctx.top=true;continue;
      }
      if((ch===60||ch===32)&&(b=r.html(rest))) {
        pos+=b.raw.length;this.append(ctx,b,b.text);continue;
      }
      if((ch===91||ch===32)&&(b=r.def(rest))) {
        pos+=b.raw.length;
        if(ctx.pending) {
          ctx.pending.raw+=(ctx.pending.raw.endsWith('\n')?'':'\n')+b.raw;
          ctx.pending.text+='\n'+b.raw;
        } else {
          if(!this.links[b.tag])this.links[b.tag]={href:b.href,title:b.title};
          this.append(ctx,b,'');
        }
        continue;
      }
      if((b=this.table(rest,ctx))) {
        pos+=b.raw.length;this.append(ctx,b,b.html);continue;
      }
      if((b=r.lheading(rest))) {
        pos+=b.raw.length;this.flush(ctx);
        this.append(ctx,b,`<h${b.depth}>${this.emitInline(b.text)}</h${b.depth}>\n`);continue;
      }
      if(ctx.top&&(b=r.paragraph(rest))) {
        pos+=b.raw.length;
        if(continuation&&ctx.pending?.type==='paragraph') {
          ctx.pending.raw+=(ctx.pending.raw.endsWith('\n')?'':'\n')+b.raw;
          ctx.pending.text+='\n'+b.text;
        }else {this.flush(ctx);ctx.pending=b;ctx.last=b;}
        continuation=false;continue;
      }
      if((b=r.text(rest))) {
        pos+=b.raw.length;
        if(ctx.pending?.type==='text') {
          ctx.pending.raw+=(ctx.pending.raw.endsWith('\n')?'':'\n')+b.raw;
          ctx.pending.text+='\n'+b.text;
        }else {this.flush(ctx);ctx.pending=b;ctx.last=b;}
        continue;
      }
      throw new Error('Block scanner failed at '+pos);
    }
    // The last paragraph stays pending until the caller decides whether a lazy
    // continuation belongs to it (quotes), or until its container closes.
    this.state.top=true;
    return ctx;
  }
  codeHTML(b) {
    const lang=(b.lang||'').match(T.notSpaceStart)?.[0];
    const text=b.text?b.text.replace(T.endingNewline,'')+'\n':'';
    return '<pre><code'+(lang?' class="language-'+esc(lang)+'"':'')+'>'+esc(text,true)+'</code></pre>\n';
  }
  renderList(b) {
    const items=[];
    for(const span of b.items) {
      const ctx=this.context(false,true);
      ctx.task=span.task?(T.listTaskCheckbox.exec(span.raw)?.[0]==='[ ]'?CHECK:CHECKED):null;
      this.scanBlocks(span.text,ctx);this.flush(ctx);
      b.loose ||= ctx.loose;
      items.push(ctx.html);
    }
    let html='';
    for(let item of items) {
      item=item.replaceAll(this.openText,b.loose?'<p>':'').replaceAll(this.closeText,b.loose?'</p>\n':'');
      html+='<li>'+item+'</li>\n';
    }
    const tag=b.ordered?'ol':'ul';
    b.html='<'+tag+(b.ordered&&b.start!==1?' start="'+b.start+'"':'')+'>\n'+html+'</'+tag+'>\n';
    // Only raw boundaries and rendered HTML survive a container close.
    delete b.items;
    return b;
  }
  table(source,ctx) {
    const match=this.rules.rules.block.table.exec(source);
    if(!match||!T.tableDelimiter.test(match[2]))return;
    const head=splitCells(match[1]);
    const align=match[2].replace(T.tableAlignChars,'').split('|');
    if(head.length!==align.length)return;
    this.flush(ctx);
    for(let i=0;i<align.length;i++) align[i]=T.tableAlignRight.test(align[i])?'right':T.tableAlignCenter.test(align[i])?'center':T.tableAlignLeft.test(align[i])?'left':null;
    let html='<table>\n<thead>\n'+this.row(head,align,'th')+'</thead>\n';
    const body=match[3]?.trim()?match[3].replace(T.tableRowBlankLine,''):'';
    if(body) {
      html+='<tbody>';
      let pos=0;
      while(pos<=body.length) {
        let end=body.indexOf('\n',pos);if(end<0)end=body.length;
        html+=this.row(splitCells(body.slice(pos,end),head.length),align,'td');
        pos=end+1;
      }
      html+='</tbody>';
    }
    return {type:'table',raw:trimChar(match[0],'\n'),html:html+'</table>\n'};
  }
  row(cells,align,tag) {
    let out='<tr>\n';
    for(let i=0;i<cells.length;i++)out+='<'+tag+(align[i]?' align="'+align[i]+'"':'')+'>'+this.emitInline(cells[i])+'</'+tag+'>\n';
    return out+'</tr>\n';
  }
  linkInText(source) {
    if(!source.includes('['))return false;
    const rule=this.rules.rules.inline;
    for(const m of source.matchAll(rule.blockSkip)) if(rule.link.test(m[0])&&source[m.index-1]!=='!')return true;
    for(const m of source.matchAll(rule.reflinkSearch)) {
      const s=m[0],start=s.lastIndexOf('[');
      if(s[0]!=='!' && Object.hasOwn(this.links,normalizeLabel(s.slice(start+1,-1))) && !(start>1&&this.linkInText(s.slice(1,start-1))))return true;
    }
    return false;
  }
  mask(source) {
    const rule=this.rules.rules.inline;
    let masked=source;
    if(source.includes('[')) {
      const replace=s=>{
        const start=s.lastIndexOf('[');
        if(!Object.hasOwn(this.links,normalizeLabel(s.slice(start+1,-1))))return s;
        if(start>1&&s[0]!=='!') {
          const inside=s.slice(1,start-1);
          if(this.linkInText(inside))return '['+inside.replace(rule.reflinkSearch,replace)+']['+'a'.repeat(s.length-start-2)+']';
        }
        return '['+'a'.repeat(s.length-2)+']';
      };
      masked=masked.replace(rule.reflinkSearch,replace);
    }
    if(source.includes('\\')||source.includes('`'))masked=masked.replace(rule.anyPunctuationOutsideCode,(m,code,punct)=>punct?'+'.repeat(m.length):code?code+m.slice(code.length,-code.length).replace(/`/g,'+')+code:m);
    if(source.includes('[')||source.includes('<')||source.includes('`'))masked=masked.replace(rule.blockSkip,(m,unused,bang)=>{const n=bang?bang.length:0;return m.slice(0,n)+'['+'a'.repeat(m.length-n-2)+']';});
    return masked;
  }
  inlineTokens(source) {
    const quick=!/[@:]|www\./.test(source);
    if(quick&&!/[\\<!\[!*_`~]| {2,}\n/.test(source))return this.alt||this.state.inRawBlock?source:esc(decodeNumeric(source));
    const old=this.state.linkParenPossible;
    this.state.linkParenPossible=old&&source.includes(')');
    const masked=/[*_~]/.test(source)?this.mask(source):source;
    pushMask(this.rules,masked);
    try {return this.scanInline(source,masked,quick);}
    finally {popMask(this.rules);this.state.linkParenPossible=old;}
  }
  scanInline(source,masked,quick) {
    const r=this.rules;
    let pos=0,out='',previous='',wasText=false,pending='',pendingEscaped=false,hasPending=false;
    while(pos<source.length) {
      if(!wasText)previous='';wasText=false;
      const rest=source.slice(pos),ch=source.charCodeAt(pos);
      let b;
      if(ch===92&&(b=r.escape(rest))) {}
      else if(ch===60&&(b=r.tag(rest))) {}
      else if((ch===91||ch===33)&&(b=r.link(rest))) {}
      else if((ch===91||ch===33)&&(b=r.reflink(rest,this.links))) {}
      else if((ch===42||ch===95)&&(b=r.emStrong(rest,masked,previous))) {}
      else if(ch===96&&(b=r.codespan(rest))) {}
      else if((ch===32||ch===92||ch===10)&&(b=r.br(rest))) {}
      else if(ch===126&&(b=r.del(rest,masked,previous))) {}
      else if(ch===60&&(b=r.autolink(rest))) {}
      else if(!quick&&!this.state.inLink&&(b=r.url(rest))) {}
      else if(quick ? (b=quickInlineText.exec(rest)) : (b=r.inlineText(rest))) {
        if(quick)b={type:'text',raw:b[0],text:this.state.inRawBlock?b[0]:decodeNumeric(b[0]),escaped:this.state.inRawBlock};
        if(!b.raw.endsWith('_'))previous=b.raw.slice(-1);
        wasText=true;
      }
      else throw new Error('Inline scanner failed at '+pos);
      pos+=b.raw.length;
      if(b.type==='text') {
        if(!hasPending)pendingEscaped=b.escaped;
        hasPending=true;pending+=b.text;
      } else {
        if(hasPending)out+=this.alt||pendingEscaped?pending:esc(pending);
        pending='';hasPending=false;
        out+=this.inlineHTML(b);
      }
    }
    if(hasPending)out+=this.alt||pendingEscaped?pending:esc(pending);
    return out;
  }
  inlineHTML(b) {
    if(this.alt) {
      if(b.type==='br')return '';
      return typeof b.tokens==='string'?b.tokens:b.text||'';
    }
    switch(b.type) {
      case 'escape': return esc(b.text);
      case 'text': return b.escaped?b.text:esc(b.text);
      case 'html':return b.text;
      case 'em':case 'strong':case 'del':return '<'+b.type+'>'+b.tokens+'</'+b.type+'>';
      case 'codespan':return '<code>'+esc(b.text,true)+'</code>';
      case 'br':return '<br>';
      case 'link': {
        const inside=b.autolink?esc(b.text,true):b.tokens;
        const href=cleanURL(b.href);
        if(href===null)return inside;
        return '<a href="'+esc(href,b.autolink)+'"'+(b.title?' title="'+esc(b.title)+'"':'')+'>'+inside+'</a>';
      }
      case 'image': {
        const href=cleanURL(b.href),alt=typeof b.tokens==='string'?b.tokens:b.text;
        if(href===null)return esc(alt);
        return '<img src="'+esc(href)+'" alt="'+esc(alt)+'"'+(b.title?' title="'+esc(b.title)+'"':'')+'>';
      }
      default:throw new Error('Unexpected inline '+b.type);
    }
  }
}
export function parse(markdown) {
  const source=markdown.replace(/\r\n|\r/g,'\n');
  const scanner=new Scanner(source);
  const ctx=scanner.scanBlocks(source);
  scanner.flush(ctx);
  return scanner.finish(ctx.html);
}
