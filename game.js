(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, T = 32, COLS = 28, ROWS = 18;
  const $ = id => document.getElementById(id);
  const keysDown = new Set();
  const pointer = { x: W / 2, y: H / 2, down: false, seen: false };
  const arrows = ['←','↑','↓','→'];
  const dirs = [[-1,0],[0,-1],[0,1],[1,0]];
  const floors = [
    {name:'CARGO DECK', subtitle:'MANIFEST: 87 / 87', keys:[[5,3],[22,7],[9,14]], spawn:[2,2], goal:[26,16], enemies:[[8,2,'stalker'],[16,5,'security'],[23,12,'stalker'],[5,10,'worker']]},
    {name:'MEDICAL WING', subtitle:'LIFE SUPPORT: OFFLINE', keys:[[4,13],[18,3],[23,14]], spawn:[2,2], goal:[26,16], enemies:[[8,3,'medic'],[18,9,'security'],[7,14,'stalker'],[23,5,'medic']]},
    {name:'REACTOR / BRIDGE', subtitle:'CORE TEMP: 1,422°C', keys:[[5,13],[21,3],[10,9]], spawn:[2,2], goal:[26,16], enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'worker']], boss:[23,8]}
  ];
  const hostTypes = {
    wraith:{name:'WRAITH',type:'DISCORPOREAL ENTITY',icon:'◈',note:'Phase through hostile signals. No weapon — stay unseen.',speed:148,energy:100,drain:0,damage:0,color:'#c9f475',weapon:false},
    worker:{name:'DECKHAND-04',type:'INDUSTRIAL AUTOMATON',icon:'▣',note:'Slow and durable. A heavy rivet driver stuns at close range.',speed:125,energy:100,drain:1.75,damage:27,color:'#edb655',weapon:true},
    security:{name:'SENTRY K-17',type:'SECURITY SYNTH',icon:'⊕',note:'Fast target lock. Pulse rifle hits hard, but drains quickly.',speed:160,energy:100,drain:3.3,damage:20,color:'#62d2c7',weapon:true},
    stalker:{name:'STALKER',type:'XENOMORPH / CLASS UNKNOWN',icon:'⌁',note:'Fast, vicious, and built for the dark. Claws tear through armor.',speed:176,energy:100,drain:2.5,damage:32,color:'#d679c7',weapon:true},
    medic:{name:'MED-TECH 9',type:'AUTONOMOUS MEDICAL UNIT',icon:'✚',note:'A steady host with a restorative pulse. Short-range defense only.',speed:138,energy:100,drain:2.1,damage:15,color:'#88d783',weapon:true}
  };
  let game = {started:false,over:false,won:false,floor:0,grid:[],player:null,enemies:[],bullets:[],items:[],keys:0,medkits:1,health:100,elapsed:0,last:0,shots:0,noise:0,goal:null,boss:null,hack:null,host:'wraith',hostEnergy:100,invuln:0,toastTimer:0,spawnTimer:0};
  let audioCtx = null, musicTimer = null, soundOn = true, lastTone = 0;

  function connectTiles(g,start,end){
    const total=COLS*ROWS,dist=Array(total).fill(Infinity),prev=Array(total).fill(-1),visited=Array(total).fill(false),from=start[1]*COLS+start[0],to=end[1]*COLS+end[0];dist[from]=0;
    for(let step=0;step<total;step++){
      let at=-1,best=Infinity;for(let i=0;i<total;i++)if(!visited[i]&&dist[i]<best){best=dist[i];at=i}
      if(at<0||at===to)break;visited[at]=true;const x=at%COLS,y=Math.floor(at/COLS);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<=0||ny<=0||nx>=COLS-1||ny>=ROWS-1)continue;const next=ny*COLS+nx,cost=1+(g[ny][nx]===1?7:0);if(!visited[next]&&best+cost<dist[next]){dist[next]=best+cost;prev[next]=at}}
    }
    for(let at=to;at!==-1;at=prev[at]){g[Math.floor(at/COLS)][at%COLS]=0;if(at===from)break}
  }
  function makeMap(){
    const g=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++) if(x===0||y===0||x===COLS-1||y===ROWS-1)g[y][x]=1;
    // Broken bulkheads create connected, maze-like rooms. The gaps are intentional routes.
    const horizontal=[{y:4,gaps:[4,13,22]},{y:8,gaps:[8,17,25]},{y:12,gaps:[3,12,21]},{y:15,gaps:[7,18,24]}];
    horizontal.forEach(({y,gaps})=>{for(let x=1;x<COLS-1;x++)if(!gaps.includes(x))g[y][x]=1;});
    const vertical=[{x:7,gaps:[2,6,10,14]},{x:14,gaps:[3,7,11,15]},{x:21,gaps:[2,5,9,13,16]}];
    vertical.forEach(({x,gaps})=>{for(let y=1;y<ROWS-1;y++)if(!gaps.includes(y)&&![4,8,12,15].includes(y))g[y][x]=1;});
    // Short partitions and dead-end alcoves add navigational texture.
    [[3,6,2],[4,10,3],[10,2,2],[10,6,2],[11,9,2],[18,2,2],[18,10,2],[24,10,2],[3,15,2],[14,13,2],[23,15,2]].forEach(([x,y,len])=>{for(let i=0;i<len;i++)if(g[y][x+i]===0)g[y][x+i]=1;});
    // Open authored cells, then carve the shortest low-wall-cost links so no objective is sealed off.
    const f=floors[game.floor],meds=game.floor===0?[[12,10]]:game.floor===1?[[12,5],[4,9]]:[[18,13]],batteries=game.floor===0?[[18,14],[3,7]]:[[4,5],[20,12]];
    const anchors=[f.spawn,f.goal,...f.keys,...f.enemies.map(e=>e.slice(0,2)),f.boss,...meds,...batteries].filter(Boolean);
    anchors.forEach(([x,y])=>{g[y][x]=0;if(g[y][x+1]===1)g[y][x+1]=0;});
    anchors.slice(1).forEach(point=>connectTiles(g,f.spawn,point));
    return g;
  }
  function center(tx,ty){return {x:tx*T+T/2,y:ty*T+T/2}}
  function setupFloor(index){
    game.floor=index; const f=floors[index];game.grid=makeMap();game.player={...center(...f.spawn),vx:0,vy:0,faceX:1,faceY:0,r:9};game.goal={...center(...f.goal)};
    game.enemies=f.enemies.map(([x,y,type],i)=>({x:x*T+16,y:y*T+16,type,hp:type==='security'?70:type==='stalker'?55:65,maxHp:type==='security'?70:type==='stalker'?55:65,r:type==='stalker'?10:11,angle:Math.random()*6.28,alert:false,shot:1+Math.random()*2,hit:0,id:`${index}-${i}`}));
    game.boss=f.boss?{...center(...f.boss),hp:380,maxHp:380,r:23,angle:0,shot:1.5,hit:0}:null;
    game.items=f.keys.map(([x,y],i)=>({x:x*T+16,y:y*T+16,type:'key',taken:false,id:i}));
    const meds=index===0?[[12,10]]:index===1?[[12,5],[4,9]]:[[18,13]];
    meds.forEach(([x,y])=>game.items.push({x:x*T+16,y:y*T+16,type:'med',taken:false}));
    const batteries=index===0?[[18,14],[3,7]]:[[4,5],[20,12]]; batteries.forEach(([x,y])=>game.items.push({x:x*T+16,y:y*T+16,type:'battery',taken:false}));
    updateMap(); updateFloorUI();
  }
  function updateFloorUI(){
    $('floorName').innerHTML=`${floors[game.floor].name} <span>0${game.floor+1}</span>`;$('mapFloor').textContent=`0${game.floor+1}`;$('deckCounter').textContent=`0${game.floor+1} / 03`;
    document.querySelectorAll('.progress-dots i').forEach((el,i)=>el.classList.toggle('active',i<=game.floor));
    $('objectiveTitle').textContent=game.floor===2?'DESTROY THE CORE':'FIND 3 ACCESS KEYS';$('objectiveText').textContent=game.floor===2?"Break the core. The lift won't save you.":'Search the deck. Reach the sealed lift.';
    updateMap();
  }
  function updateMap(){
    const el=$('minimap');el.innerHTML='';const scaleX=el.clientWidth/W,scaleY=el.clientHeight/H;
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(game.grid[y]?.[x]){const n=document.createElement('i');n.className='mini-wall';n.style.cssText=`left:${x*T*scaleX}px;top:${y*T*scaleY}px;width:${T*scaleX}px;height:${T*scaleY}px`;el.appendChild(n)}
    const add=(cls,x,y)=>{const n=document.createElement('i');n.className=cls;n.style.cssText=`left:${x*scaleX-2}px;top:${y*scaleY-2}px`;el.appendChild(n)};
    game.items?.filter(a=>!a.taken&&a.type==='key').forEach(a=>add('mini-goal',a.x,a.y));game.enemies?.forEach(a=>add('mini-point',a.x,a.y));if(game.boss)add('mini-point',game.boss.x,game.boss.y);if(game.goal)add('mini-goal',game.goal.x,game.goal.y);if(game.player)add('mini-player',game.player.x,game.player.y);
  }
  function updateUI(){
    const host=hostTypes[game.host];$('hostName').textContent=host.name;$('hostType').textContent=host.type;$('hostIcon').textContent=host.icon;$('hostNote').textContent=host.note;
    $('healthText').textContent=`${Math.max(0,Math.ceil(game.health))}%`;$('healthBar').style.width=`${Math.max(0,game.health)}%`;
    $('energyText').textContent=`${Math.max(0,Math.ceil(game.hostEnergy))}%`;$('energyBar').style.width=`${Math.max(0,game.hostEnergy)}%`;
    $('keysCount').textContent=`${game.keys} / 3`;$('medCount').textContent=game.medkits;$('ammoCount').textContent='∞';
    $('clock').textContent=`${String(Math.floor(game.elapsed/60)).padStart(2,'0')}:${String(Math.floor(game.elapsed%60)).padStart(2,'0')}`;
    if(game.floor===2&&game.boss){$('objectiveTitle').textContent='DESTROY THE CORE';$('objectiveText').textContent=`CORE INTEGRITY: ${Math.max(0,Math.ceil(game.boss.hp/game.boss.maxHp*100))}%`;}
    if(game.host!=='wraith'&&game.hostEnergy<30){$('energyBar').style.background='#ed715d';$('hostNote').style.color='#e68b78'}else{$('energyBar').style.background='';$('hostNote').style.color=''}
  }
  function clearLine(x1,y1,x2,y2){let steps=Math.ceil(Math.hypot(x2-x1,y2-y1)/10);for(let i=1;i<steps;i++){let x=x1+(x2-x1)*i/steps,y=y1+(y2-y1)*i/steps;if(solid(x,y))return false}return true}
  function solid(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/T);return !game.grid[ty]||game.grid[ty][tx]!==0}
  function blocked(x,y,r){return solid(x-r,y-r)||solid(x+r,y-r)||solid(x-r,y+r)||solid(x+r,y+r)}
  function moveEntity(obj,dx,dy,r){if(!blocked(obj.x+dx,obj.y,r))obj.x+=dx;if(!blocked(obj.x,obj.y+dy,r))obj.y+=dy}
  function notify(message){$('statusText').textContent=message;$('toast').textContent=message;$('toast').classList.add('show');game.toastTimer=2;log(message)}
  function log(message){const wrap=$('logLines');const p=document.createElement('p');p.innerHTML=`<time>${$('clock').textContent}</time> <span>—</span> ${message}`;wrap.prepend(p);while(wrap.children.length>5)wrap.lastElementChild.remove()}
  function tone(freq,duration=.08,type='sine',volume=.025){if(!soundOn)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+duration);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+duration)}catch(_){}}
  function music(){if(!soundOn||musicTimer)return;let step=0;const notes=[55,0,65.4,0,73.4,0,58.3,0,49,0,65.4,0,55,0,82.4,0];musicTimer=setInterval(()=>{if(!game.started||game.over)return;const n=notes[step++%notes.length];if(n)tone(n,.28,'triangle',game.boss?.hp<200?.018:.009)},360)}
  function stopMusic(){clearInterval(musicTimer);musicTimer=null}
  function start(){if(game.started&&!game.over)return;game={started:true,over:false,won:false,floor:0,grid:[],player:null,enemies:[],bullets:[],items:[],keys:0,medkits:1,health:100,elapsed:0,last:performance.now(),shots:0,noise:0,goal:null,boss:null,hack:null,host:'wraith',hostEnergy:100,invuln:0,toastTimer:0,spawnTimer:0};$('introOverlay').classList.add('hidden');$('endOverlay').classList.add('hidden');$('hackOverlay').classList.add('hidden');$('logLines').innerHTML='<p><time>02:14</time> <span>—</span> Signal detected.</p><p><time>02:15</time> <span>—</span> Crew channel silent.</p><p><time>02:16</time> <span>—</span> Something moved.</p>';setupFloor(0);notify('Insertion complete. Find the access keys.');music();requestAnimationFrame(loop)}
  function endGame(won,reason){if(game.over)return;game.over=true;game.won=won;stopMusic();$('endOverlay').classList.remove('hidden');$('endTag').innerHTML=`<i></i> ${won?'VESPER-9 / SIGNAL RESTORED':'SIGNAL LOST / HOST FAILURE'}`;$('endTitle').innerHTML=won?'CHANNEL<br><span>RESTORED</span>':reason==='burnout'?'HOST<br><span>BURNOUT</span>':'HOST<br><span>COLLAPSED</span>';$('endCopy').textContent=won?'The core is quiet. Something out there heard you.':reason==='burnout'?'Your host burned out. Your signal is trapped in the dark.':'Your borrowed body gave out. The Vesper keeps what it takes.';$('restartButton').textContent=won?'PLAY AGAIN ↻':'RESTART DESCENT ↻';}
  function openHack(enemy){if(game.host==='wraith'&&game.hack)return;const seq=Array.from({length:4},()=>Math.floor(Math.random()*4));game.hack={enemy,seq,at:0};$('pulseSequence').innerHTML=seq.map((n,i)=>`<i class="${i===0?'active':''}">${arrows[n]}</i>`).join('');$('hackPrompt').textContent=`Override ${hostTypes[enemy.type].name}. Match the pulse sequence.`;$('hackOverlay').classList.remove('hidden');tone(330,.12,'square',.025);}
  function pulseInput(value){if(!game.hack)return;const h=game.hack,items=[...$('pulseSequence').children];if(value===h.seq[h.at]){items[h.at].className='done';h.at++;tone(520+h.at*80,.09,'sine',.03);if(h.at===h.seq.length){const e=h.enemy;game.host=e.type;game.hostEnergy=hostTypes[e.type].energy;game.player.x=e.x;game.player.y=e.y;game.enemies=game.enemies.filter(a=>a!==e);game.hack=null;$('hackOverlay').classList.add('hidden');notify(`${hostTypes[e.type].name} linked. Move before it decays.`);updateUI();updateMap();return}if(items[h.at])items[h.at].className='active'}else{game.hack=null;$('hackOverlay').classList.add('hidden');game.health-=18;game.hostEnergy=Math.max(0,game.hostEnergy-10);notify('Link rejected. Neural feedback — move!');tone(90,.25,'sawtooth',.04);if(game.health<=0)endGame(false,'health');}}
  function attemptPossess(){if(!game.started||game.over||game.hack)return;const near=game.enemies.filter(e=>Math.hypot(e.x-game.player.x,e.y-game.player.y)<64).sort((a,b)=>Math.hypot(a.x-game.player.x,a.y-game.player.y)-Math.hypot(b.x-game.player.x,b.y-game.player.y))[0];if(near){openHack(near);return}if(game.host!=='wraith'&&game.hostEnergy>12){const old=game.host;game.host='wraith';game.hostEnergy=100;notify(`Ejected from ${hostTypes[old].name}. Host left behind.`);tone(180,.18,'triangle',.03)}else notify('No host in range. Approach a hostile signal to link.');}
  function fire(){if(!game.started||game.over||game.hack)return;const h=hostTypes[game.host];if(!h.weapon)return;let dx=game.player.faceX,dy=game.player.faceY;if(pointer.seen){dx=pointer.x-game.player.x;dy=pointer.y-game.player.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;game.player.faceX=dx;game.player.faceY=dy}const speed=game.host==='stalker'?320:450;game.bullets.push({x:game.player.x+dx*14,y:game.player.y+dy*14,vx:dx*speed,vy:dy*speed,life:.9,damage:h.damage,r:game.host==='stalker'?5:3,color:h.color,hostile:false});game.shots++;game.noise=1;tone(game.host==='stalker'?105:240,.08,'sawtooth',.018)}
  function useMed(){if(game.medkits<1||game.health>=100)return;game.medkits--;game.health=Math.min(100,game.health+45);notify('Medkit administered. Keep moving.');tone(660,.1,'sine',.03);updateUI()}
  function damage(amount){if(game.invuln>0)return;game.health-=amount;game.invuln=.7;tone(75,.2,'sawtooth',.05);canvas.parentElement.classList.remove('shake');void canvas.parentElement.offsetWidth;canvas.parentElement.classList.add('shake');if(game.health<=0)endGame(false,'health')}
  function spawnEnemyBullet(e,target,boss=false){const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy)||1;game.bullets.push({x:e.x,y:e.y,vx:dx/d*(boss?190:165),vy:dy/d*(boss?190:165),life:2,damage:boss?17:10,r:boss?5:3,color:boss?'#ff775f':'#e56b61',hostile:true});tone(boss?67:115,.12,'square',.015)}
  function update(dt){if(!game.started||game.over)return;game.elapsed+=dt;game.invuln=Math.max(0,game.invuln-dt);game.noise=Math.max(0,game.noise-dt);game.toastTimer-=dt;if(game.toastTimer<=0)$('toast').classList.remove('show');
    if(game.hack){updateUI();return}
    const p=game.player;let x=(keysDown.has('d')||keysDown.has('arrowright')?1:0)-(keysDown.has('a')||keysDown.has('arrowleft')?1:0),y=(keysDown.has('s')||keysDown.has('arrowdown')?1:0)-(keysDown.has('w')||keysDown.has('arrowup')?1:0);if(Math.hypot(x,y)>0){const d=Math.hypot(x,y);x/=d;y/=d;p.faceX=x;p.faceY=y;const speed=hostTypes[game.host].speed;moveEntity(p,x*speed*dt,y*speed*dt,p.r)}
    if(game.host!=='wraith'){game.hostEnergy-=hostTypes[game.host].drain*dt;if(game.hostEnergy<=0){game.hostEnergy=0;endGame(false,'burnout');return}}
    game.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(solid(b.x,b.y))b.life=0;if(b.hostile){if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+b.r){b.life=0;damage(b.damage)}}else{for(const e of game.enemies){if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){e.hp-=b.damage;e.hit=.12;b.life=0;game.noise=1;if(e.hp<=0){notify('Hostile signal terminated.');tone(65,.3,'sawtooth',.04)}break}}if(game.boss&&Math.hypot(b.x-game.boss.x,b.y-game.boss.y)<game.boss.r+b.r){game.boss.hp-=b.damage;game.boss.hit=.16;b.life=0;if(game.boss.hp<=0){game.boss=null;notify('CORE DESTROYED. The bridge is yours.');tone(50,.8,'sawtooth',.05)}}}});game.bullets=game.bullets.filter(b=>b.life>0);
    for(const e of game.enemies){e.hit=Math.max(0,e.hit-dt);const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<205||game.noise>0)e.alert=true;if(e.alert&&d>18){const dx=(p.x-e.x)/d,dy=(p.y-e.y)/d;moveEntity(e,dx*(e.type==='stalker'?52:35)*dt,dy*(e.type==='stalker'?52:35)*dt,e.r)}if(d<e.r+p.r+3)damage(14*dt);e.shot-=dt;if(e.alert&&d<270&&e.shot<=0&&clearLine(e.x,e.y,p.x,p.y)){spawnEnemyBullet(e,p);e.shot=e.type==='security'?1.5:2.4+Math.random()}}
    if(game.boss){const b=game.boss;b.hit=Math.max(0,b.hit-dt);b.angle+=dt*.7;const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<300)b.shot-=dt;if(b.shot<=0&&d<350){spawnEnemyBullet(b,p,true);b.shot=1.05}if(d<44)damage(21*dt)}
    for(const a of game.items){if(a.taken)continue;if(Math.hypot(p.x-a.x,p.y-a.y)<19){a.taken=true;if(a.type==='key'){game.keys++;notify(`Access key acquired: ${game.keys} / 3`);tone(760,.16,'sine',.04);if(game.keys>=3)notify('All keys recovered. The lift is unlocked.')}else if(a.type==='med'){game.medkits++;notify('Medkit recovered. Press H to use.');tone(600,.1,'sine',.03)}else{game.hostEnergy=Math.min(100,game.hostEnergy+28);game.health=Math.min(100,game.health+12);notify('Charge cell recovered. Host stabilized.');tone(470,.12,'sine',.03)}updateMap()}}
    if(game.floor<2&&Math.hypot(p.x-game.goal.x,p.y-game.goal.y)<25){if(game.keys>=3){setupFloor(game.floor+1);game.keys=0;game.hostEnergy=Math.min(100,game.hostEnergy+35);game.health=Math.min(100,game.health+20);notify(`Deck ${String(game.floor+1).padStart(2,'0')}: ${floors[game.floor].name}.`);log(`Entered ${floors[game.floor].name.toLowerCase()}.`)}else if(game.elapsed%2<dt)notify(`Lift sealed. ${3-game.keys} access key${game.keys===2?'':'s'} remain.`)}
    if(game.floor===2&&!game.boss&&Math.hypot(p.x-game.goal.x,p.y-game.goal.y)<27)endGame(true,'win');
    updateUI();if(Math.floor(game.elapsed*4)!==Math.floor((game.elapsed-dt)*4))updateMap();
  }
  function draw(){ctx.clearRect(0,0,W,H);const g=game.grid;if(!g.length){drawBackdrop();return}
    ctx.fillStyle='#0a1115';ctx.fillRect(0,0,W,H);
    // floor grid and worn plates
    for(let y=1;y<ROWS-1;y++)for(let x=1;x<COLS-1;x++){const px=x*T,py=y*T;ctx.fillStyle=((x+y)%2)?'#10191b':'#111a1c';ctx.fillRect(px,py,T,T);ctx.strokeStyle='#1a2828';ctx.lineWidth=.6;ctx.strokeRect(px+.5,py+.5,T-1,T-1);if((x*13+y*7)%17===0){ctx.fillStyle='#25302a';ctx.fillRect(px+6,py+7,2,2);ctx.fillRect(px+T-8,py+T-9,2,2)}}
    // bulkheads
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)if(g[y][x]){const px=x*T,py=y*T;ctx.fillStyle='#273335';ctx.fillRect(px,py,T,T);ctx.fillStyle='#39494a';ctx.fillRect(px,py,T,3);ctx.fillStyle='#172226';ctx.fillRect(px,py+T-4,T,4);ctx.strokeStyle='#1c292c';ctx.strokeRect(px+.5,py+.5,T-1,T-1);ctx.fillStyle='#56635b';ctx.fillRect(px+4,py+5,2,2);ctx.fillRect(px+T-7,py+5,2,2);ctx.fillStyle='#0b1318';ctx.fillRect(px+8,py+12,T-16,1)}
    drawFixtures();for(const a of game.items)if(!a.taken)drawItem(a);drawGoal();for(const e of game.enemies)drawEnemy(e);if(game.boss)drawBoss(game.boss);drawPlayer();for(const b of game.bullets)drawBullet(b);drawLighting();drawHudInWorld();
  }
  function drawBackdrop(){ctx.fillStyle='#091116';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#182326';for(let x=0;x<W;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}for(let y=0;y<H;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}}
  function drawFixtures(){for(let y=2;y<ROWS-2;y+=4){for(const x of [3,11,19,25]){if(game.grid[y]?.[x]!==0)continue;const px=x*T,py=y*T;ctx.fillStyle='#172321';ctx.fillRect(px+3,py+4,26,24);ctx.strokeStyle='#354742';ctx.strokeRect(px+3.5,py+4.5,25,23);ctx.fillStyle='#394d3d';ctx.fillRect(px+7,py+8,7,2);ctx.fillStyle='#b9cc64';ctx.globalAlpha=.5;ctx.fillRect(px+7,py+14,4,2);ctx.globalAlpha=1}}}
  function drawItem(a){const bob=Math.sin(game.elapsed*3+a.x)*2;ctx.save();ctx.translate(a.x,a.y+bob);ctx.shadowBlur=14;if(a.type==='key'){ctx.shadowColor='#eed370';ctx.fillStyle='#e6d17b';ctx.rotate(Math.PI/4);ctx.fillRect(-6,-6,12,12);ctx.fillStyle='#574d28';ctx.fillRect(-3,-3,6,6)}else if(a.type==='med'){ctx.shadowColor='#ed776a';ctx.fillStyle='#e76a5e';ctx.fillRect(-8,-7,16,14);ctx.fillStyle='#ffe2c9';ctx.fillRect(-2,-5,4,10);ctx.fillRect(-5,-2,10,4)}else{ctx.shadowColor='#65d8cc';ctx.strokeStyle='#74ddd2';ctx.lineWidth=2;ctx.strokeRect(-7,-8,14,16);ctx.fillStyle='#6be1d2';ctx.fillRect(-3,-4,6,8)}ctx.restore()}
  function drawGoal(){if(!game.goal)return;const g=game.goal,open=game.keys>=3||game.floor===2&&!game.boss;ctx.save();ctx.translate(g.x,g.y);ctx.strokeStyle=open?'#92dbb0':'#b28a5b';ctx.shadowColor=open?'#65d8ab':'#b17f4b';ctx.shadowBlur=12;ctx.lineWidth=2;ctx.strokeRect(-13,-15,26,30);ctx.fillStyle='#111b1a';ctx.fillRect(-9,-12,18,24);ctx.fillStyle=open?'#6fd7a6':'#d7a464';ctx.fillRect(-2,-7,4,14);ctx.fillStyle='#718174';ctx.fillRect(-18,-16,4,32);ctx.fillRect(14,-16,4,32);ctx.restore()}
  function drawEnemy(e){const t=hostTypes[e.type];ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);ctx.shadowColor=t.color;ctx.shadowBlur=5;ctx.fillStyle=e.hit?'#fff':e.type==='stalker'?'#39253c':e.type==='security'?'#1f4545':e.type==='medic'?'#344d37':'#58432c';ctx.strokeStyle=t.color;ctx.lineWidth=1.5;if(e.type==='stalker'){ctx.beginPath();ctx.moveTo(-11,-9);ctx.lineTo(-2,-13);ctx.lineTo(9,-9);ctx.lineTo(13,-1);ctx.lineTo(9,9);ctx.lineTo(-3,12);ctx.lineTo(-12,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f17cbe';ctx.fillRect(4,-3,5,2)}else{ctx.beginPath();ctx.roundRect(-9,-11,18,22,4);ctx.fill();ctx.stroke();ctx.fillStyle=t.color;ctx.fillRect(1,-5,7,4);ctx.fillStyle='#27302c';ctx.fillRect(-12,3,5,3);ctx.fillRect(7,3,5,3)}ctx.restore();if(e.hp<e.maxHp){ctx.fillStyle='#291e1b';ctx.fillRect(e.x-11,e.y-17,22,2);ctx.fillStyle='#e57861';ctx.fillRect(e.x-11,e.y-17,22*Math.max(0,e.hp/e.maxHp),2)}}
  function drawBoss(b){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.shadowBlur=24;ctx.shadowColor='#f05252';ctx.fillStyle=b.hit?'#ffe9d0':'#451a1e';ctx.strokeStyle='#ef6258';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,r=i%2?18:30;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f48960';ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0c8';ctx.fillRect(-3,-2,6,4);ctx.restore();ctx.fillStyle='#2c1517';ctx.fillRect(b.x-34,b.y-39,68,5);ctx.fillStyle='#ed655b';ctx.fillRect(b.x-33,b.y-38,66*Math.max(0,b.hp/b.maxHp),3)}
  function drawPlayer(){const p=game.player,h=hostTypes[game.host];ctx.save();ctx.translate(p.x,p.y);if(game.invuln>0&&Math.floor(game.invuln*12)%2)ctx.globalAlpha=.45;ctx.shadowColor=h.color;ctx.shadowBlur=game.host==='wraith'?17:8;ctx.rotate(Math.atan2(p.faceY,p.faceX));if(game.host==='wraith'){ctx.fillStyle='#c9f475';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#efffb8';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,12+Math.sin(game.elapsed*5)*2,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#17201a';ctx.fillRect(1,-2,6,4)}else{ctx.fillStyle=h.color;ctx.strokeStyle='#e1eed1';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-8,-10,17,20,4);ctx.fill();ctx.stroke();ctx.fillStyle='#111a17';ctx.fillRect(1,-5,8,5);ctx.fillStyle=h.color;ctx.fillRect(5,-3,10,2);ctx.fillRect(-5,8,4,5);ctx.fillRect(3,8,4,5)}ctx.restore()}
  function drawBullet(b){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawLighting(){ctx.save();ctx.fillStyle='rgba(1,5,8,.78)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='destination-out';const light=(x,y,r,alpha=1)=>{const grad=ctx.createRadialGradient(x,y,5,x,y,r);grad.addColorStop(0,`rgba(0,0,0,${alpha})`);grad.addColorStop(.55,`rgba(0,0,0,${alpha*.65})`);grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};light(game.player.x,game.player.y,game.host==='wraith'?144:122,.98);for(let y=2;y<ROWS-2;y+=4)for(const x of [3,11,19,25])if(game.grid[y]?.[x]===0)light(x*T+16,y*T+16,46,.42);game.items.filter(a=>!a.taken).forEach(a=>light(a.x,a.y,35,.55));if(game.boss)light(game.boss.x,game.boss.y,75,.48);ctx.restore()}
  function drawHudInWorld(){ctx.fillStyle='#8c9a8f';ctx.font='9px "IBM Plex Mono",monospace';ctx.fillText('VESPER-9  //  '+floors[game.floor].subtitle,12,17);if(game.keys<3&&game.floor<2){ctx.fillStyle='#bea76d';ctx.fillText(`ACCESS KEYS  ${game.keys}/3`,W-115,17)}else if(game.boss){ctx.fillStyle='#e16e5e';ctx.fillText('CORE // HOSTILE',W-115,17)}}
  function loop(now){if(!game.started||game.over)return;const dt=Math.min(.04,(now-game.last)/1000||0);game.last=now;update(dt);draw();requestAnimationFrame(loop)}
  function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
  document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keysDown.add(k);if(game.hack){const m={'arrowleft':0,'arrowup':1,'arrowdown':2,'arrowright':3};if(k in m)pulseInput(m[k]);return}if(k==='e')attemptPossess();if(k==='q')attemptPossess();if(k==='h')useMed();if(k===' '){fire();if(game.started&&!game.over)keysDown.add('f')}});
  document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keysDown.delete(k);if(k===' ')keysDown.delete('f')});
  canvas.addEventListener('pointermove',e=>{const pt=pointFromEvent(e);pointer.x=pt.x;pointer.y=pt.y;pointer.seen=true});canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer.down=true;const pt=pointFromEvent(e);pointer.x=pt.x;pointer.y=pt.y;pointer.seen=true;fire()});window.addEventListener('pointerup',()=>pointer.down=false);
  document.querySelectorAll('.hack-inputs button').forEach(b=>b.addEventListener('click',()=>pulseInput(Number(b.dataset.pulse))));
  $('startButton').addEventListener('click',start);$('restartButton').addEventListener('click',start);
  $('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('soundToggle').innerHTML=`♫ <span>SOUND ${soundOn?'ON':'OFF'}</span>`;if(soundOn){music();tone(440,.1)}else stopMusic()});
  document.querySelectorAll('[data-move]').forEach(btn=>{const k={up:'w',down:'s',left:'a',right:'d'}[btn.dataset.move];btn.addEventListener('pointerdown',e=>{e.preventDefault();keysDown.add(k);btn.setPointerCapture(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>btn.addEventListener(ev,()=>keysDown.delete(k)))});
  $('touchSwap').addEventListener('pointerdown',e=>{e.preventDefault();attemptPossess()});$('touchFire').addEventListener('pointerdown',e=>{e.preventDefault();fire()});
  document.querySelectorAll('.hack-inputs button').forEach(btn=>btn.addEventListener('pointerdown',e=>e.preventDefault()));
  setupFloor(0);draw();
})();
