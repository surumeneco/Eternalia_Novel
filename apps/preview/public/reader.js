const el = id => document.getElementById(id);
const labels = { series:'シリーズ', volume:'編', part:'部', chapter:'章',category:'カテゴリ',tip:'設定',tipSection:'設定項目',language:'言語',word:'単語',grammar:'文法',periodization:'年代区分',event:'出来事'};
const $status = el('status');
async function api(url){ const r=await fetch(url); if(!r.ok) throw Error('公開情報を取得できませんでした'); return r.json(); }
function text(tag,value,className){ const n=document.createElement(tag); n.textContent=value; if(className)n.className=className; return n; }
function renderRich(parent,source){
  const segments=source.split(/\[\[page\]\]/g);
  segments.forEach((segment,i)=>{
    if(i>0){const hr=document.createElement('hr');hr.className='page-break';parent.append(hr);}
    const p=text('div','','body');const regex=/｜([^《\n]+)《([^》\n]+)》/g;let pos=0,match;
    while((match=regex.exec(segment))!==null){p.append(document.createTextNode(segment.slice(pos,match.index)));const ruby=document.createElement('ruby');ruby.append(document.createTextNode(match[1]));ruby.append(text('rt',match[2]));p.append(ruby);pos=regex.lastIndex;}
    p.append(document.createTextNode(segment.slice(pos)));parent.append(p);
  });
}
function showItem(node){const target=el('reading');target.replaceChildren();target.append(text('p',labels[node.kind]??'', 'eyebrow'),text('h2',node.content.title));if(node.content.body)renderRich(target,node.content.body);else target.append(text('p','説明はまだありません。','subtle'));if(node.kind==='event'&&node.content.details.year)target.append(text('p','相対年: '+node.content.details.year,'meta'));}
async function showSeries(id){try{const nodes=await api('/api/public/series/'+encodeURIComponent(id)+'/tree');const root=nodes.find(n=>n.id===id);if(!root)throw Error('シリーズを閲覧できません');el('library').hidden=true;el('series-view').hidden=false;const title=el('series-title');title.replaceChildren(text('h2',root.content.title),text('p',root.content.body||'公開されている情報を閲覧できます。','subtle'));const tree=el('tree');tree.replaceChildren();for(const node of nodes){const depth=(()=>{let d=0,p=node.parentId;while(p&&d<10){d++;p=nodes.find(x=>x.id===p)?.parentId;}return d})();const button=document.createElement('button');button.type='button';button.style.paddingLeft=(8+depth*13)+'px';button.append(text('span',labels[node.kind]??node.kind,'node-type'),text('span',node.content.title));button.onclick=()=>{tree.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));button.classList.add('selected');showItem(node);history.replaceState({},'',`/series/${id}?item=${node.id}`);};tree.append(button);}const preferred=new URLSearchParams(location.search).get('item');const index=Math.max(0,nodes.findIndex(n=>n.id===preferred));tree.querySelectorAll('button')[index]?.click();$status.textContent='';}catch(e){$status.textContent=e.message;$status.className='status error';}}
async function list(){try{const series=await api('/api/public/series');const library=el('library');library.replaceChildren();if(!series.length)library.append(text('p','公開シリーズはまだありません。作者画面でシリーズを作成し、公開してください。','empty-state'));for(const item of series){const button=document.createElement('button');button.className='series-card';button.append(text('span','✦','card-symbol'),text('strong',item.content.title),text('small','公開シリーズを開く'));button.onclick=()=>{history.pushState({},'',`/series/${item.id}`);showSeries(item.id);};library.append(button);} $status.textContent='';}catch(e){$status.textContent=e.message;$status.className='status error';}}
el('back').onclick=()=>{history.pushState({},'','/');el('series-view').hidden=true;el('library').hidden=false;};
const m=/^\/series\/([0-9a-f-]{36})/.exec(location.pathname); if(m)showSeries(m[1]); else list();
