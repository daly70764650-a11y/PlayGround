const teams = {
  T20: [
    {name:'Australia',short:'AUS',colors:['#f1bd36','#176a49'],crest:'A'}, {name:'India',short:'IND',colors:['#1674ad','#ee8b3a'],crest:'I'}, {name:'England',short:'ENG',colors:['#c83c45','#f4f0e2'],crest:'E'}, {name:'New Zealand',short:'NZ',colors:['#202c32','#dce4db'],crest:'N'}, {name:'South Africa',short:'RSA',colors:['#27815d','#f0c63b'],crest:'S'}, {name:'Pakistan',short:'PAK',colors:['#176847','#f3eee1'],crest:'P'}, {name:'West Indies',short:'WI',colors:['#7d2936','#e9c94e'],crest:'W'}, {name:'Sri Lanka',short:'SL',colors:['#2255a0','#d3ac50'],crest:'L'}
  ],
  BBL: [
    {name:'Adelaide Strikers',short:'STR',colors:['#1684b8','#e7e8e5'],crest:'A'}, {name:'Brisbane Heat',short:'HEA',colors:['#3175a7','#a9d8db'],crest:'B'}, {name:'Hobart Hurricanes',short:'HUR',colors:['#633c95','#e1b64d'],crest:'H'}, {name:'Melbourne Renegades',short:'REN',colors:['#c34145','#f2f0e7'],crest:'M'}, {name:'Melbourne Stars',short:'STA',colors:['#429456','#e7cf45'],crest:'M'}, {name:'Perth Scorchers',short:'SCO',colors:['#e17e2f','#262e33'],crest:'P'}, {name:'Sydney Sixers',short:'SIX',colors:['#db5b8c','#f0d7dc'],crest:'S'}, {name:'Sydney Thunder',short:'THU',colors:['#73b847','#343e39'],crest:'S'}
  ],
  WC: [
    {name:'Australia',short:'AUS',colors:['#f1bd36','#176a49'],crest:'A'}, {name:'India',short:'IND',colors:['#1674ad','#ee8b3a'],crest:'I'}, {name:'England',short:'ENG',colors:['#c83c45','#f4f0e2'],crest:'E'}, {name:'New Zealand',short:'NZ',colors:['#202c32','#dce4db'],crest:'N'}, {name:'South Africa',short:'RSA',colors:['#27815d','#f0c63b'],crest:'S'}, {name:'Pakistan',short:'PAK',colors:['#176847','#f3eee1'],crest:'P'}, {name:'West Indies',short:'WI',colors:['#7d2936','#e9c94e'],crest:'W'}, {name:'Sri Lanka',short:'SL',colors:['#2255a0','#d3ac50'],crest:'L'}
  ]
};
const $ = s => document.querySelector(s);
const els = {
  home:$('#home-team'), away:$('#away-team'), score:$('#score'), wickets:$('#wickets'), overs:$('#overs'), target:$('#target'), rate:$('#run-rate'), required:$('#required'), inningLabel:$('#innings-label'), battingName:$('#batting-name'), commentary:$('#commentary'), byline:$('#commentary-byline'), umpire:$('#umpire-call'), umpireIcon:$('#umpire-icon'), overDisplay:$('#over-display'), ground:$('#ground-frame'), groundCall:$('#ground-call-text'), chip:$('#ground-chip'), chipText:$('#chip-text'), controls:$('#shot-controls'), inningsControls:$('#innings-controls'), title:$('#control-title'), hint:$('#control-hint'), kicker:$('#control-kicker'), start:$('#start-game'), next:$('#next-innings'), toast:$('#toast'), status:$('#match-status')
};
let format='T20', women=false, match=null, deliveryTimer=null, toastTimer=null, audio=null, musicTimer=null, soundOn=false, crowdSource=null, crowdGain=null;
const radioBylines=['— THE RADIO BOX','— FROM THE BOUNDARY','— A VOICE FROM THE STAND'];
function radioByline(){return radioBylines[rInt(radioBylines.length)]}
const rInt = n => Math.floor(Math.random()*n);
function info(name){return teams[format].find(t=>t.name===name)||teams.T20.find(t=>t.name===name)}
function renderTeams(keep=true){
  const oldH=keep?els.home.value:'', oldA=keep?els.away.value:'';
  const list=teams[format];
  [els.home,els.away].forEach((select,index)=>{
    const old=index===0?oldH:oldA;
    select.innerHTML=list.map(t=>`<option value="${t.name}">${t.name}</option>`).join('');
    select.value=old&&list.some(t=>t.name===old)?old:list[index===0?0:1].name;
  });
  updateTeamVisuals();
}
function updateTeamVisuals(){
  [['home',els.home],['away',els.away]].forEach(([side,select])=>{
    const t=info(select.value), color=t.colors[0];
    $(`#crest-${side}`).textContent=t.crest;
    $(`#crest-${side}`).style.background=`linear-gradient(140deg,${t.colors[0]},${t.colors[1]})`;
    $(`#swatches-${side}`).innerHTML=t.colors.map(c=>`<i style="background:${c}"></i>`).join('');
    $(`#mode-${side}`).textContent=women?'WOMEN’S XI':'MEN’S XI';
    document.documentElement.style.setProperty(side==='home'?'--home':'--away',color);
  });
}
function setFormat(value){format=value;document.querySelectorAll('.segment').forEach(b=>b.classList.toggle('active',b.dataset.format===format));renderTeams();$('#ground-subtitle').textContent=format==='BBL'?'ADELAIDE · A CRACKING DAY FOR IT':format==='WC'?'WORLD CUP · EVERY BALL COUNTS':'ADELAIDE · A CRACKING DAY FOR IT';}
function setCommentary(text, umpire='Play on!', icon='☞', byline='— YOUR VERY OWN COMMENTATOR'){
  els.commentary.textContent=text;els.umpire.textContent=umpire;els.umpireIcon.textContent=icon;els.byline.textContent=byline;
}
function showToast(text){els.toast.textContent=text;els.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>els.toast.classList.remove('show'),2100)}
function oversText(balls){return `${Math.floor(balls/6)}.${balls%6}`}
function updateScore(){
  const runs=match.innings===1?match.first:match.second, balls=match.innings===1?match.firstBalls:match.secondBalls;
  els.score.textContent=String(runs).padStart(2,'0');els.wickets.textContent=match.innings===1?match.firstW:match.secondW;
  els.overs.textContent=oversText(balls);els.battingName.textContent=match.innings===1?match.homeTeam:match.awayTeam;
  els.inningLabel.textContent=match.innings===1?'1ST INNINGS':'2ND INNINGS';
  els.target.textContent=match.innings===1?'—':String(match.first+1);
  els.required.textContent=match.innings===1?'—':Math.max(0,match.first+1-match.second);
  els.rate.textContent=balls?((runs/balls)*6).toFixed(2):'0.00';
  els.overDisplay.textContent=`OVER ${Math.floor(balls/6)+1} · BALL ${(balls%6)+1}`;
}
function setupMatch(){
  match={innings:1,first:0,firstW:0,firstBalls:0,second:0,secondW:0,secondBalls:0,phase:'ready',homeTeam:els.home.value,awayTeam:els.away.value};
  els.status.textContent='MATCH IN PROGRESS';
  els.controls.classList.remove('hidden');els.inningsControls.classList.add('hidden');els.controls.innerHTML='';makeNextButton();
  els.kicker.textContent='AT THE CREASE';els.title.textContent='Ready when you are.';els.hint.textContent='Tap a shot as the ball reaches the batter. Timing is everything.';
  els.ground.classList.remove('hit','wicket','boundary','celebrate','delivering');els.groundCall.textContent='YOUR INNINGS';
  updateScore();setCommentary(`The ${women?'women’s':'men’s'} ${match.homeTeam} XI take the field. Settle in — we’ve got cricket to enjoy.`, 'Play on!','☞',radioByline());showChip('READY TO PLAY');
  lockSetup(true);
}
function lockSetup(locked){document.querySelectorAll('.segment,#squad-toggle').forEach(b=>b.disabled=locked);els.home.disabled=locked;els.away.disabled=locked;}
function showChip(text){els.chipText.textContent=text;els.chip.classList.add('show');clearTimeout(showChip.timer);showChip.timer=setTimeout(()=>els.chip.classList.remove('show'),1100)}
function startDelivery(){
  if(!match||match.phase!=='ready')return;
  match.deliveryStarted=Date.now();match.phase='delivery';els.start.disabled=true;
  els.ground.classList.remove('hit','wicket','boundary','celebrate');void els.ground.offsetWidth;els.ground.classList.add('delivering');
  els.title.textContent='Here comes the ball…';els.hint.textContent='Get your shot ready — tap when it reaches the batter.';els.kicker.textContent='BOWLER IN';els.groundCall.textContent='BOWLER IN';
  setCommentary(['A little shuffle at the top of the mark… here comes the bowler.','The field is set, the batter is ready, and away we go.','A measured run-up now — watch this one closely.'][rInt(3)],'Play on!','☞',radioByline());playSound('bowl');
  deliveryTimer=setTimeout(()=>{
    if(!match||match.phase!=='delivery')return;
    match.phase='batting';
    els.controls.innerHTML=`<button class="shot-button shot-defend" data-shot="defend"><span class="shot-glyph">◌</span><span><b>DEFEND</b><small>SAFE HANDS</small></span></button><button class="shot-button shot-drive" data-shot="drive"><span class="shot-glyph">↗</span><span><b>DRIVE</b><small>FIND THE GAP</small></span></button><button class="shot-button shot-loft" data-shot="loft"><span class="shot-glyph">⌁</span><span><b>LOFT</b><small>GO BIG</small></span></button>`;
    els.controls.querySelectorAll('[data-shot]').forEach(b=>b.addEventListener('click',()=>playShot(b.dataset.shot)));
    els.title.textContent='Play your shot!';els.hint.textContent='Now! Choose defend, drive, or loft — great timing sends it flying.';els.kicker.textContent='YOUR CALL';showChip('PLAY IT NOW');
    deliveryTimer=setTimeout(()=>resolveShot('miss'),1050);
  },420);
}
function resolveShot(shot,timing='perfect'){
  if(!match||!['batting','delivery'].includes(match.phase))return;
  clearTimeout(deliveryTimer);const late=shot==='miss';match.phase='resolving';els.ground.classList.remove('delivering');
  let runs=0,wicket=false,kind='';const luck=Math.random();
  if(late){if(luck<.21){wicket=true;kind='bowled';}else{runs=luck>.9?1:0;kind=runs?'leg bye':'dot';}}
  else if(shot==='defend'){
    if(luck<.42)runs=0;else if(luck<.9)runs=1;else runs=2;
    if(timing==='poor'&&luck<.12){wicket=true;kind='edge';}else kind=runs?'single':'dot';
  }else if(shot==='drive'){
    if(timing==='perfect'){if(luck<.14){wicket=true;kind='caught';}else if(luck<.46){runs=4;kind='four';}else if(luck<.57){runs=6;kind='six';}else if(luck<.79){runs=2;kind='two';}else{runs=1;kind='single';}}
    else if(timing==='good'){if(luck<.13){wicket=true;kind='caught';}else if(luck<.31){runs=4;kind='four';}else if(luck<.56){runs=2;kind='two';}else{runs=1;kind='single';}}
    else{if(luck<.23){wicket=true;kind='caught';}else if(luck<.32){runs=4;kind='four';}else if(luck<.68){runs=1;kind='single';}else kind='dot';}
  }else{
    if(timing==='perfect'){if(luck<.24){wicket=true;kind='caught';}else if(luck<.68){runs=6;kind='six';}else if(luck<.86){runs=4;kind='four';}else{runs=2;kind='two';}}
    else if(timing==='good'){if(luck<.24){wicket=true;kind='caught';}else if(luck<.43){runs=6;kind='six';}else if(luck<.58){runs=4;kind='four';}else if(luck<.82){runs=2;kind='two';}else{runs=1;kind='single';}}
    else{if(luck<.38){wicket=true;kind='caught';}else if(luck<.48){runs=6;kind='six';}else if(luck<.62){runs=4;kind='four';}else if(luck<.76){runs=1;kind='single';}else kind='dot';}
  }
  if(match.innings===1){match.firstBalls++;if(wicket)match.firstW++;else match.first+=runs;}
  else{match.secondBalls++;if(wicket)match.secondW++;else match.second+=runs;}
  updateScore();
  if(wicket){els.ground.classList.add('wicket');playSound('wicket');}
  else if(runs>=4){els.ground.classList.add('boundary');playSound(runs===6?'six':'four');}
  else if(runs>0){els.ground.classList.add('hit');playSound('bat');}
  const timingText=late?'The batter is beaten!':timing==='perfect'?'Beautifully timed!':timing==='good'?'A decent connection!':'A little mistimed!';
  if(wicket){
    const messages=kind==='caught'?['Howzat! A sharp appeal — and the umpire raises the finger. Taken in the deep!','Caught! The fielder held on, and the finger goes up.','A neat catch, a loud appeal, and that is out!']:kind==='edge'?['Howzat! A thin edge and safely pouched — gone!','A nick, a fine catch, and the appeal is answered. Out!']:['Howzat! The stumps are rattled — bowled!','The timber is disturbed. The umpire has no doubt: bowled!','Clean bowled! A big moment in the match.'];
    const call=kind==='caught'||kind==='edge'?'OUT! CAUGHT!':'OUT! BOWLED!';
    setCommentary(messages[rInt(messages.length)],call,'☝',radioByline());els.groundCall.textContent='OUT!';playSound('cheer');
  }else if(runs===6){setCommentary(['Up it goes — and that’s a six! Marvellous hitting.','That’s a mighty six, right out of the ground!','A towering hit! Six all the way — marvellous!'][rInt(3)],'SIX!','🙌',radioByline());els.groundCall.textContent='SIX!';els.ground.classList.add('celebrate');playSound('cheer');}
  else if(runs===4){setCommentary(['That’s a four! A beautifully placed stroke to the rope.','Cracked away — and that’s four runs!','Marvellous timing; it races away for four!'][rInt(3)],'FOUR!','✋',radioByline());els.groundCall.textContent='FOUR!';els.ground.classList.add('celebrate');playSound('cheer');}
  else if(runs){setCommentary(`${timingText} Quick feet, and they’ll come back for ${runs===1?'one':runs+' runs'}.`,'One run','☞',radioByline());els.groundCall.textContent=`${runs} RUN${runs>1?'S':''}`;}
  else{setCommentary('No run. A tidy bit of bowling, and the fielders keep it quiet.','Play on','☞',radioByline());els.groundCall.textContent='DOT BALL';playSound('dot');}
  els.title.textContent=wicket?'A wicket falls!':runs>=4?`${runs===6?'Six':'Four'}! That’s the way.`:runs?`${runs} run${runs>1?'s':''} on the board.`:'Dot ball.';
  els.hint.textContent=timingText;els.kicker.textContent=wicket?'THAT’S CRICKET':'THE SCORE MOVES ON';
  els.controls.innerHTML='';makeNextButton();checkInnings();
}
function makeNextButton(){
  const b=document.createElement('button');b.className='shot-button start-button';b.id='start-game';b.innerHTML='<span class="shot-glyph">●</span><span><b>BOWL NEXT BALL</b><small>KEEP IT ROLLING</small></span><span class="button-arrow">↗</span>';
  b.addEventListener('click',startDelivery);els.controls.appendChild(b);els.start=b;return b;
}
function playShot(shot){
  if(!match||match.phase!=='batting')return;
  clearTimeout(deliveryTimer);const elapsed=Date.now()-match.deliveryStarted;
  const t=elapsed-420,diff=Math.abs(t-880),grade=diff<240?'perfect':diff<520?'good':'poor';
  resolveShot(shot,grade);
}
function checkInnings(){
  const balls=match.innings===1?match.firstBalls:match.secondBalls,wickets=match.innings===1?match.firstW:match.secondW;
  if(match.innings===1&&(balls>=120||wickets>=10)){
    match.phase='inningsEnd';els.controls.classList.add('hidden');els.inningsControls.classList.remove('hidden');
    $('#next-innings').innerHTML='<span class="shot-glyph">↻</span><span><b>START 2ND INNINGS</b><small>CHASE THE TARGET</small></span><span class="button-arrow">↗</span>';
    els.title.textContent='Innings break.';els.hint.textContent=`${match.awayTeam} need ${match.first+1} to win. Twenty overs each, backyard rules.`;els.kicker.textContent='TIME TO CHANGE SIDES';
    els.groundCall.textContent='INNINGS BREAK';setCommentary(`That’s the end of the first innings. ${match.awayTeam} need ${match.first+1} to take the match.`, 'Change of innings','↻',radioByline());
    return;
  }
  if(match.innings===2&&(match.second>match.first||balls>=120||wickets>=10)){
    finishMatch();return;
  }
  match.phase='ready';
}
function beginSecondInnings(){
  match.innings=2;match.phase='ready';els.inningsControls.classList.add('hidden');els.controls.classList.remove('hidden');els.controls.innerHTML='';makeNextButton();
  els.ground.classList.remove('hit','wicket','boundary','celebrate');els.groundCall.textContent='CHASE ON';updateScore();
  els.title.textContent='The chase is on.';els.hint.textContent=`${match.awayTeam} need ${match.first+1} to win. You’re batting now.`;els.kicker.textContent='SECOND INNINGS';
  setCommentary(`A target of ${match.first+1}. Can ${match.awayTeam} get there? It’s all to play for.`, 'Play on!','☞',radioByline());
}
function finishMatch(){
  match.phase='finished';const homeWon=match.second>match.first, tied=match.second===match.first;
  const result=tied?'It’s a tie! Backyard cricket at its best.':homeWon?`${match.awayTeam} win by ${10-match.secondW} wicket${match.secondW===9?'':'s'}!`:`${match.homeTeam} win by ${match.first-match.second} run${match.first-match.second===1?'':'s'}!`;
  els.status.textContent='MATCH COMPLETE';els.groundCall.textContent=tied?'A TIE!':'THAT’S THE MATCH';els.title.textContent=tied?'What a match!':homeWon?'The chase is complete!':'Victory for the home side!';els.hint.textContent=result;els.kicker.textContent='FULL TIME';
  setCommentary(result,tied?'MATCH TIED':'THAT’S A WIN!','🙌','— THE ADELAIDE OVAL BOARD');els.controls.classList.remove('hidden');els.controls.innerHTML='';
  const b=document.createElement('button');b.className='shot-button start-button';b.innerHTML='<span class="shot-glyph">↻</span><span><b>PLAY AGAIN</b><small>ONE MORE MATCH?</small></span><span class="button-arrow">↗</span>';b.addEventListener('click',resetMatch);els.controls.appendChild(b);
}
function resetMatch(){
  match=null;lockSetup(false);els.status.textContent='MATCH DAY';els.ground.classList.remove('hit','wicket','boundary','celebrate','delivering');els.groundCall.textContent='YOUR INNINGS';
  els.score.textContent='00';els.wickets.textContent='0';els.overs.textContent='0.0';els.target.textContent='—';els.rate.textContent='0.00';els.required.textContent='—';els.battingName.textContent='BACKYARD XI';els.inningLabel.textContent='1ST INNINGS';els.overDisplay.textContent='OVER 1 · BALL 1';
  els.title.textContent='Ready when you are.';els.hint.textContent='Choose your sides and start a fresh T20.';els.kicker.textContent='AT THE CREASE';setCommentary('The ground is yours. Let’s play some cricket.');
  els.controls.classList.remove('hidden');els.inningsControls.classList.add('hidden');els.controls.innerHTML='';
  const b=document.createElement('button');b.className='shot-button start-button';b.id='start-game';b.innerHTML='<span class="shot-glyph">▶</span><span><b>START MATCH</b><small>GIVE IT A GO</small></span><span class="button-arrow">↗</span>';b.addEventListener('click',setupMatch);els.controls.appendChild(b);els.start=b;
}
function ensureAudio(){if(!audio){const Ctx=window.AudioContext||window.webkitAudioContext;if(Ctx)audio=new Ctx();}if(audio?.state==='suspended')audio.resume();}
function tone(freq,duration=.16,type='sine',volume=.035,when=0){if(!audio)return;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,audio.currentTime+when);gain.gain.exponentialRampToValueAtTime(volume,audio.currentTime+when+.015);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+when+duration);osc.connect(gain);gain.connect(audio.destination);osc.start(audio.currentTime+when);osc.stop(audio.currentTime+when+duration+.03)}
function startCrowd(){
  if(!audio||crowdSource)return;
  const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.7;
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
  source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=720;gain.gain.value=.018;
  source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();crowdSource=source;crowdGain=gain;
  [118,151,187,224].forEach((freq,i)=>{const voice=audio.createOscillator(),level=audio.createGain();voice.type='sine';voice.frequency.value=freq+(Math.random()*8-4);level.gain.value=.11;voice.connect(level);level.connect(gain);voice.start();crowdNodes.push(voice,level)});
}
const crowdNodes=[];
function stopCrowd(){if(crowdSource){try{crowdSource.stop()}catch{}crowdSource.disconnect();crowdSource=null}crowdNodes.forEach(node=>{try{node.stop?.()}catch{}node.disconnect()});crowdNodes.length=0;crowdGain=null}
function crowdCheer(){
  if(!soundOn||!audio)return;
  const length=Math.floor(audio.sampleRate*.95),buffer=audio.createBuffer(1,length,audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
  const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
  source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1050;filter.Q.value=.55;
  gain.gain.setValueAtTime(.0001,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.045,audio.currentTime+.12);gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+.95);
  source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();source.stop(audio.currentTime+1);
  [330,392,466].forEach((freq,i)=>tone(freq+i*5,.7,'sawtooth',.008,i*.025));
}
function playSound(kind){if(!soundOn)return;ensureAudio();if(!audio)return;
  if(kind==='bowl'){tone(180,.2,'triangle',.022);tone(120,.15,'sine',.015,.2)}
  if(kind==='bat'){tone(330,.12,'triangle',.06);tone(760,.08,'sine',.018,.025)}
  if(kind==='four'){tone(520,.18,'triangle',.035);tone(660,.2,'triangle',.03,.12);tone(785,.28,'triangle',.025,.23)}
  if(kind==='six'){[523,659,784,1047].forEach((f,i)=>tone(f,.38,'triangle',.035,i*.09));}
  if(kind==='wicket'){tone(250,.2,'square',.025);tone(165,.36,'triangle',.04,.15)}
  if(kind==='dot'){tone(270,.07,'sine',.012)}
  if(kind==='cheer')crowdCheer();
}
function musicLoop(){if(!soundOn)return;ensureAudio();if(!audio)return;[392,494,587,494].forEach((n,i)=>tone(n,.22,'sine',.007,i*.2));musicTimer=setTimeout(musicLoop,3600)}
$('#sound-toggle').addEventListener('click',()=>{
  soundOn=!soundOn;$('#sound-toggle').setAttribute('aria-pressed',String(soundOn));$('.sound-label').textContent=soundOn?'SOUND ON':'SOUND OFF';$('.sound-icon').textContent=soundOn?'♫':'♪';
  if(soundOn){ensureAudio();startCrowd();clearTimeout(musicTimer);musicLoop();showToast('Crowd ambience and cricket sounds are on.');}else{clearTimeout(musicTimer);stopCrowd();showToast('Crowd and sound effects off.');}
});
document.querySelectorAll('.segment').forEach(b=>b.addEventListener('click',()=>setFormat(b.dataset.format)));
$('#squad-toggle').addEventListener('click',e=>{women=!women;e.currentTarget.setAttribute('aria-pressed',String(women));updateTeamVisuals();showToast(`${women?'Women’s':'Men’s'} squads selected — same classic game, all our players.`)});
els.home.addEventListener('change',updateTeamVisuals);els.away.addEventListener('change',updateTeamVisuals);
els.start.addEventListener('click',setupMatch);els.next.addEventListener('click',beginSecondInnings);
window.addEventListener('keydown',e=>{
  if(e.repeat||!match||match.phase!=='batting')return;
  const key={'1':'defend','2':'drive','3':'loft'}[e.key];if(key)playShot(key);
});
renderTeams(false);
