/** Explicit opt-in demo data. Never overwrites an existing local store. */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createNode, publishNode, newLibrary } from '../../../packages/contracts/dist/index.js';
const dir=path.resolve(process.env.PREVIEW_DATA_DIR || '.local');
fs.mkdirSync(dir,{recursive:true,mode:0o700});
const file=path.join(dir,'preview-data.json');
if(fs.existsSync(file)){ console.error('既存のローカルデータがあります。デモデータで上書きしません。'); process.exit(1); }
let db=newLibrary();const now=Date.now()-1000;
function make(kind,parentId,title,body='',details={}){const id=randomUUID();db=createNode(db,{id,kind,parentId,content:{title,body,details},now});return id;}
const s=make('series',null,'デモ世界：星灯りの年代記','小さな都市から始まる、古い記憶と新しい星の物語。');
const vol=make('volume',s,'第一編：薄明','第一の物語。');
const part=make('part',vol,'第一部：出発');
const chapter=make('chapter',part,'第一章：朝の書庫','窓から差し込む光が、古い本の背を金色に染めていた。\n\n「ここが、｜永遠《エターナリア》へ続く道なの？」\n\n[[page]]\n\n少女が扉を開くと、まだ誰も知らない星の名前が聞こえた。');
const cat=make('category',s,'人物','キャラクターの設定資料。',{presets:JSON.stringify([{title:'プロフィール',body:'年齢：\n出身：'}])});
const tip=make('tip',cat,'リナ','書庫の管理人。');
const lang=make('language',s,'古星語','夜空に宿る言葉。');
const word=make('word',lang,'ael','意味：光',{partOfSpeech:'名詞'});
const gram=make('grammar',lang,'名詞の基本語順','主語と修飾語の位置に関する備忘。');
const period=make('periodization',s,'第一紀','始まりの時代。');
const event=make('event',period,'星の塔が建つ','都市の起源とされる出来事。',{year:'120'});
for(const id of [s,vol,part,chapter,cat,tip,lang,word,gram,period,event]) {const n=db.nodes.find(n=>n.id===id);db=publishNode(db,id,n.revision,now);}
for(const n of db.nodes.filter(n=>n.kind==='tipSection')){db=publishNode(db,n.id,n.revision,now);}
fs.writeFileSync(file,JSON.stringify(db,null,2),{flag:'wx',mode:0o600});
console.log('デモデータを作成しました。通常の起動コマンドで閲覧できます。');
