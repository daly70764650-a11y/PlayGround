const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const evidence = {
  watch: {title:'The stopped watch',type:'PHYSICAL EVIDENCE',icon:'◷',where:'COMPARTMENT 4 · TABLE',text:'Vale’s watch stopped at 9:17. The face is cracked, but the hands were set back deliberately; the break itself came later. Somebody wanted the time of death to look uncertain.'},
  tea: {title:'Untouched tea',type:'PHYSICAL EVIDENCE',icon:'♨',where:'COMPARTMENT 4 · CUP',text:'The tea is still warm, barely sipped. A smear of lipstick is absent from the rim. Vale did not settle in for a quiet nightcap—and the cup was placed here after the argument.'},
  letter: {title:'The torn letter',type:'DOCUMENT',icon:'✉',where:'COMPARTMENT 4 · COAT POCKET',text:'A half-burned letter, folded small enough to hide in a coat lining. “...the certificate was never filed. You said no one could trace it. Pay by Darwin or I tell the board what happened to Dr Hart’s patient.” Signed G. Vale.'},
  thread: {title:'Blue silk thread',type:'TRACE EVIDENCE',icon:'⌁',where:'COMPARTMENT 4 · DOOR SEAM',text:'One strand of blue silk caught on the inside latch. The tear is fresh. It is the same vivid blue as Dr Hart’s scarf, which has a newly frayed end.'},
  log: {title:'Mara’s service log',type:'TIMELINE',icon:'▤',where:'DINING CAR · SERVICE DESK',text:'Mara logged tea to Vale at 9:08, then a late dinner for Dr Hart at 9:22. Her neat hand leaves no room for doubt: Hart was not in the dining car at 9:08, despite what he told you.'},
  nell: {title:'Nell’s vestibule sighting',type:'WITNESS STATEMENT',icon:'◉',where:'DINING CAR · WINDOW SEAT',text:'Nell heard Vale say, “You told me it was destroyed.” A minute later she saw Hart leave the dining car toward the sleeping cars. She kept quiet because she was in the vestibule herself, smoking where she shouldn’t.'},
  dust: {title:'Red dust on a boot',type:'COUNTRY / TRACE',icon:'⌖',where:'REAR VESTIBULE · FLOOR',text:'A clean-edged boot print in the vestibule dust. The fine red grit is mixed with pale crushed quartz from the water stop’s service siding—not the grey station platform. Someone stepped down there after the train pulled out.'},
  latch: {title:'The brass service latch',type:'MECHANISM',icon:'⚿',where:'REAR VESTIBULE · DOOR',text:'The service door was opened and closed from outside. A blue silk fibre is wedged under the brass lip. No locked-room trick: the killer used the narrow vestibule between cars, then came back in.'}
};

const scenes = {
  compartment: {
    label:'SLEEPING CAR · COMPARTMENT 4',title:'A quiet carriage',kicker:'THE DISCOVERY',caption:'The train rolls north through a darkening stretch of Country.',journal:'Somebody on this train knows more than they’re saying. Start with what the room can tell you.',
    hotspots:[{id:'watch',name:'Stopped watch',x:52,y:57},{id:'tea',name:'Tea cup',x:47,y:48},{id:'letter',name:'Coat pocket',x:76,y:62},{id:'thread',name:'Door latch',x:89,y:35}]
  },
  dining: {
    label:'DINING CAR · TABLE 6',title:'The dinner hour',kicker:'A STORY DOESN’T FIT',caption:'Cutlery rattles with every turn. A witness watches the dark glass instead of her plate.',journal:'Mara’s tidy service log and Nell’s half-told story may pin down the missing minutes.',
    hotspots:[{id:'log',name:'Service log',x:24,y:61},{id:'nell',name:'Nell’s table',x:76,y:55}]
  },
  vestibule: {
    label:'REAR VESTIBULE · BETWEEN CARS',title:'The narrow passage',kicker:'THE TRAIN REMEMBERS',caption:'Wind finds the gap between carriages. Fine red grit has gathered where the floor should be clean.',journal:'Country leaves its mark differently from a station platform. The dust tells you where a boot has been.',
    hotspots:[{id:'dust',name:'Boot print',x:45,y:76},{id:'latch',name:'Service latch',x:79,y:43}]
  }
};
const people = [
  {id:'mara',name:'Mara Venn',role:'SLEEPING-CAR STEWARD',initials:'MV',description:'Steady, observant, and keen to keep the night running on schedule.'},
  {id:'nell',name:'Nell Armitage',role:'TRAVELLING MUSICIAN',initials:'NA',description:'A sharp-eyed passenger travelling north with a battered instrument case.'},
  {id:'hart',name:'Dr Elias Hart',role:'RAILWAY PHYSICIAN',initials:'EH',description:'Polished manners, a blue silk scarf, and a story that changes by the minute.'}
];
const state={started:false,location:'compartment',found:new Set(),interviewed:new Set(),tab:'evidence',voice:false,sound:false,modalOpen:false,accomplished:false};

