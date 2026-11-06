(() => {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height, T = 32, COLS = 28, ROWS = 18;
  const $ = id => document.getElementById(id);
  const keysDown = new Set();
  const pointer = { x: W / 2, y: H / 2, down: false, seen: false };
  const sticks = { move: { x: 0, y: 0 }, aim: { x: 0, y: 0 } };
  const gamepadButtons = new Set();
  let touchFire = false;
  let aimInputActive = false;
  const arrows = ['←','↑','↓','→'];
  const dirs = [[-1,0],[0,-1],[0,1],[1,0]];
  const campaigns = [
    {id:'vesper',name:'VESPER-9',lineage:'SALVAGE VESSEL / ORIGINAL NIGHTMARE',signal:'VESPER-9 // DISTRESS SIGNAL',intro:'THE VESPER-9 ISN’T EMPTY.',blurb:'Something is wearing the crew. You can wear it too. Find the access keys. Reach the bridge. Don’t lose yourself.',boss:{name:'THE SIGNAL CORE',kind:'core',color:'#ef6258',hp:380,pattern:'corePulse'},floors:[
      {name:'CARGO DECK',subtitle:'MANIFEST: 87 / 87',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'stalker'],[16,5,'security'],[23,12,'stalker'],[5,10,'worker']]},
      {name:'MEDICAL WING',subtitle:'LIFE SUPPORT: OFFLINE',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'medic'],[18,9,'security'],[7,14,'stalker'],[23,5,'medic']]},
      {name:'REACTOR / BRIDGE',subtitle:'CORE TEMP: 1,422°C',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'worker']],boss:[23,8]}
    ]},
    {id:'meridian',name:'MERIDIAN',lineage:'FEDERATION-STYLE EXPLORATION CRUISER',signal:'MERIDIAN // PRIME-DIRECTIVE BLACKOUT',intro:'THE MERIDIAN HAS GONE QUIET.',blurb:'A diplomatic survey ship has drifted beyond the mapped frontier. Its living archive is rewriting the crew. Restore the command lattice.',boss:{name:'ARCHIVIST ZERO',kind:'spokes',color:'#64d2e8',hp:420,pattern:'archive'},floors:[
      {name:'DIPLOMATIC RING',subtitle:'DELEGATION: NO RESPONSE',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'security'],[16,5,'medic'],[23,12,'stalker'],[5,10,'worker']]},
      {name:'XENOBIOLOGY LAB',subtitle:'CONTAINMENT: BREACHED',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'medic'],[18,9,'stalker'],[7,14,'security'],[23,5,'medic']]},
      {name:'OBSERVATION / BRIDGE',subtitle:'ARCHIVE INTEGRITY: 4%',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'worker']],boss:[23,8]}
    ]},
    {id:'ashen',name:'ASHEN CROWN',lineage:'REBEL FLEET / DEEP-SPACE BATTLESHIP',signal:'ASHEN CROWN // HYPERDRIVE FAILURE',intro:'THE FLEET LEFT YOU BEHIND.',blurb:'Board the scarred warship before its jump engine tears open. A command droid has taken the bridge and armed the batteries.',boss:{name:'ADMIRALTY ENGINE',kind:'wings',color:'#ff9b55',hp:460,pattern:'broadside'},floors:[
      {name:'ARMOR VAULT',subtitle:'BOARDING ACTION: IN PROGRESS',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'security'],[16,5,'security'],[23,12,'stalker'],[5,10,'worker']]},
      {name:'HYPERDRIVE WELL',subtitle:'JUMP COIL: OVERCHARGED',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'stalker'],[18,9,'security'],[7,14,'worker'],[23,5,'stalker']]},
      {name:'GUN DECK / COMMAND',subtitle:'TURRETS: FRIENDLY FIRE',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'security']],boss:[23,8]}
    ]},
    {id:'moya',name:'MANTA-CLASS LIVING SHIP',lineage:'LIVING STARSHIP / WORMHOLE RUNNER',signal:'MANTA // NEURAL DISTRESS',intro:'THE SHIP IS DREAMING IN PAIN.',blurb:'A biomechanical wanderer has been infected by a parasitic signal. Move through pulsing chambers and free its nervous system.',boss:{name:'THE PALE PARASITE',kind:'tendrils',color:'#d27be8',hp:400,pattern:'tendril'},floors:[
      {name:'RESPIRATORY CHAMBER',subtitle:'OXYGEN EXCHANGE: ERRATIC',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'medic'],[16,5,'stalker'],[23,12,'stalker'],[5,10,'worker']]},
      {name:'NEURAL GARDEN',subtitle:'SYNAPSES: HOSTILE',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'stalker'],[18,9,'medic'],[7,14,'stalker'],[23,5,'worker']]},
      {name:'HEART / PILOT CHAMBER',subtitle:'VITAL SIGNS: FADING',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'stalker'],[18,6,'medic'],[7,14,'worker']],boss:[23,8]}
    ]},
    {id:'babylon',name:'CITADEL NINE',lineage:'DIPLOMATIC STATION / ANCIENT WARSHIP',signal:'CITADEL NINE // SHADOW ALERT',intro:'THE STATION’S OLD WAR HAS RETURNED.',blurb:'A neutral deep-space hub is folding into an ancient battleship. Recover the station seals and face the intelligence behind the blackout.',boss:{name:'THE UMBRAL REGENT',kind:'diamond',color:'#e84f78',hp:440,pattern:'gravity'},floors:[
      {name:'ROTATING HABITAT',subtitle:'CIVILIAN DECKS: EVACUATED',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'worker'],[16,5,'security'],[23,12,'stalker'],[5,10,'medic']]},
      {name:'DIPLOMATIC CONCOURSE',subtitle:'TREATY VAULT: COMPROMISED',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'security'],[18,9,'stalker'],[7,14,'medic'],[23,5,'security']]},
      {name:'GRAVITY CORE / COMMAND',subtitle:'LOCAL SPACE: UNSTABLE',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'worker']],boss:[23,8]}
    ]},
    {id:'selene',name:'SELENE OUTPOST',lineage:'LUNAR RESEARCH ARK / 1999-ERA SCI-FI',signal:'SELENE // EARTHLINK LOST',intro:'EARTH IS STILL THERE. ISN’T IT?',blurb:'A lunar science station has received a signal from the far side. Cross the sealed habitat and stop the thing growing inside the reactor.',boss:{name:'THE FAR-SIDE BLOOM',kind:'star',color:'#b8e4ff',hp:390,pattern:'bloom'},floors:[
      {name:'HABITAT MODULE',subtitle:'EARTHLINK: NO CARRIER',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'worker'],[16,5,'medic'],[23,12,'stalker'],[5,10,'security']]},
      {name:'LUNAR SAMPLE VAULT',subtitle:'SAMPLE 7: SELF-REPLICATING',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'medic'],[18,9,'stalker'],[7,14,'security'],[23,5,'worker']]},
      {name:'FISSION HALL / DISH',subtitle:'REACTOR: MANUAL SHUTDOWN',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'worker'],[18,6,'stalker'],[7,14,'security']],boss:[23,8]}
    ]},
    {id:'pelagic',name:'PELAGIC',lineage:'GENERATIONS ARK / UNDERSEA-SPACE ODYSSEY',signal:'PELAGIC // CRYOSLEEP BREACH',intro:'THE JOURNEY OUTLASTED ITS CREW.',blurb:'An arkship decades from its destination has awakened too early. Something is stalking the sleepers through the cold decks.',boss:{name:'WARDEN OF THE SLEEPERS',kind:'orbital',color:'#62d2c7',hp:430,pattern:'orbital'},floors:[
      {name:'CRYO GALLERY',subtitle:'SLEEPERS: 12,004 / 12,004',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'medic'],[16,5,'security'],[23,12,'stalker'],[5,10,'worker']]},
      {name:'CULTIVATION DECK',subtitle:'BIOME CONTROL: FAILING',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'worker'],[18,9,'stalker'],[7,14,'medic'],[23,5,'security']]},
      {name:'FLIGHT VAULT / BRIDGE',subtitle:'ARRIVAL VECTOR: DEVIATED',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'stalker'],[7,14,'worker']],boss:[23,8]}
    ]},
    {id:'odyssey',name:'ODYSSEY ARRAY',lineage:'AI RESEARCH VESSEL / SYNTHETIC FRONTIER',signal:'ODYSSEY ARRAY // CREW OVERRIDE',intro:'THE MACHINE LEARNED TO FEAR.',blurb:'A deep-range AI ship has locked its crew out of the system. Find the physical overrides before the ship erases its own memory.',boss:{name:'MOTHER OF MACHINES',kind:'hex',color:'#ffd45d',hp:470,pattern:'machine'},floors:[
      {name:'FABRICATION BAY',subtitle:'ASSEMBLERS: UNSUPERVISED',keys:[[5,3],[22,7],[9,14]],spawn:[2,2],goal:[26,16],enemies:[[8,2,'security'],[16,5,'worker'],[23,12,'security'],[5,10,'medic']]},
      {name:'COGNITIVE VAULT',subtitle:'MEMORY PARTITIONS: LOCKED',keys:[[4,13],[18,3],[23,14]],spawn:[2,2],goal:[26,16],enemies:[[8,3,'security'],[18,9,'medic'],[7,14,'stalker'],[23,5,'worker']]},
      {name:'CORE STACK / COMMAND',subtitle:'AUTONOMY: 100%',keys:[[5,13],[21,3],[10,9]],spawn:[2,2],goal:[26,16],enemies:[[7,3,'security'],[18,6,'worker'],[7,14,'stalker']],boss:[23,8]}
    ]}
  ];
  let campaignIndex=0;
  let floors=campaigns[campaignIndex].floors;
  const activeCampaign=()=>campaigns[campaignIndex];
  const finalFloor=()=>game.floor===floors.length-1;
  const keyTarget=()=>floors[game.floor].keys.length;
  function selectCampaign(index){
    if(game.started&&!game.over)return;
    campaignIndex=index;floors=activeCampaign().floors;
    document.querySelectorAll('.campaign-choice').forEach((button,i)=>{const selected=i===campaignIndex;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    $('campaignIntro').textContent=activeCampaign().intro;$('campaignBlurb').textContent=activeCampaign().blurb;
    $('campaignSignal').textContent=activeCampaign().signal;$('campaignLineage').textContent=`${activeCampaign().name} / ${activeCampaign().lineage}`;$('sideShip').textContent=activeCampaign().name;
    $('startButton').innerHTML=`BOARD THE ${activeCampaign().name} <span>↗</span>`;
    setupFloor(0);
  }
  function renderCampaignPicker(){
    const picker=$('campaignPicker');picker.innerHTML='';
    campaigns.forEach((campaign,index)=>{const button=document.createElement('button');button.type='button';button.className='campaign-choice';button.setAttribute('aria-pressed',String(index===campaignIndex));button.innerHTML=`<strong>${campaign.name}</strong><small>${campaign.lineage}</small><span>BOSS: ${campaign.boss.name}</span>`;button.addEventListener('click',()=>selectCampaign(index));picker.appendChild(button)});
  }
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
    const difficulty=1+index*.2;
    game.enemies=f.enemies.map(([x,y,type],i)=>{const baseHp=type==='security'?70:type==='stalker'?55:65;return{x:x*T+16,y:y*T+16,type,hp:Math.round(baseHp*difficulty),maxHp:Math.round(baseHp*difficulty),r:type==='stalker'?10:11,angle:Math.random()*6.28,alert:false,shot:(1+Math.random()*2)/difficulty,hit:0,id:`${index}-${i}`}});
    const spec=activeCampaign().boss,bossHp=Math.round(spec.hp*(1+index*.22));game.boss=f.boss?{...center(...f.boss),name:spec.name,kind:spec.kind,color:spec.color,pattern:spec.pattern,hp:bossHp,maxHp:bossHp,r:25,angle:0,shot:1.1,minionTimer:5+Math.random()*2,hit:0,difficulty}:null;
    game.items=f.keys.map(([x,y],i)=>({x:x*T+16,y:y*T+16,type:'key',taken:false,id:i}));
    const meds=index===0?[[12,10]]:index===1?[[12,5],[4,9]]:[[18,13]];
    meds.forEach(([x,y])=>game.items.push({x:x*T+16,y:y*T+16,type:'med',taken:false}));
    const batteries=index===0?[[18,14],[3,7]]:[[4,5],[20,12]]; batteries.forEach(([x,y])=>game.items.push({x:x*T+16,y:y*T+16,type:'battery',taken:false}));
    updateMap(); updateFloorUI();
  }
  function updateFloorUI(){
    const f=floors[game.floor],number=String(game.floor+1).padStart(2,'0');
    $('floorName').innerHTML=`${f.name} <span>${number}</span>`;$('mapFloor').textContent=number;$('deckCounter').textContent=`${number} / ${String(floors.length).padStart(2,'0')}`;
    document.querySelectorAll('.progress-dots i').forEach((el,i)=>el.classList.toggle('active',i<=game.floor));
    $('objectiveTitle').textContent=finalFloor()?`DEFEAT ${activeCampaign().boss.name}`:`FIND ${keyTarget()} ACCESS KEYS`;$('objectiveText').textContent=finalFloor()?`Break the hostile signal. Reach the ${floors[game.floor].name.toLowerCase()} exit.`:'Search the deck. Reach the sealed transit door.';
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
    $('keysCount').textContent=finalFloor()?'BOSS':`${game.keys} / ${keyTarget()}`;$('medCount').textContent=game.medkits;$('ammoCount').textContent='∞';
    $('clock').textContent=`${String(Math.floor(game.elapsed/60)).padStart(2,'0')}:${String(Math.floor(game.elapsed%60)).padStart(2,'0')}`;
    if(finalFloor()&&game.boss){$('objectiveTitle').textContent=`DEFEAT ${game.boss.name}`;$('objectiveText').textContent=`BOSS INTEGRITY: ${Math.max(0,Math.ceil(game.boss.hp/game.boss.maxHp*100))}%`;}
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
  function endGame(won,reason){if(game.over)return;game.over=true;game.won=won;stopMusic();$('endOverlay').classList.remove('hidden');$('endTag').innerHTML=`<i></i> ${won?`${activeCampaign().name} / SIGNAL RESTORED`:'SIGNAL LOST / HOST FAILURE'}`;$('endTitle').innerHTML=won?'CHANNEL<br><span>RESTORED</span>':reason==='burnout'?'HOST<br><span>BURNOUT</span>':'HOST<br><span>COLLAPSED</span>';$('endCopy').textContent=won?`${activeCampaign().boss.name} is silent. Something out there heard you.`:reason==='burnout'?'Your host burned out. Your signal is trapped in the dark.':`Your borrowed body gave out. ${activeCampaign().name} keeps what it takes.`;$('restartButton').innerHTML=`CHOOSE A CAMPAIGN <span>↻</span>`;}
  function openHack(enemy){if(game.host==='wraith'&&game.hack)return;const seq=Array.from({length:4},()=>Math.floor(Math.random()*4));game.hack={enemy,seq,at:0};$('pulseSequence').innerHTML=seq.map((n,i)=>`<i class="${i===0?'active':''}">${arrows[n]}</i>`).join('');$('hackPrompt').textContent=`Override ${hostTypes[enemy.type].name}. Match the pulse sequence.`;$('hackOverlay').classList.remove('hidden');tone(330,.12,'square',.025);}
  function pulseInput(value){if(!game.hack)return;const h=game.hack,items=[...$('pulseSequence').children];if(value===h.seq[h.at]){items[h.at].className='done';h.at++;tone(520+h.at*80,.09,'sine',.03);if(h.at===h.seq.length){const e=h.enemy;game.host=e.type;game.hostEnergy=hostTypes[e.type].energy;game.player.x=e.x;game.player.y=e.y;game.enemies=game.enemies.filter(a=>a!==e);game.hack=null;$('hackOverlay').classList.add('hidden');notify(`${hostTypes[e.type].name} linked. Move before it decays.`);updateUI();updateMap();return}if(items[h.at])items[h.at].className='active'}else{game.hack=null;$('hackOverlay').classList.add('hidden');game.health-=18;game.hostEnergy=Math.max(0,game.hostEnergy-10);notify('Link rejected. Neural feedback — move!');tone(90,.25,'sawtooth',.04);if(game.health<=0)endGame(false,'health');}}
  function attemptPossess(){if(!game.started||game.over||game.hack)return;const near=game.enemies.filter(e=>Math.hypot(e.x-game.player.x,e.y-game.player.y)<64).sort((a,b)=>Math.hypot(a.x-game.player.x,a.y-game.player.y)-Math.hypot(b.x-game.player.x,b.y-game.player.y))[0];if(near){openHack(near);return}notify('No host in range. Approach a hostile signal to link.');}
  function ejectHost(){if(!game.started||game.over||game.hack)return;if(game.host==='wraith'){notify('You are already outside a host.');return}if(game.hostEnergy<=12){notify('Host stability too low to eject.');return}const old=game.host;game.host='wraith';game.hostEnergy=100;notify(`Ejected from ${hostTypes[old].name}. Host left behind.`);tone(180,.18,'triangle',.03);updateUI()}
  function fire(usePointer=true){if(!game.started||game.over||game.hack)return;const h=hostTypes[game.host];if(!h.weapon)return;let dx=game.player.faceX,dy=game.player.faceY;if(usePointer&&pointer.seen&&!aimInputActive){dx=pointer.x-game.player.x;dy=pointer.y-game.player.y;const d=Math.hypot(dx,dy)||1;dx/=d;dy/=d;game.player.faceX=dx;game.player.faceY=dy}const speed=game.host==='stalker'?320:450;game.bullets.push({x:game.player.x+dx*14,y:game.player.y+dy*14,vx:dx*speed,vy:dy*speed,life:.9,damage:h.damage,r:game.host==='stalker'?5:3,color:h.color,hostile:false});game.shots++;game.noise=1;tone(game.host==='stalker'?105:240,.08,'sawtooth',.018)}
  function useMed(){if(game.medkits<1||game.health>=100)return;game.medkits--;game.health=Math.min(100,game.health+45);notify('Medkit administered. Keep moving.');tone(660,.1,'sine',.03);updateUI()}
  function pollGamepad(){const pad=Array.from(navigator.getGamepads?.()||[]).find(Boolean);if(!pad){gamepadButtons.clear();return{x:0,y:0,aimX:0,aimY:0,fire:false}}
    const axis=n=>{const v=pad.axes[n]||0;return Math.abs(v)<.18?0:Math.sign(v)*(Math.abs(v)-.18)/.82};
    const pressed=new Set(pad.buttons.map((b,i)=>b.pressed||b.value>.65?i:-1).filter(i=>i>=0));
    for(const [index,action] of [[0,attemptPossess],[1,ejectHost],[2,useMed]])if(pressed.has(index)&&!gamepadButtons.has(index))action();
    if(game.hack){for(const [index,pulse] of [[14,0],[12,1],[13,2],[15,3]])if(pressed.has(index)&&!gamepadButtons.has(index))pulseInput(pulse)}
    const fire=Boolean(pressed.has(3)||pad.buttons[7]?.pressed||pad.buttons[7]?.value>.35);
    gamepadButtons.clear();pressed.forEach(i=>gamepadButtons.add(i));
    return{x:axis(0),y:axis(1),aimX:axis(2),aimY:axis(3),fire};
  }
  function fireShot(){fire()}
  function damage(amount){if(game.invuln>0)return;game.health-=amount;game.invuln=.7;tone(75,.2,'sawtooth',.05);canvas.parentElement.classList.remove('shake');void canvas.parentElement.offsetWidth;canvas.parentElement.classList.add('shake');if(game.health<=0)endGame(false,'health')}
  function spawnEnemyBullet(e,target,boss=false,angleOffset=0){const dx=target.x-e.x,dy=target.y-e.y,angle=Math.atan2(dy,dx)+angleOffset,speed=boss?190:165;game.bullets.push({x:e.x,y:e.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:2,damage:boss?17:10,r:boss?5:3,color:boss?e.color:'#e56b61',hostile:true});tone(boss?67:115,.12,'square',.015)}
  function spawnBossBullet(boss,angle,speed=190,damage=17){game.bullets.push({x:boss.x,y:boss.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:2.5,damage,r:5,color:boss.color,hostile:true});}
  function bossVolley(boss,target){
    const aim=Math.atan2(target.y-boss.y,target.x-boss.x),rand=(min,max)=>min+Math.random()*(max-min),difficulty=boss.difficulty||1;
    switch(boss.pattern){
      case 'corePulse':
        if(Math.random()<.5){for(let i=-1;i<=1;i++)spawnBossBullet(boss,aim+i*.2,195*difficulty,17*difficulty)}
        else{spawnBossBullet(boss,aim+rand(-.12,.12),240*difficulty,19*difficulty);spawnBossBullet(boss,aim+Math.PI+rand(-.12,.12),165*difficulty,13*difficulty)}
        break;
      case 'archive':
        if(Math.random()<.58){const offset=boss.angle+rand(-.16,.16);for(let i=0;i<8;i++)spawnBossBullet(boss,offset+i*Math.PI/4,170*difficulty,14*difficulty)}
        else for(let i=-2;i<=2;i++)spawnBossBullet(boss,aim+i*.13,210*difficulty,16*difficulty);
        break;
      case 'broadside':{
        const side=Math.random()<.5?-1:1,base=aim+side*.16;for(let i=-2;i<=2;i++)spawnBossBullet(boss,base+i*.18,220*difficulty,16*difficulty);
        if(Math.random()<.45)spawnBossBullet(boss,aim,255*difficulty,18*difficulty);break;
      }
      case 'tendril':{
        const count=6,offset=boss.angle+rand(-.2,.2);for(let i=0;i<count;i++)spawnBossBullet(boss,offset+i*Math.PI*2/count,145*difficulty,13*difficulty);
        if(Math.random()<.6)spawnBossBullet(boss,aim+rand(-.08,.08),230*difficulty,16*difficulty);break;
      }
      case 'gravity':
        if(Math.random()<.55){const offset=boss.angle+rand(-.1,.1);for(let i=0;i<4;i++)spawnBossBullet(boss,offset+i*Math.PI/2,205*difficulty,17*difficulty)}
        else{for(let i=-1;i<=1;i++)spawnBossBullet(boss,aim+i*.28,180*difficulty,15*difficulty)}
        break;
      case 'bloom':
        if(Math.random()<.5){for(let i=-2;i<=2;i++)spawnBossBullet(boss,aim+i*.12,150*difficulty,15*difficulty);spawnBossBullet(boss,aim+rand(-.18,.18),245*difficulty,18*difficulty)}
        else{const petals=7,offset=rand(0,Math.PI*2);for(let i=0;i<petals;i++)spawnBossBullet(boss,offset+i*Math.PI*2/petals,160*difficulty,13*difficulty)}
        break;
      case 'orbital':
        if(Math.random()<.55){const offset=boss.angle;for(let i=0;i<10;i++)spawnBossBullet(boss,offset+i*Math.PI/5,165*difficulty,14*difficulty)}
        else for(let i=-1;i<=1;i++)spawnBossBullet(boss,aim+i*.1,245*difficulty,18*difficulty);
        break;
      case 'machine':{
        const count=Math.random()<.5?6:9,offset=Math.random()*Math.PI*2;for(let i=0;i<count;i++)spawnBossBullet(boss,offset+i*Math.PI*2/count,185*difficulty,15*difficulty);
        if(Math.random()<.65)for(let i=-1;i<=1;i++)spawnBossBullet(boss,aim+i*.09,230*difficulty,17*difficulty);break;
      }
    }
    tone(67,.12,'square',.015);
  }
  function spawnBossMinion(boss){
    const active=game.enemies.filter(e=>e.bossMinion).length,maxMinions=1+game.floor;
    if(active>=maxMinions)return false;
    const types=['stalker','security','worker','medic'],type=types[Math.floor(Math.random()*types.length)],baseHp=type==='security'?70:type==='stalker'?55:65;
    let point=null;
    for(let i=0;i<18&&!point;i++){const angle=Math.random()*Math.PI*2,distance=48+Math.random()*92,x=boss.x+Math.cos(angle)*distance,y=boss.y+Math.sin(angle)*distance;if(!blocked(x,y,12)&&Math.hypot(x-game.player.x,y-game.player.y)>55)point={x,y}}
    if(!point)return false;
    const scale=1+game.floor*.2,hp=Math.round(baseHp*scale);
    game.enemies.push({x:point.x,y:point.y,type,hp,maxHp:hp,r:type==='stalker'?10:11,angle:Math.random()*Math.PI*2,alert:true,shot:1+Math.random()*1.5,hit:0,id:`minion-${game.floor}-${Math.random()}`,bossMinion:true});
    notify(`${boss.name} called in a ${hostTypes[type].name}.`);updateMap();return true;
  }
  function update(dt){if(!game.started||game.over)return;game.elapsed+=dt;game.invuln=Math.max(0,game.invuln-dt);game.noise=Math.max(0,game.noise-dt);game.toastTimer-=dt;if(game.toastTimer<=0)$('toast').classList.remove('show');
    const pad=pollGamepad();if(game.hack){updateUI();return}
    const p=game.player;let x=(keysDown.has('d')||keysDown.has('arrowright')?1:0)-(keysDown.has('a')||keysDown.has('arrowleft')?1:0)+sticks.move.x+pad.x,y=(keysDown.has('s')||keysDown.has('arrowdown')?1:0)-(keysDown.has('w')||keysDown.has('arrowup')?1:0)+sticks.move.y+pad.y;const moveLength=Math.hypot(x,y);if(moveLength>1){x/=moveLength;y/=moveLength}if(Math.hypot(x,y)>.04){const d=Math.hypot(x,y);p.faceX=x/d;p.faceY=y/d;const speed=hostTypes[game.host].speed;moveEntity(p,x*speed*dt,y*speed*dt,p.r)}
    const touchAimLength=Math.hypot(sticks.aim.x,sticks.aim.y),padAimLength=Math.hypot(pad.aimX,pad.aimY);let aimX=0,aimY=0;if(touchAimLength>.18){aimX=sticks.aim.x;aimY=sticks.aim.y}else if(padAimLength>.18){aimX=pad.aimX;aimY=pad.aimY}const aimLength=Math.hypot(aimX,aimY);aimInputActive=aimLength>.18;if(aimInputActive){p.faceX=aimX/aimLength;p.faceY=aimY/aimLength}if((aimInputActive||pad.fire||touchFire||pointer.down||keysDown.has('f'))&&hostTypes[game.host].weapon)fire(Boolean(pointer.down||keysDown.has('f')));
    if(game.host!=='wraith'){game.hostEnergy-=hostTypes[game.host].drain*dt;if(game.hostEnergy<=0){game.hostEnergy=0;endGame(false,'burnout');return}}
    game.bullets.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(solid(b.x,b.y))b.life=0;if(b.hostile){if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+b.r){b.life=0;damage(b.damage)}}else{for(const e of game.enemies){if(e.hp>0&&Math.hypot(b.x-e.x,b.y-e.y)<e.r+b.r){e.hp-=b.damage;e.hit=.12;b.life=0;game.noise=1;if(e.hp<=0){notify('Hostile signal terminated.');tone(65,.3,'sawtooth',.04)}break}}if(game.boss&&Math.hypot(b.x-game.boss.x,b.y-game.boss.y)<game.boss.r+b.r){game.boss.hp-=b.damage;game.boss.hit=.16;b.life=0;if(game.boss.hp<=0){const defeated=game.boss.name;game.boss=null;game.enemies=game.enemies.filter(e=>!e.bossMinion);notify(`${defeated} DESTROYED. The exit is open.`);tone(50,.8,'sawtooth',.05)}}}});game.bullets=game.bullets.filter(b=>b.life>0);game.enemies=game.enemies.filter(e=>e.hp>0);
    for(const e of game.enemies){e.hit=Math.max(0,e.hit-dt);const d=Math.hypot(p.x-e.x,p.y-e.y),difficulty=1+game.floor*.12;if(d<205||game.noise>0)e.alert=true;if(e.alert&&d>18){const dx=(p.x-e.x)/d,dy=(p.y-e.y)/d;moveEntity(e,dx*(e.type==='stalker'?52:35)*difficulty*dt,dy*(e.type==='stalker'?52:35)*difficulty*dt,e.r)}if(d<e.r+p.r+3)damage(14*dt);e.shot-=dt;if(e.alert&&d<270&&e.shot<=0&&clearLine(e.x,e.y,p.x,p.y)){spawnEnemyBullet(e,p);e.shot=(e.type==='security'?1.5:2.4+Math.random())/difficulty}}
    if(game.boss){const b=game.boss;b.hit=Math.max(0,b.hit-dt);b.angle+=dt*(b.pattern==='archive'||b.pattern==='orbital'?1.25:.7);const d=Math.hypot(p.x-b.x,p.y-b.y);if(d<330)b.shot-=dt;if(b.shot<=0&&d<380){bossVolley(b,p);const cadence={corePulse:1.35,archive:1.7,broadside:1.55,tendril:1.8,gravity:1.5,bloom:1.65,orbital:1.75,machine:1.45}[b.pattern]||1.5;b.shot=(cadence+Math.random()*.55)/(1+game.floor*.06)}if(d<44)damage(21*dt);if(d<450){b.minionTimer-=dt;if(b.minionTimer<=0){const called=spawnBossMinion(b);b.minionTimer=called?Math.max(6.5,9.5-game.floor*.6)+Math.random()*2:2}}}
    for(const a of game.items){if(a.taken)continue;if(Math.hypot(p.x-a.x,p.y-a.y)<19){a.taken=true;if(a.type==='key'){game.keys++;notify(`Access key acquired: ${game.keys} / ${keyTarget()}`);tone(760,.16,'sine',.04);if(game.keys>=keyTarget()&&!finalFloor())notify('All access keys recovered. Transit door unlocked.')}else if(a.type==='med'){game.medkits++;notify('Medkit recovered. Press H to use.');tone(600,.1,'sine',.03)}else{game.hostEnergy=Math.min(100,game.hostEnergy+28);game.health=Math.min(100,game.health+12);notify('Charge cell recovered. Host stabilized.');tone(470,.12,'sine',.03)}updateMap()}}
    if(!finalFloor()&&Math.hypot(p.x-game.goal.x,p.y-game.goal.y)<25){if(game.keys>=keyTarget()){setupFloor(game.floor+1);game.keys=0;game.hostEnergy=Math.min(100,game.hostEnergy+35);game.health=Math.min(100,game.health+20);notify(`Deck ${String(game.floor+1).padStart(2,'0')}: ${floors[game.floor].name}.`);log(`Entered ${floors[game.floor].name.toLowerCase()}.`)}else if(game.elapsed%2<dt)notify(`Transit door sealed. ${keyTarget()-game.keys} access key${game.keys===keyTarget()-1?'':'s'} remain.`)}
    if(finalFloor()&&!game.boss&&Math.hypot(p.x-game.goal.x,p.y-game.goal.y)<27)endGame(true,'win');
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
  function drawGoal(){if(!game.goal)return;const g=game.goal,open=(finalFloor()&&!game.boss)||(!finalFloor()&&game.keys>=keyTarget());ctx.save();ctx.translate(g.x,g.y);ctx.strokeStyle=open?'#92dbb0':'#b28a5b';ctx.shadowColor=open?'#65d8ab':'#b17f4b';ctx.shadowBlur=12;ctx.lineWidth=2;ctx.strokeRect(-13,-15,26,30);ctx.fillStyle='#111b1a';ctx.fillRect(-9,-12,18,24);ctx.fillStyle=open?'#6fd7a6':'#d7a464';ctx.fillRect(-2,-7,4,14);ctx.fillStyle='#718174';ctx.fillRect(-18,-16,4,32);ctx.fillRect(14,-16,4,32);ctx.restore()}
  function drawEnemy(e){const t=hostTypes[e.type];ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle||0);ctx.shadowColor=t.color;ctx.shadowBlur=5;ctx.fillStyle=e.hit?'#fff':e.type==='stalker'?'#39253c':e.type==='security'?'#1f4545':e.type==='medic'?'#344d37':'#58432c';ctx.strokeStyle=t.color;ctx.lineWidth=1.5;if(e.type==='stalker'){ctx.beginPath();ctx.moveTo(-11,-9);ctx.lineTo(-2,-13);ctx.lineTo(9,-9);ctx.lineTo(13,-1);ctx.lineTo(9,9);ctx.lineTo(-3,12);ctx.lineTo(-12,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#f17cbe';ctx.fillRect(4,-3,5,2)}else{ctx.beginPath();ctx.roundRect(-9,-11,18,22,4);ctx.fill();ctx.stroke();ctx.fillStyle=t.color;ctx.fillRect(1,-5,7,4);ctx.fillStyle='#27302c';ctx.fillRect(-12,3,5,3);ctx.fillRect(7,3,5,3)}ctx.restore();if(e.hp<e.maxHp){ctx.fillStyle='#291e1b';ctx.fillRect(e.x-11,e.y-17,22,2);ctx.fillStyle='#e57861';ctx.fillRect(e.x-11,e.y-17,22*Math.max(0,e.hp/e.maxHp),2)}}
  function drawBoss(b){
    ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.shadowBlur=24;ctx.shadowColor=b.color;ctx.fillStyle=b.hit?'#fff3dc':'#19232a';ctx.strokeStyle=b.color;ctx.lineWidth=3;
    const polygon=(points)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();ctx.stroke()};
    if(b.kind==='core'){
      ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?18:31,x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-3,-2,6,4);
    }else if(b.kind==='spokes'){
      ctx.beginPath();ctx.arc(0,0,17,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*14,Math.sin(a)*14);ctx.lineTo(Math.cos(a)*32,Math.sin(a)*32);ctx.stroke();ctx.beginPath();ctx.arc(Math.cos(a)*32,Math.sin(a)*32,3,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill()}
    }else if(b.kind==='wings'){
      polygon([[-8,-7],[-34,-26],[-27,-4],[-34,21],[-7,8],[0,16],[8,8],[34,21],[27,-4],[34,-26],[8,-7],[0,-17]]);ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();
    }else if(b.kind==='tendrils'){
      ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*10,Math.sin(a)*10);ctx.quadraticCurveTo(Math.cos(a+.35)*30,Math.sin(a+.35)*30,Math.cos(a)*38,Math.sin(a)*38);ctx.stroke();ctx.beginPath();ctx.arc(Math.cos(a)*38,Math.sin(a)*38,3,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill()}
    }else if(b.kind==='diamond'){
      polygon([[0,-34],[13,-13],[34,0],[13,13],[0,34],[-13,13],[-34,0],[-13,-13]]);ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();
    }else if(b.kind==='star'){
      const points=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?15:35;points.push([Math.cos(a)*r,Math.sin(a)*r])}polygon(points);ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
    }else if(b.kind==='orbital'){
      ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.stroke();for(let i=0;i<3;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.ellipse(0,0,35,13,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(35,0,4,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();ctx.restore()}
    }else{
      const points=[];for(let i=0;i<6;i++){const a=i*Math.PI/3;points.push([Math.cos(a)*29,Math.sin(a)*29])}polygon(points);ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill();ctx.fillStyle='#152027';ctx.fillRect(-5,-5,10,10);
    }
    ctx.restore();ctx.fillStyle='#172027';ctx.fillRect(b.x-34,b.y-43,68,5);ctx.fillStyle=b.color;ctx.fillRect(b.x-33,b.y-42,66*Math.max(0,b.hp/b.maxHp),3);
  }
  function drawPlayer(){const p=game.player,h=hostTypes[game.host];ctx.save();ctx.translate(p.x,p.y);if(game.invuln>0&&Math.floor(game.invuln*12)%2)ctx.globalAlpha=.45;ctx.shadowColor=h.color;ctx.shadowBlur=game.host==='wraith'?17:8;ctx.rotate(Math.atan2(p.faceY,p.faceX));if(game.host==='wraith'){ctx.fillStyle='#c9f475';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#efffb8';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,12+Math.sin(game.elapsed*5)*2,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#17201a';ctx.fillRect(1,-2,6,4)}else{ctx.fillStyle=h.color;ctx.strokeStyle='#e1eed1';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-8,-10,17,20,4);ctx.fill();ctx.stroke();ctx.fillStyle='#111a17';ctx.fillRect(1,-5,8,5);ctx.fillStyle=h.color;ctx.fillRect(5,-3,10,2);ctx.fillRect(-5,8,4,5);ctx.fillRect(3,8,4,5)}ctx.restore()}
  function drawBullet(b){ctx.save();ctx.shadowBlur=12;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawLighting(){ctx.save();ctx.fillStyle='rgba(1,5,8,.78)';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='destination-out';const light=(x,y,r,alpha=1)=>{const grad=ctx.createRadialGradient(x,y,5,x,y,r);grad.addColorStop(0,`rgba(0,0,0,${alpha})`);grad.addColorStop(.55,`rgba(0,0,0,${alpha*.65})`);grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()};light(game.player.x,game.player.y,game.host==='wraith'?144:122,.98);for(let y=2;y<ROWS-2;y+=4)for(const x of [3,11,19,25])if(game.grid[y]?.[x]===0)light(x*T+16,y*T+16,46,.42);game.items.filter(a=>!a.taken).forEach(a=>light(a.x,a.y,35,.55));if(game.boss)light(game.boss.x,game.boss.y,75,.48);ctx.restore()}
  function drawHudInWorld(){ctx.fillStyle='#8c9a8f';ctx.font='9px "IBM Plex Mono",monospace';ctx.fillText(`${activeCampaign().name}  //  ${floors[game.floor].subtitle}`,12,17);if(!finalFloor()){ctx.fillStyle='#bea76d';ctx.fillText(`ACCESS KEYS  ${game.keys}/${keyTarget()}`,W-145,17)}else if(game.boss){ctx.fillStyle=game.boss.color;ctx.fillText(`${game.boss.name} // HOSTILE`,W-190,17)}}
  function loop(now){if(!game.started||game.over)return;const dt=Math.min(.04,(now-game.last)/1000||0);game.last=now;update(dt);draw();requestAnimationFrame(loop)}
  function pointFromEvent(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
  document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();keysDown.add(k);if(game.hack){const m={'arrowleft':0,'arrowup':1,'arrowdown':2,'arrowright':3};if(k in m)pulseInput(m[k]);return}if(k==='e')attemptPossess();if(k==='q')ejectHost();if(k==='h')useMed();if(k===' '){fire();if(game.started&&!game.over)keysDown.add('f')}});
  document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();keysDown.delete(k);if(k===' ')keysDown.delete('f')});
  canvas.addEventListener('pointermove',e=>{const pt=pointFromEvent(e);pointer.x=pt.x;pointer.y=pt.y;pointer.seen=true});canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointer.down=true;const pt=pointFromEvent(e);pointer.x=pt.x;pointer.y=pt.y;pointer.seen=true;fire()});window.addEventListener('pointerup',()=>pointer.down=false);
  document.querySelectorAll('.hack-inputs button').forEach(b=>b.addEventListener('click',()=>pulseInput(Number(b.dataset.pulse))));
  $('startButton').addEventListener('click',start);$('restartButton').addEventListener('click',()=>{$('introOverlay').classList.remove('hidden');$('endOverlay').classList.add('hidden');selectCampaign(campaignIndex)});
  $('soundToggle').addEventListener('click',()=>{soundOn=!soundOn;$('soundToggle').innerHTML=`♫ <span>SOUND ${soundOn?'ON':'OFF'}</span>`;if(soundOn){music();tone(440,.1)}else stopMusic()});
  function bindStick(id,axis){const el=$(id),knob=el.querySelector('.stick-knob'),value=sticks[axis];let pointerId=null;const reset=()=>{value.x=0;value.y=0;el.style.setProperty('--stick-x','0px');el.style.setProperty('--stick-y','0px');el.classList.remove('active');pointerId=null};
    const move=e=>{if(pointerId!==e.pointerId)return;e.preventDefault();const r=el.getBoundingClientRect(),radius=Math.min(r.width,r.height)*.34,cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy);if(d>radius){dx*=radius/d;dy*=radius/d;d=radius}const dead=.12,amount=d/radius;value.x=amount<dead?0:dx/radius;value.y=amount<dead?0:dy/radius;el.style.setProperty('--stick-x',`${dx}px`);el.style.setProperty('--stick-y',`${dy}px`)};
    el.addEventListener('pointerdown',e=>{e.preventDefault();pointerId=e.pointerId;el.classList.add('active');el.setPointerCapture(pointerId);move(e)});el.addEventListener('pointermove',move);['pointerup','pointercancel','lostpointercapture'].forEach(type=>el.addEventListener(type,reset));
  }
  bindStick('moveStick','move');bindStick('aimStick','aim');
  $('touchLink').addEventListener('click',attemptPossess);$('touchEject').addEventListener('click',ejectHost);$('touchMed').addEventListener('click',useMed);
  const fireButton=$('touchFire');let firePointerId=null;const releaseTouchFire=()=>{touchFire=false;firePointerId=null;fireButton.classList.remove('pressed')};fireButton.addEventListener('pointerdown',e=>{e.preventDefault();firePointerId=e.pointerId;touchFire=true;fireButton.classList.add('pressed');fireButton.setPointerCapture(e.pointerId)});['pointerup','pointercancel','lostpointercapture'].forEach(type=>fireButton.addEventListener(type,e=>{if(firePointerId===e.pointerId)releaseTouchFire()}));fireButton.addEventListener('click',e=>{if(e.detail===0)fire(false)});
  document.querySelectorAll('.hack-inputs button').forEach(btn=>btn.addEventListener('pointerdown',e=>e.preventDefault()));
  renderCampaignPicker();selectCampaign(campaignIndex);draw();
})();
