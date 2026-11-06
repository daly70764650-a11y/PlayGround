(() => {
  const SAVE_KEY = 'songtrail-pocket-wilds-v1';
  const pages = ['HOME', 'CARE', 'TRAIL', 'BATTLE'];
  const creatureForms = [
    { name: 'Dustkip', stage: 'ROOKIE', kind: 'Bilby', level: 1 },
    { name: 'Redridge Rumbler', stage: 'CHAMPION', kind: 'Wombat', level: 2 },
    { name: 'Gumtree Guardian', stage: 'ULTIMATE', kind: 'Kookaburra', level: 3 }
  ];
  const careTasks = [
    { key: 'feed', icon: '✳', title: 'Share bush berries', desc: 'A little snack for the long track.', action: 'feed' },
    { key: 'play', icon: '⌁', title: 'Play a call-and-response', desc: 'Trade silly sounds and lift their spirits.', action: 'play' },
    { key: 'rest', icon: '☾', title: 'Rest in the shade', desc: 'A quiet moment restores travelling energy.', action: 'rest' }
  ];
  const initialState = () => ({
    name: 'Dustkip', species: 'bilby', stage: 0, special: false,
    hunger: 72, joy: 70, energy: 78, health: 100, bond: 12, xp: 0,
    age: 0, shards: 0, tracks: 0, victories: 0, lastSaved: Date.now(), lastAlert: '',
    journal: 'The red-dirt trail is quiet. Your new friend is ready to explore.'
  });
  let state;
  try { state = { ...initialState(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; }
  catch { state = initialState(); }
  let page = 0, careFocus = 0, audioOn = true, audioContext = null, toastTimer;
  const $ = id => document.getElementById(id);
  const view = $('view'), toast = $('toast');
  const clamp = n => Math.max(0, Math.min(100, Math.round(n)));
  const creature = () => creatureForms[Math.min(state.stage, 2)];
  const isLow = () => state.hunger < 25 || state.joy < 25 || state.energy < 20 || state.health < 35;
  const percentBar = n => `<span class="meter">${Array.from({length:5}, (_,i)=>`<i class="${n >= (i+1)*20 ? '' : 'empty'}"></i>`).join('')}</span>`;
  function persist() { state.lastSaved = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  function chirp(freq=560, duration=.08, type='square') {
    if (!audioOn) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const osc = audioContext.createOscillator(), gain = audioContext.createGain();
      osc.type = type; osc.frequency.value = freq; gain.gain.setValueAtTime(.035, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      osc.connect(gain); gain.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + duration);
    } catch { /* Audio is an optional enhancement. */ }
  }
  function notify(message, urgent=false) {
    toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
    if (urgent) { chirp(250,.22); chirp(205,.22); }
  }
  function art() {
    const special = state.special;
    const fur = special ? '#d9bd74' : '#9a6849', shade = special ? '#a98148' : '#6b4a3e';
    const cream = special ? '#fff1bb' : '#e5c998', inner = '#78514a';
    let body;
    if (state.stage === 0) body = `<g class="pixel"><ellipse cx="80" cy="105" rx="41" ry="29" fill="${fur}"/><ellipse cx="77" cy="111" rx="26" ry="17" fill="${cream}"/><ellipse cx="111" cy="86" rx="25" ry="23" fill="${fur}"/><path d="M94 69 Q79 8 88 16 Q101 15 105 67Z" fill="${fur}"/><path d="M98 62 Q90 30 91 25 Q96 27 101 62Z" fill="${cream}"/><path d="M113 65 Q130 17 135 26 Q138 37 124 72Z" fill="${fur}"/><path d="M122 64 Q131 39 134 34 Q135 48 126 67Z" fill="${cream}"/><ellipse cx="133" cy="97" rx="8" ry="5" fill="${shade}"/><rect x="99" y="83" width="4" height="4" fill="#263a30"/><rect x="116" y="81" width="4" height="4" fill="#263a30"/><path d="M46 107 Q19 94 27 78 Q43 83 52 96" fill="none" stroke="${shade}" stroke-width="6"/><path d="M53 125l-8 9h15l4-7m28 0 2 7h15l-6-10" fill="${shade}"/><path d="M68 97h6m-2-3v6" stroke="${cream}" stroke-width="2"/></g>`;
    if (state.stage === 1) body = `<g class="pixel"><ellipse cx="79" cy="103" rx="50" ry="34" fill="${fur}"/><ellipse cx="77" cy="111" rx="31" ry="19" fill="${cream}"/><circle cx="111" cy="83" r="24" fill="${fur}"/><circle cx="102" cy="62" r="10" fill="${shade}"/><circle cx="123" cy="62" r="10" fill="${shade}"/><circle cx="102" cy="62" r="5" fill="${cream}"/><circle cx="123" cy="62" r="5" fill="${cream}"/><ellipse cx="131" cy="91" rx="9" ry="6" fill="${shade}"/><rect x="105" y="78" width="4" height="4" fill="#263a30"/><rect x="120" y="78" width="4" height="4" fill="#263a30"/><path d="M39 119l-5 15h18l5-12m43 0 7 12h17l-7-17" fill="${shade}"/><path d="M48 85q-13 11-2 22m77-27 13-7m-13 17 17 1m-21 7 14 9" fill="none" stroke="${cream}" stroke-width="3"/><path d="M72 71l7-10 7 10m-5-7 7-6 7 9" fill="none" stroke="${special?'#f8eab2':shade}" stroke-width="4"/></g>`;
    if (state.stage === 2) body = `<g class="pixel"><path d="M35 119Q35 75 78 79Q98 46 123 67Q141 83 130 116Q120 139 83 135Q52 137 35 119Z" fill="${fur}"/><ellipse cx="83" cy="115" rx="29" ry="15" fill="${cream}"/><path d="M89 70Q79 29 89 18Q102 27 103 69Z" fill="${fur}"/><path d="M98 68Q106 28 120 25Q127 41 110 75Z" fill="${shade}"/><path d="M93 57L95 28M107 61l9-27" stroke="${cream}" stroke-width="4"/><ellipse cx="125" cy="90" rx="11" ry="7" fill="${shade}"/><rect x="105" y="78" width="5" height="5" fill="#263a30"/><path d="M45 119l-7 17h17l6-14m48 0 8 14h16l-7-18" fill="${shade}"/><path d="M45 90q-19-9-24-21m18 33-22-3m34 24-19 9m72-39 17-11m-16 22 21 3m-31 16 17 14" stroke="${special?'#f8eab2':cream}" stroke-width="3"/><path d="M72 74l6-10 6 8 8-11 7 8" fill="none" stroke="${special?'#f8eab2':shade}" stroke-width="4"/></g>`;
    return `<svg class="creature-art ${state.special?'special':''}" viewBox="0 0 160 155" aria-label="${creature().kind} creature illustration" role="img"><g opacity=".4" fill="#6e815a"><circle cx="32" cy="122" r="2"/><circle cx="135" cy="120" r="2"/><path d="M27 130h8l-3-7zm97 1h8l-2-7z"/></g>${body}${special?'<g fill="#f8edb7"><path d="M57 67l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M137 49l2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/><circle cx="43" cy="68" r="2"/></g>':''}</svg>`;
  }
  function renderHome() {
    const bars = [['FOOD',state.hunger],['JOY',state.joy],['ENERGY',state.energy],['HEART',state.health]];
    view.innerHTML = `<div class="home-view"><div class="creature-name">${state.name}</div><div class="stage-label">${state.special?'✦ STAR-TRACED ':''}${creature().stage} · ${creature().kind}</div>${art()}<div class="mood">${moodText()}</div><div class="stats">${bars.map(([label,val])=>`<div class="stat"><span class="stat-label">${label}</span>${percentBar(val)}<span class="stat-num">${val}</span></div>`).join('')}</div></div>`;
  }
  function moodText() {
    if (state.health < 35) return '♥ NEEDS A GENTLE CHECK-IN';
    if (state.hunger < 25) return '… TUMMY RUMBLES';
    if (state.energy < 20) return '☾ READY FOR A NAP';
    if (state.joy < 25) return '⌁ MISSING YOUR COMPANY';
    if (state.joy > 80 && state.health > 65) return '✦ FEELING WILD & FREE';
    return '♡ HAPPY TO BE HERE';
  }
  function renderCare() {
    view.innerHTML = `<div class="page-content"><h3 class="page-title">A little care goes a long way</h3><p class="page-copy">Pick a moment together. A/C choose · B gives care.</p>${careTasks.map((task,i)=>`<div class="task-card" style="${i===careFocus?'outline:2px solid #405943;outline-offset:-2px':''}"><div class="task-icon">${task.icon}</div><div><div class="task-title">${task.title}</div><div class="task-desc">${task.desc}</div></div><div class="task-tag">${i===careFocus?'◀':''}</div></div>`).join('')}<button class="action-button" data-action="care">B · ${careTasks[careFocus].title.toUpperCase()}</button><div class="hint">TAKE IT SLOW—A NAP IS CARE TOO.</div></div>`;
    view.querySelector('[data-action]')?.addEventListener('click', () => doCare(careFocus));
  }
  function renderTrail() {
    view.innerHTML = `<div class="page-content"><h3 class="page-title">Follow a new track</h3><p class="page-copy">The bush is full of little discoveries. Wander together, then rest if you need to.</p><div class="task-card"><div class="task-icon">⌁</div><div><div class="task-title">Listen for the wind-path</div><div class="task-desc">A short, safe outing. You may find a keepsake.</div></div><div class="task-tag">GO</div></div><div class="trail-collect"><span>FOUND TRACKS</span><b>${state.tracks}</b><span>✦ ECHO SHARDS</span><b>${state.shards}/3</b></div><button class="action-button" data-action="trail">B · SET OUT TOGETHER</button><div class="hint">GOOD COMPANY MAKES THE BEST MAP.</div></div>`;
    view.querySelector('[data-action]')?.addEventListener('click', explore);
  }
  function renderBattle() {
    const rivals = ['Thistle Hopper','Creekside Skink','Bramble Bandicoot'];
    const opponent = rivals[Math.min(2, Math.floor(state.victories/2))];
    view.innerHTML = `<div class="page-content"><h3 class="page-title">Friendly bush challenge</h3><p class="page-copy">A playful test of courage—not a fight to the finish.</p><div class="battle-box"><div class="battle-title">TODAY'S CHALLENGER</div><div class="opponent"><span>${state.name} · ${creature().stage}</span><span>VS</span><span>${opponent} <span class="opponent-art">${['✿','◉','❋'][Math.min(2,Math.floor(state.victories/2))]}</span></span></div><div class="battle-log">${state.journal}</div></div><div class="trail-collect"><span>WINS</span><b>${state.victories}</b><span>GROWTH</span><b>${state.xp} XP</b></div><button class="action-button" data-action="battle" ${state.energy<15||state.health<20?'disabled':''}>B · ${state.energy<15||state.health<20?'REST BEFORE A MATCH':'TRY A FRIENDLY MATCH'}</button><div class="hint">A BRAVE TRY IS A WIN, EITHER WAY.</div></div>`;
    view.querySelector('[data-action]')?.addEventListener('click', battle);
  }
  function render() {
    $('tabs').innerHTML = pages.map((p,i)=>`<button role="tab" aria-selected="${i===page}" class="tab ${i===page?'active':''}" data-page="${i}">${p}</button>`).join('');
    $('tabs').querySelectorAll('[data-page]').forEach(btn => btn.addEventListener('click', () => { page=+btn.dataset.page; chirp(520,.05); render(); }));
    if(page===0) renderHome(); else if(page===1) renderCare(); else if(page===2) renderTrail(); else renderBattle();
    updateSide();
    const urgent = isLow(); $('device').classList.toggle('alerting',urgent);
    $('statusLine').textContent = urgent ? 'HEY, A FRIEND NEEDS YOU' : ['A SMALL FRIEND IS WAITING','CARE MAKES THE TRAIL','WANDER AT YOUR OWN PACE','FRIENDLY MATCHES ONLY'][page];
    document.title = urgent ? '♥ Check in with your wildling — Songtrail' : 'Songtrail — Pocket Wilds';
  }
  function updateSide() {
    $('sideName').textContent = state.name;
    const years = Math.floor(state.age/24), days = state.age%24;
    $('fieldNotes').innerHTML = `<div class="note-grid"><div><div class="note-label">CURRENT FORM</div><div class="note-value">${creature().stage} ${state.special?'✦':''}</div></div><div><div class="note-label">TRAIL AGE</div><div class="note-value">DAY ${Math.max(1,Math.floor(state.age/4)+1)}</div></div><div><div class="note-label">KIND</div><div class="note-value">${creature().kind}</div></div><div><div class="note-label">GOOD TIMES</div><div class="note-value">${state.victories} wins · ${state.tracks} tracks</div></div></div><div class="bond-wrap"><div class="bond-head"><span>YOUR BOND</span><span>${state.bond}%</span></div><div class="bond-meter"><span style="width:${state.bond}%"></span></div></div>`;
  }
  function care(task) {
    const before = isLow();
    if(task==='feed') { state.hunger=clamp(state.hunger+30); state.joy=clamp(state.joy+3); state.journal='A snack break, and a happy little nose twitch.'; notify('Berry break! Tummies feel better.'); chirp(700,.09); }
    if(task==='play') { state.joy=clamp(state.joy+24); state.bond=clamp(state.bond+6); state.energy=clamp(state.energy-4); state.journal='You answered each other with silly little calls.'; notify('Your call-and-response made them beam.'); chirp(740,.07); setTimeout(()=>chirp(900,.1),90); }
    if(task==='rest') { state.energy=clamp(state.energy+30); state.health=clamp(state.health+8); state.journal='A quiet nap beneath the gum leaves did wonders.'; notify('A lovely shady nap.'); chirp(450,.14,'sine'); }
    state.bond=clamp(state.bond+2); persist(); render(); maybeEvolve();
  }
  function doCare(i) { care(careTasks[i].action); }
  function explore() {
    if(state.energy<12) { notify('They are too tired to wander. Try a shady rest first.',true); return; }
    const roll=Math.random(); state.tracks++; state.energy=clamp(state.energy-13); state.hunger=clamp(state.hunger-7); state.joy=clamp(state.joy+6); state.bond=clamp(state.bond+4);
    if(roll<.68) { state.shards++; state.journal='You found a bright echo-shard tucked beside the track.'; notify('A tiny echo-shard! ✦'); chirp(820,.13); }
    else if(roll<.84) { state.hunger=clamp(state.hunger+12); state.journal='A sweet bush treat turned up along the way.'; notify('A wild berry snack—what luck!'); }
    else { state.journal='You found fresh tracks and a lovely lookout over the plain.'; notify('New tracks added to your journal.'); chirp(600,.08); }
    if(state.shards>=3 && !state.special) { state.shards-=3; state.special=true; state.journal='Your keepsakes glimmered. A star-traced form has awakened!'; notify('SPECIAL FORM UNLOCKED · STAR-TRACED ✦'); }
    persist(); render();
  }
  function battle() {
    if(state.energy<15||state.health<20) return;
    state.energy=clamp(state.energy-12); state.hunger=clamp(state.hunger-6); state.joy=clamp(state.joy+5); state.bond=clamp(state.bond+4);
    const strength=state.health*.35+state.energy*.25+state.joy*.2+state.bond*.2+Math.random()*24;
    const foe=55+Math.min(28,state.victories*4);
    if(strength>=foe) {
      state.victories++; state.xp+=2; state.journal='A clever dodge and a friendly bow earned a cheer!'; state.health=clamp(state.health-3); notify('You won a friendly match! +2 growth'); chirp(850,.1); setTimeout(()=>chirp(1050,.16),110);
    } else {
      state.xp++; state.journal='That was close! You both learned a new trick.'; state.health=clamp(state.health-6); notify('Good try! You learned something (+1 growth).'); chirp(420,.12);
    }
    persist(); render(); maybeEvolve();
  }
  function maybeEvolve() {
    const thresholds=[0,3,10];
    if(state.stage<2 && state.age>=thresholds[state.stage+1] && state.bond>=35+state.stage*10 && state.xp>=state.stage+1) {
      state.stage++; state.name=creatureForms[state.stage].name; state.health=clamp(state.health+20); state.joy=clamp(state.joy+15);
      state.journal=`A warm glow, a brave leap—${state.name} has arrived!`;
      persist(); render(); notify(`EVOLUTION! ${state.name} is here! ✦`,true); chirp(900,.2); setTimeout(()=>chirp(1200,.25),180);
    }
  }
  function switchPage(direction) {
    if(page===1) careFocus=(careFocus+direction+careTasks.length)%careTasks.length;
    else page=(page+direction+pages.length)%pages.length;
    chirp(500,.045); render();
  }
  function activate() {
    if(page===0) { state.joy=clamp(state.joy+3); state.bond=clamp(state.bond+1); state.journal='You gave a little wave. They waved a tiny paw back.'; persist(); render(); notify('A little hello goes a long way.'); chirp(680,.07); }
    else if(page===1) doCare(careFocus);
    else if(page===2) explore();
    else battle();
  }
  $('prevBtn').addEventListener('click',()=>switchPage(-1));
  $('nextBtn').addEventListener('click',()=>switchPage(1));
  $('actBtn').addEventListener('click',activate);
  document.addEventListener('keydown',e=>{
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter'].includes(e.key)) e.preventDefault();
    if(e.key==='ArrowLeft'||e.key==='ArrowUp') switchPage(-1);
    if(e.key==='ArrowRight'||e.key==='ArrowDown') switchPage(1);
    if(e.key===' '||e.key==='Enter') activate();
  });
  $('soundToggle').addEventListener('click',()=>{audioOn=!audioOn;$('soundToggle').innerHTML=`♫ <span>${audioOn?'ON':'OFF'}</span>`;if(audioOn)chirp(700,.09)});
  $('resetBtn').addEventListener('click',()=>{if(confirm('Start a new field journal? This replaces your saved wildling with a new Dustkip.')){state=initialState();page=0;careFocus=0;persist();render();notify('A fresh trail begins. Hello, Dustkip!')}});
  function tick(elapsedMinutes=1) {
    if(elapsedMinutes<=0)return;
    const steps=Math.min(180,Math.floor(elapsedMinutes));
    const wasLow=isLow();
    state.hunger=clamp(state.hunger-steps*2.2); state.joy=clamp(state.joy-steps*1.1); state.energy=clamp(state.energy-steps*.7);
    if(state.hunger<25||state.joy<20||state.energy<18) state.health=clamp(state.health-steps*.65);
    else if(state.health<100) state.health=clamp(state.health+steps*.12);
    state.age+=steps/2;
    if(!wasLow && isLow()) { notify('Your wildling is calling for a check-in. They are safe—come say hello.',true); }
    else if(isLow() && Date.now()-(state.lastAlertAt||0)>90000) { state.lastAlertAt=Date.now(); notify('A small check-in would help your friend feel better.',true); }
    maybeEvolve(); persist(); render();
  }
  const offlineMinutes=Math.max(0,Math.min(180,(Date.now()-(state.lastSaved||Date.now()))/60000));
  if(offlineMinutes>=1) tick(offlineMinutes);
  render();
  setInterval(()=>tick(1),60000);
  setInterval(()=>{
    const d=new Date(); const day=Math.floor(state.age/4)+1;
    $('clock').textContent=`DAY ${String(day).padStart(2,'0')} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },1000);
})();