function initSceneArt(){
  const art=$('#sceneArt');
  art.innerHTML='<div class="window"></div><div class="sconce"></div><div class="lamp"></div><div class="bench"></div><div class="table"></div><div class="cup"></div><div class="silhouette"></div>';
}
function startGame(){
  state.started=true;$('#introScreen').classList.add('hidden');$('#gameScreen').classList.remove('hidden');initSceneArt();renderScene();renderEvidence();renderPeople();updateProgress();showToast('CASE OPENED · THE GHAN, NIGHT 1');
}
function renderScene(){
  const data=scenes[state.location];
  $('#sceneLabel').textContent=data.label;$('#chapterTitle').textContent=data.title;$('#chapterKicker').textContent=data.kicker;$('#sceneCaption').textContent=data.caption;$('#journalText').textContent=data.journal;
  $('#sceneArt').className='scene-art '+(state.location==='dining'?'art-dining':state.location==='vestibule'?'art-vestibule':'');
  $('#sceneArt').innerHTML='<div class="window"></div><div class="sconce"></div><div class="lamp"></div><div class="bench"></div><div class="table"></div><div class="cup"></div><div class="silhouette"></div>';
  $('#hotspots').innerHTML='';data.hotspots.forEach(h=>{
    const button=document.createElement('button');button.className='hotspot'+(state.found.has(h.id)?' done':'');button.style.left=`${h.x}%`;button.style.top=`${h.y}%`;button.setAttribute('aria-label',`${h.name}${state.found.has(h.id)?' (examined)':''}`);button.innerHTML=`${state.found.has(h.id)?'✓':'+'}<span class="hotspot-tip">${h.name.toUpperCase()}</span>`;button.addEventListener('click',()=>inspect(h.id));$('#hotspots').appendChild(button);
  });
  $$('.location-button').forEach(b=>b.classList.toggle('active',b.dataset.location===state.location));
  const foundHere=data.hotspots.filter(h=>state.found.has(h.id)).length;$('#noteCount').textContent=`ENTRY 0${Math.min(3,foundHere+1)}`;
  $('#chapterNumber').textContent=state.location==='compartment'?'01':state.location==='dining'?'02':'03';
  $('#progressLabel').textContent=`${state.found.size} / 8 CLUES`;$('#progressFill').style.width=`${state.found.size/8*100}%`;
}
function renderLocations(){
  const opts=[['compartment','▣','SLEEPING CAR'],['dining','♜','DINING CAR'],['vestibule','⌁','VESTIBULE']];
  $('#locationButtons').innerHTML=opts.map(([id,icon,label])=>`<button class="location-button ${state.location===id?'active':''}" data-location="${id}"><i>${icon}</i>${label}</button>`).join('');
  $$('.location-button').forEach(b=>b.addEventListener('click',()=>{state.location=b.dataset.location;renderScene();playTone(360,.07)}));
}
function inspect(id){
  if(state.found.has(id)){openEvidence(id);return;}
  state.found.add(id);renderScene();renderEvidence();updateProgress();playTone(620,.12);
  const item=evidence[id];
  showModal(`<div class="modal-kicker">${item.type} · ${item.where}</div><h2>${item.title}</h2><p>${item.text}</p><div class="modal-meta"><span>FIELD NOTES · J. MARR</span><span>EVIDENCE ${String(state.found.size).padStart(2,'0')}</span></div><div class="modal-actions"><button class="primary-button" id="modalDone">ADD TO CASE FILE <span>→</span></button></div>`,()=>$('#modalContent').querySelector('#modalDone')?.addEventListener('click',closeModal),item.text);
  if(state.found.size===5)showToast('NEW LEAD · YOUR DEDUCTION BOARD IS NEARLY READY');
}
function openEvidence(id){const item=evidence[id];showModal(`<div class="modal-kicker">${item.type} · ${item.where}</div><h2>${item.title}</h2><p>${item.text}</p><div class="modal-meta"><span>REVISIT FIELD NOTE</span><span>IN THE CASE FILE</span></div><div class="modal-actions"><button class="secondary-button" id="modalDone">CLOSE NOTE</button></div>`,()=>$('#modalContent').querySelector('#modalDone')?.addEventListener('click',closeModal),item.text);}
function renderEvidence(){
  $('#evidenceCount').textContent=state.found.size;$('#evidenceEmpty').classList.toggle('hidden',state.found.size>0);
  $('#evidenceList').innerHTML=[...state.found].map(id=>{const e=evidence[id];return `<button class="evidence-item" data-evidence="${id}"><span class="evidence-icon">${e.icon}</span><span><b>${e.title}</b><small>${e.type}</small></span><span class="check">✓</span></button>`}).join('');
  $$('.evidence-item').forEach(b=>b.addEventListener('click',()=>openEvidence(b.dataset.evidence)));
}
function renderPeople(){
  $('#peopleList').innerHTML=people.map(p=>`<button class="person-item ${state.interviewed.has(p.id)?'interviewed':''}" data-person="${p.id}"><span class="person-avatar">${p.initials}</span><span><b>${p.name}</b><small>${p.role}</small></span><span class="person-status">${state.interviewed.has(p.id)?'✓':'›'}</span></button>`).join('');
  $$('.person-item').forEach(b=>b.addEventListener('click',()=>interview(b.dataset.person)));
}
function interview(id){
  const p=people.find(x=>x.id===id);let content='';let voiceText='';
  if(id==='mara'){
    content=state.interviewed.has(id)?`<div class="modal-kicker">FOLLOW-UP · CREW STATEMENT</div><h2>Mara Venn</h2><p>“I’ve given you the service times. I didn’t see who went in or out, but that log is mine. I don’t make mistakes with the hour.”</p><p>She glances at her notebook, then meets your eyes. Her account has stayed consistent.</p>`:`<div class="modal-kicker">INTERVIEW · SLEEPING-CAR STEWARD</div><h2>Mara Venn</h2><p>“I found Mr Vale at 9:24. The tea I took in at 9:08 was still on the table. Dr Hart told me he’d been in the dining car since a quarter past nine.”</p><p>Her service log tells a different story. She had no reason to invent the time—and the tea was hardly touched.</p><div class="quote">“The little details keep a train on the rails. The big ones keep people honest.”</div>`;
    voiceText='I found Mr Vale at nine twenty-four. The tea I took in at nine oh eight was still on the table. Doctor Hart told me he had been in the dining car since a quarter past nine.';
  } else if(id==='nell'){
    content=state.interviewed.has(id)?`<div class="modal-kicker">FOLLOW-UP · PASSENGER STATEMENT</div><h2>Nell Armitage</h2><p>“I should have spoken sooner. I was breaking the smoking rules. But I heard Vale say the certificate was never filed. Then Hart came through, fast as a storm.”</p><p>She watches the passing dark, guilt loosening her shoulders.</p>`:`<div class="modal-kicker">INTERVIEW · PASSENGER</div><h2>Nell Armitage</h2><p>“I heard Mr Vale say, ‘You told me it was destroyed.’ It was just after nine. Then Dr Hart left the dining car towards the sleeping cars.”</p><p>She hesitates. “I was in the vestibule, having a smoke. I know I shouldn’t have been. I didn’t want the steward to know.”</p><div class="quote">“A lie is often just a truth that’s frightened of the company it keeps.”</div>`;
    voiceText='I heard Mr Vale say, You told me it was destroyed. It was just after nine. Then Doctor Hart left the dining car towards the sleeping cars.';
  } else {
    content=state.interviewed.has(id)?`<div class="modal-kicker">FOLLOW-UP · PERSON OF INTEREST</div><h2>Dr Elias Hart</h2><p>“I’ve said all I can. My dinner was late. I suppose the steward has a log to prove it.”</p><p>His fingers find the frayed edge of his blue scarf. For the first time, he has nothing ready to say.</p>`:`<div class="modal-kicker">INTERVIEW · RAILWAY PHYSICIAN</div><h2>Dr Elias Hart</h2><p>“I was in the dining car all evening. Vale was a difficult man, but I had no reason to see him tonight.” He smooths the cuff of his jacket.</p><p>“A doctor learns to keep his hands steady.” The blue silk scarf at his collar has a fresh, ragged tear.</p><div class="quote">His account is polished. Maybe too polished.</div>`;
    voiceText='I was in the dining car all evening. Vale was a difficult man, but I had no reason to see him tonight.';
  }
  if(!state.interviewed.has(id)){state.interviewed.add(id);renderPeople();updateProgress();}
  showModal(`${content}<div class="modal-meta"><span>${p.role}</span><span>STATEMENT RECORDED</span></div><div class="modal-actions"><button class="primary-button" id="modalDone">RETURN TO CASE <span>→</span></button></div>`,()=>$('#modalContent').querySelector('#modalDone')?.addEventListener('click',closeModal),voiceText);
  if(state.interviewed.size===3)showToast('ALL PASSENGERS QUESTIONED · DEDUCTION BOARD AVAILABLE');
}
function updateProgress(){
  $('#progressLabel').textContent=`${state.found.size} / 8 CLUES`;
  const ready=state.found.size>=5&&state.interviewed.size===3;
  $('#deduceLocked').classList.toggle('hidden',ready);$('#deduceForm').classList.toggle('hidden',!ready);$('#deduceLock').textContent=ready?'✓':'•';
  $('#unlockProgress').textContent=`${Math.min(state.found.size,5)} / 5 clues · ${state.interviewed.size} / 3 interviews`;
  $('#unlockBar').style.width=`${Math.min(state.found.size,5)/5*100}%`;
  $('#progressFill').style.width=`${state.found.size/8*100}%`;
}
function changeTab(tab){state.tab=tab;$$('.side-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.tab-panel').forEach(p=>p.classList.remove('active'));$(`#${tab}Panel`).classList.add('active');if(tab==='deduce'&&state.found.size<5)$('#unlockProgress').scrollIntoView?.({block:'nearest'});}
function accuse(){
 const motive=$('#motiveSelect').value,opportunity=$('#opportunitySelect').value,method=$('#methodSelect').value;
 if(!motive||!opportunity||!method){$('#deduceHint').textContent='Complete all three parts of your case before you accuse anyone.';playTone(180,.13);return;}
 const correct=motive==='blackmail'&&opportunity==='nell'&&method==='thread';
 if(correct){winGame();return;}
 let hint='';
 if(motive!=='blackmail')hint='The missing valuables are a distraction. The torn letter gives a reason.';
 else if(opportunity!=='nell')hint='The stopped watch was tampered with. Nell puts Hart in the right place at the right time.';
 else hint='The red dust tells you where someone walked, but the silk ties the killer to the door.';
 $('#deduceHint').textContent=hint;$('#deduceHint').style.color='#a34f39';showToast('THE THEORY DOESN’T HOLD · LOOK AGAIN');playTone(190,.16);
}
function winGame(){
 state.accomplished=true;$('#gameScreen').classList.add('hidden');const end=$('#endingScreen');end.classList.remove('hidden');end.innerHTML=`<div class="ending-art"></div><div class="ending-copy"><div class="ending-kicker">FIELD NOTES · CASE 01 CLOSED</div><h2>The land<br>keeps <em>its own time.</em></h2><p>Jonah lays the torn letter, Mara’s log, and the blue silk fibre side by side. Hart’s story finally runs out of track. At the next stop, he is taken into custody. The envelope he stole is found in his case: proof that Vale had been blackmailing him over a falsified medical certificate.</p><p>Later, as dawn opens over the red ranges, Jonah steps down to call his sister. The country is not a clue to be solved. It is home—full of memory, relation, and stories that continue long after this case is closed.</p><p>He listens to the wind in the scrub a moment longer, then climbs back aboard.</p><button class="primary-button" id="restartButton">PLAY THE CASE AGAIN <span>↻</span></button><div class="ending-credit">SENIOR DETECTIVE JONAH MARR · FIRST NATIONS · 42<br>A FICTIONAL MYSTERY · CREATED WITH RESPECT FOR COUNTRY</div></div>`;$('#restartButton').addEventListener('click',()=>location.reload());playTone(520,.3);
}
function showModal(html,after='',voiceText=''){
 $('#modalContent').innerHTML=html;$('#modalBackdrop').classList.remove('hidden');state.modalOpen=true;
 if(typeof after==='function')after();if(state.voice&&voiceText)speak(voiceText);
}
function closeModal(){ $('#modalBackdrop').classList.add('hidden');state.modalOpen=false;if('speechSynthesis'in window)speechSynthesis.cancel(); }
function showToast(message){const t=$('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(showToast.timeout);showToast.timeout=setTimeout(()=>t.classList.remove('visible'),2400);}
function speak(text){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.rate=.9;u.pitch=.92;u.volume=.85;speechSynthesis.speak(u);}
let audioContext=null,ambienceNodes=[];
function playTone(freq=440,duration=.08){if(!state.sound)return;try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.055,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch(e){}}
function setSound(on){state.sound=on;$('#soundButton').innerHTML=`♫ <span>SOUND ${on?'ON':'OFF'}</span>`;$('#soundButton').classList.toggle('enabled',on);if(on){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();const osc=audioContext.createOscillator(),gain=audioContext.createGain(),filter=audioContext.createBiquadFilter();osc.type='triangle';osc.frequency.value=47;filter.type='lowpass';filter.frequency.value=110;gain.gain.value=.012;osc.connect(filter);filter.connect(gain);gain.connect(audioContext.destination);osc.start();ambienceNodes=[osc,gain,filter];playTone(390,.1);}catch(e){showToast('SOUND IS NOT AVAILABLE IN THIS BROWSER');}}else{if(ambienceNodes[0]){try{ambienceNodes[1].gain.setTargetAtTime(0,audioContext.currentTime,.1);ambienceNodes[0].stop(audioContext.currentTime+.5);}catch(e){}}ambienceNodes=[];}}
function help(){showModal(`<div class="modal-kicker">FIELD GUIDE · HOW TO PLAY</div><h2>Observe before you decide.</h2><p><b>Search:</b> Tap every glowing marker in each carriage. Examine objects closely and add useful findings to the case file.</p><p><b>Interview:</b> Open the People tab and speak with all three passengers. Revisit them if you need to hear their account again.</p><p><b>Deduce:</b> Collect at least five clues and question everyone to unlock the deduction board. Choose a motive, opportunity, and physical clue that fit together.</p><p><b>Controls:</b> Everything works with touch, mouse, or keyboard. Sound effects and browser-spoken dialogue are optional.</p><div class="modal-actions"><button class="primary-button" id="modalDone">UNDERSTOOD <span>→</span></button></div>`,()=>$('#modalContent').querySelector('#modalDone').addEventListener('click',closeModal));}
$('#beginButton').addEventListener('click',()=>{renderLocations();startGame();});
$('#soundButton').addEventListener('click',()=>setSound(!state.sound));
$('#voiceButton').addEventListener('click',()=>{state.voice=!state.voice;$('#voiceButton').innerHTML=`◖ <span>VOICE ${state.voice?'ON':'OFF'}</span>`;if(!state.voice&&'speechSynthesis'in window)speechSynthesis.cancel();else if(state.voice)showToast('SPOKEN DIALOGUE ENABLED · BROWSER VOICE');});
$('#helpButton').addEventListener('click',help);$('#modalClose').addEventListener('click',closeModal);$('#modalBackdrop').addEventListener('click',e=>{if(e.target===$('#modalBackdrop'))closeModal()});$$('.side-tab').forEach(b=>b.addEventListener('click',()=>changeTab(b.dataset.tab)));$('#accuseButton').addEventListener('click',accuse);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.modalOpen)closeModal();});
