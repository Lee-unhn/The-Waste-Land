// Captures README screenshots into ../docs/screenshots. Run `bash make.sh` first.
const {chromium}=require('playwright');
const path=require('path');
const OUT=path.join(__dirname,'..','docs','screenshots');
require('fs').mkdirSync(OUT,{recursive:true});
(async()=>{
  const b=await chromium.launch();
  const p=await b.newPage({viewport:{width:1280,height:720}});
  const errs=[];p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file://'+path.join(__dirname,'game.html'));
  await p.waitForTimeout(2500);
  await p.screenshot({path:path.join(OUT,'title.png')});

  // play a stage with a scripted build; the bot circles so the terrain gets churned up
  async function play(cls,stage,weps,pas,secs,shot){
    await p.evaluate(([cls,stage,weps,pas,secs])=>{
      const t=__t;t.setDI(1);t.startGame(t.CLASSES[cls]);if(stage)t.go(stage);
      const P=t.P;P.weps={};for(const [id,lv] of weps)P.weps[id]={lv,t:.2,a:0};P.pas=pas;P.lvl=6+stage*7;
      t.setTime(secs*.5);
      for(let f=0;f<secs*60;f++){
        if(t.st==='level'){t.choose(0);continue}
        P.hp=P.maxhp*.72;const a=f/170;
        for(const k of ['KeyA','KeyD','KeyW','KeyS'])t.keys[k]=0;
        if(Math.cos(a)>.3)t.keys.KeyD=1;if(Math.cos(a)<-.3)t.keys.KeyA=1;if(Math.sin(a)>.3)t.keys.KeyS=1;if(Math.sin(a)<-.3)t.keys.KeyW=1;
        t.update(1/60);if(f%3===0)t.render();
      }
      for(const k of ['KeyA','KeyD','KeyW','KeyS'])t.keys[k]=0;
    },[cls,stage,weps,pas,secs]);
    await p.waitForTimeout(350);
    await p.screenshot({path:path.join(OUT,shot)});
  }
  await play(0,0,[['fireball',6],['bolt',3]],{area:2},45,'stage1-plains.png');
  await play(2,1,[['quake',8],['meteor',5]],{power:2},40,'stage2-volcano.png');
  await play(4,2,[['blizzard',5],['bolt',4]],{area:3,haste:2},40,'stage3-frost.png');
  await play(3,3,[['thor',5],['magma',5]],{power:4},35,'stage4-abyss.png');

  // level-up screen offering an evolution
  await p.evaluate(()=>{const t=__t;t.startGame(t.CLASSES[0]);const P=t.P;P.weps.fireball.lv=8;P.pas.area=1;P.lvl=11;
    for(let f=0;f<60*20;f++){P.hp=P.maxhp;t.update(1/60);if(f%3===0)t.render();if(t.st==='level')t.choose(0)}
    t.addLv(1);t.openLevel()});
  await p.waitForTimeout(400);await p.screenshot({path:path.join(OUT,'levelup-evolution.png')});

  // codex: formulas tab while in a run
  await p.evaluate(()=>{const t=__t;t.choose(1);t.P.weps.ice={lv:5,t:1,a:0};t.pause();t.setTab('form');t.openCodex('scrPause')});
  await p.waitForTimeout(300);await p.screenshot({path:path.join(OUT,'codex-formulas.png')});
  await p.evaluate(()=>{const t=__t;t.setTab('tile');t.renderCodex()});
  await p.waitForTimeout(300);await p.screenshot({path:path.join(OUT,'codex-terrain.png')});

  // stage clear: play a while with a mid-game build, then jump to the end of the stage
  await p.evaluate(()=>{const t=__t;t.setDI(1);t.startGame(t.CLASSES[1]);const P=t.P;P.weps={ice:{lv:8,t:.2,a:0},tide:{lv:5,t:.2,a:0}};P.pas={haste:2,area:1};
    t.setTime(230);let f=0;
    while(t.st==='play'||t.st==='level'){if(t.st==='level'){t.choose(0);continue}P.hp=Math.max(P.hp,60);const a=f/170;
      for(const k of ['KeyA','KeyD','KeyW','KeyS'])t.keys[k]=0;if(Math.cos(a)>.3)t.keys.KeyD=1;if(Math.cos(a)<-.3)t.keys.KeyA=1;if(Math.sin(a)>.3)t.keys.KeyS=1;if(Math.sin(a)<-.3)t.keys.KeyW=1;
      t.update(1/60);f++;if(f%3===0)t.render()}
    for(const k of ['KeyA','KeyD','KeyW','KeyS'])t.keys[k]=0});
  await p.waitForTimeout(600);await p.screenshot({path:path.join(OUT,'stage-clear.png')});

  // phone portrait
  await p.setViewportSize({width:390,height:844});
  await play(1,2,[['ice',7],['tide',4]],{haste:2},40,'mobile.png');
  console.log('errors',errs);await b.close();
})();
