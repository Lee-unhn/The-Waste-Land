// full-run bot: kites enemies, collects gems, avoids hazards, picks level-up cards with a sensible priority
const {chromium}=require('playwright');
const [cls=0,diff=1,seeds=1]=process.argv.slice(2).map(Number);
(async()=>{
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:720}});
 const errs=[];p.on('pageerror',e=>errs.push(String(e.stack||e)));
 await p.goto('file://'+process.cwd()+'/game.html');await p.waitForTimeout(300);
 for(let s=0;s<seeds;s++){
 const r=await p.evaluate(([cls,diff])=>{
  const t=__t;t.setDI(diff);t.startGame(t.CLASSES[cls]);
  const log=[];let hurt=0,lastHp=t.P.hp,frame=0;
  const bad=new Set([t.T.LAVA,t.T.POISON]);
  const danger=(x,y)=>{const tt=t.tileUnder(x,y);return t.TP[tt].solid||bad.has(tt)};
  function steer(){
    const P=t.P;let fx=0,fy=0;
    for(const e of t.en){const dx=P.x-e.x,dy=P.y-e.y,d2=dx*dx+dy*dy;if(d2<90*90){const w=(e.d.boss?3:1)/Math.max(d2,16);fx+=dx*w;fy+=dy*w}}
    let fl=Math.hypot(fx,fy);if(fl>0){fx/=fl;fy/=fl}
    let best=null,bd=1e9;for(const g of t.gems){const d=Math.hypot(g.x-P.x,g.y-P.y);if(d<bd){bd=d;best=g}}
    if(best&&bd<120){fx+=(best.x-P.x)/bd*.45;fy+=(best.y-P.y)/bd*.45}
    const od=Math.hypot(P.x,P.y);if(od>300){fx-=P.x/od*.3;fy-=P.y/od*.3}
    // choose among 8 directions the one closest to desired that isn't hazardous
    let ba=null,bs=-9;for(let k=0;k<8;k++){const a=k*Math.PI/4,cx=Math.cos(a),cy=Math.sin(a);if(danger(P.x+cx*10,P.y+cy*10))continue;const sc=cx*fx+cy*fy;if(sc>bs){bs=sc;ba=[cx,cy]}}
    for(const k of ['KeyA','KeyD','KeyW','KeyS'])t.keys[k]=0;
    if(ba&&(fl>0||best)){if(ba[0]<-.3)t.keys.KeyA=1;if(ba[0]>.3)t.keys.KeyD=1;if(ba[1]<-.3)t.keys.KeyW=1;if(ba[1]>.3)t.keys.KeyS=1}
  }
  function pick(){const o=t.opts;let bi=0,bs=-1;o.forEach((x,i)=>{const s=x.t==='w'&&x.id===t.CLASSES[cls].w?20:x.t==='f'?10:x.t==='w'&&!x.nw?5:x.t==='w'?3:x.t==='p'?(['power','haste','area','vigor'].includes(x.id)?2.5:1.5):0;if(s>bs){bs=s;bi=i}});t.choose(bi)}
  const evo=[],dl=[];
  while(frame<60*60*30){
    if(t.st==='level'){pick();for(const id in t.P.weps)if(id.length&&!['fireball','ice','quake','bolt','tide','meteor'].includes(id)&&!evo.includes(id))evo.push(id+'@'+(t.SI+1)+':'+Math.round(t.time));continue}
    if(t.st==='clear'){log.push({ev:'clear',stage:t.SI+1,lvl:t.P.lvl});t.nextStage();continue}
    if(t.st!=='play')break;
    steer();t.update(1/60);frame++;if(frame%3===0)t.render();
    if(t.P.hp<lastHp){hurt+=lastHp-t.P.hp;const tile=t.TP[t.tileUnder(t.P.x,t.P.y)].n;const near=t.en.filter(e=>Math.hypot(e.x-t.P.x,e.y-t.P.y)<e.r+6).map(e=>e.d.name);dl.push([t.time,lastHp-t.P.hp,near.length?near.join('+'):'tile:'+tile])}lastHp=t.P.hp;
    if(frame%(60*30)===0){log.push({s:t.SI+1,t:Math.round(t.time),hp:Math.round(t.P.hp)+'/'+t.P.maxhp,lv:t.P.lvl,en:t.en.length,hurt30:Math.round(hurt),w:Object.entries(t.P.weps).map(([k,v])=>k+v.lv).join(',')});hurt=0}
  }
  const lt=t.time;const agg={};for(const [tt,a,k] of dl)if(tt>lt-8)agg[k]=Math.round((agg[k]||0)+a);
  return {deathSrc:agg,result:t.st,stage:t.SI+1,time:Math.round(t.time),lvl:t.P.lvl,kills:t.kills,disc:t.disc,evo:[...new Set(evo)],log};
 },[cls,diff]);
 console.log(JSON.stringify(r));
 }
 if(errs.length)console.log('ERR',errs.slice(0,3));
 await b.close();
})();
