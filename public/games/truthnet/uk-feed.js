// Deck lives in cards.json (D-SITE-091) so content scales without touching the engine.
// tactic taxonomy: ai | framing | context | numbers | outrage | scapegoat | urgency | system
//   Acts: 1 = provenance warm-up (KS1), 2 = framing (KS2), 3 = feeling/system (KS3).
const { createDeckRun, loadDeck } = window.TruthNet;
let feed = createDeckRun([]), measure = null;
const deckReady = loadDeck('/games/truthnet/cards.json')
  .then(d => { feed = createDeckRun(d.cards); measure = d.measure || null; return true; })
  .catch(error => {
    console.error(error);
    document.querySelector('.start p').textContent='Could not load the deck. Check your connection and refresh.';
    document.querySelector('.start .play').disabled=true;
    return false;
  });

let tokens=0, streak=0, unlockedSting=false, rugDone=false, creatorDone=false;
// C1 measurement state: phase 'pre' -> 'feed' -> 'post'; mScore holds the delta.
let phase='pre', mIdx=0;
const mScore = { pre:0, post:0 };
// per-tactic competence: correct calls clocked for each tactic (keys created on demand).
const competence = {};
// The system-level sting is gated on demonstrated competence with the FEELING-tier
// tactic family it explains — not tokens, not streak (brief: tactic-gated, "a few times").
const FEELING_TACTICS = ['system','outrage','scapegoat','urgency'];
const SYSTEM_GATE = 2;
const feelingScore = () => FEELING_TACTICS.reduce((s,t)=>s+(competence[t]||0),0);

// verify habit tracking for the end-screen stat
let vSeen=0, vChecked=0, verifiedThisCard=false;
// one-time intro the first time a checkable FEED card appears (Felix test: neither
// child found the button unprompted). The warm-up shows the button unexplained on
// purpose — unprompted checking there is baseline data, not a UX bug.
let verifyIntroDone=false;
// Measurement runs once per session: the pre/post delta only means something the
// first time (items aren't novel on a replay), so replays go straight to the feed.
let firstRun=true;

const stage=document.getElementById('stage');
const tokEl=document.getElementById('tok'), strkEl=document.getElementById('strk');
const controls=document.getElementById('controls'), hint=document.getElementById('hint');

// run progress: judged cards over the whole run (pre + feed + post)
function totalSteps(){ return feed.length + (firstRun && measure ? measure.pre.length + measure.post.length : 0); }
function updateProgress(done){
  if(!totalSteps()) return;
  const pct = Math.min(100, Math.round(done/totalSteps()*100)) + '%';
  const f=document.getElementById('pfill'); if(f) f.style.width = pct;
  const w=document.getElementById('pwalk'); if(w) w.style.left = pct;
}

function renderCard(){
  document.querySelectorAll('.card').forEach(c=>c.remove());
  if(!feed.current){ finishFeed(); return; }
  const c=feed.current;
  if(c.verify) vSeen++;
  const el=document.createElement('div');
  el.className='card'+(c.glow?' glow':'');
  el.innerHTML=`
    <div class="media"><span class="tag">${c.tag}</span><img class="photo" src="${c.img}" alt="">${c.arrow?'<span class="redarrow">↘</span>':''}</div>
    <div class="cap"><span class="handle">${c.handle}</span> ${c.cap}</div>
    <div class="meta"><span>♡ like</span><span>💬 comment</span><span>↗ share</span></div>
    <div class="swipeflash" id="flash"></div>
    ${c.verify?`
    <div class="vpanel" id="vpanel">
      <div class="vhead"><span class="dot"></span> SOURCE CHECK</div>
      <ul>${c.verify.lines.map(l=>'<li>'+l+'</li>').join('')}</ul>
      <button class="next" onclick="closeVerify()">Back</button>
    </div>`:''}
    ${c.verify && !verifyIntroDone?`
    <div class="vpanel show" id="vintro">
      <div class="vhead"><span class="dot"></span> THAT 🔍 BUTTON FROM THE WARM-UP?</div>
      <ul>
        <li>🔍 It peeks behind a post before you answer</li>
        <li>🪙 Right answer after checking = <b>double tokens</b></li>
        <li>🛡️ Get it wrong after checking? Your streak is safe</li>
      </ul>
      <div style="text-align:center;font-size:.8rem;opacity:.8;margin-top:10px">Look for this under the post:</div>
      <div style="display:flex;justify-content:center;margin:8px 0 2px"><span class="verifybtn">🔍 check source</span></div>
      <button class="next" onclick="closeVerifyIntro()">Got it</button>
    </div>`:''}
    <div class="reveal" id="reveal">
      <div class="verdict" id="verdict"></div>
      <div class="tn"><span class="dot"></span> TRUTHNET ANALYSIS</div>
      <div class="tell" id="tell"></div>
      <div class="award" id="award"></div>
      <button class="next" onclick="advance()">Next →</button>
    </div>`;
  stage.appendChild(el);
  controls.style.display='flex'; hint.style.display='block';
  // per-card question reframes the call: picture? framing? feeling?
  hint.textContent = c.question ? c.question + '  ·  tap to answer' : 'Trust your gut. Tap FAKE or REAL.';
  const vb=document.getElementById('verifybtn');
  if(c.verify){
    vb.textContent='🔍 check source'; vb.disabled=false; vb.classList.remove('done'); vb.classList.remove('pulse');
    setVerifyRow(true);
  } else setVerifyRow(false);
  updateProgress((firstRun && measure ? measure.pre.length : 0) + feed.index);
}

function setVerifyRow(show){
  document.getElementById('verifyrow').style.display = show ? 'flex' : 'none';
}

// Guardrail 1, promoted: verifying is a playable 5-second lateral-reading moment,
// available on every Act 2/3 card, and the scoring rewards the habit (see decide()).
function openVerify(){
  const p=document.getElementById('vpanel'); if(p) p.classList.add('show');
}
function closeVerifyIntro(){
  verifyIntroDone=true;
  const p=document.getElementById('vintro'); if(p) p.remove();
  const vb=document.getElementById('verifybtn'); if(vb) vb.classList.add('pulse');
  hint.textContent='Tap 🔍 check source — then call it.';
}
function closeVerify(){
  const p=document.getElementById('vpanel'); if(p) p.classList.remove('show');
  if(!verifiedThisCard){
    verifiedThisCard=true; vChecked++;
    const b=document.getElementById('verifybtn');
    if(b){ b.textContent='✓ checked'; b.disabled=true; b.classList.add('done'); }
    hint.textContent='Good — you checked before calling it. Now call it.';
  }
}

// truth takes three values (D-SITE-095): fake | real | unsure. 'unsure' marks a card
// where even checking settles nothing, and CAN'T TELL is the rewarded answer.
function flashFor(choice){
  return choice==='fake' ? 'linear-gradient(90deg, rgba(255,92,108,.5), transparent)'
       : choice==='real' ? 'linear-gradient(270deg, rgba(46,204,113,.5), transparent)'
       : 'radial-gradient(circle, rgba(255,211,78,.45), transparent)';
}
function decide(choice){
  if(phase!=='feed'){ measureDecide(choice); return; }
  const c=feed.current;
  const correct = choice===c.truth;
  const flash=document.getElementById('flash');
  flash.style.background = flashFor(choice);
  flash.style.opacity=1; setTimeout(()=>flash.style.opacity=0,180);

  const reveal=document.getElementById('reveal');
  const verdict=document.getElementById('verdict');
  const tell=document.getElementById('tell');
  const award=document.getElementById('award');

  if(correct){
    streak++;
    competence[c.tactic] = (competence[c.tactic]||0) + 1; // demonstrated competence with THIS tactic
    // Scoring rewards the process: a checked correct call is worth double a fast one.
    const gain = (verifiedThisCard?2:1) + (c.bonus?1:0);
    tokens += gain;
    verdict.textContent = c.truth==='unsure' ? '✓ Smart — not enough to go on' : '✓ Good call';
    verdict.className='verdict ok';
    tell.textContent=c.tellOk;
    award.textContent=`+${gain} token${gain>1?'s':''}`
      + (verifiedThisCard?' · checked first 🔍':'')
      + (c.bonus?' · BONUS':'')
      + `   🔥 streak ${streak}`;
  } else if(verifiedThisCard){
    // Right process, wrong call: the check IS the skill, so the streak survives.
    verdict.textContent = c.truth==='unsure' ? '✗ Nobody could know yet'
                        : choice==='unsure' ? '✗ The clues were there' : '✗ Got you';
    verdict.className='verdict no';
    tell.textContent=c.tellNo;
    award.textContent='Streak safe — you checked first. Right process, wrong call.';
  } else {
    streak=0;
    verdict.textContent = c.truth==='unsure' ? '✗ Nobody could know yet'
                        : choice==='unsure' ? '✗ The clues were there' : '✗ Got you';
    verdict.className='verdict no';
    tell.textContent=c.tellNo;
    award.textContent='Streak reset — but now you know the tell';
  }
  verifiedThisCard=false;
  tokEl.textContent='🪙 '+tokens; strkEl.textContent='🔥 '+streak;
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  reveal.classList.add('show');
}

function advance(){
  // The sting is ANCHORED to the giveaway card it explains (Felix test: firing on
  // family competence alone made it land two cards late, reading as random) and
  // still gated on feeling-tier competence. Act 3 puts the giveaway late enough
  // that the gate is normally met by the time it's judged.
  if(!unlockedSting && feed.current && feed.current.id==='giveaway-system' && feelingScore() >= SYSTEM_GATE){
    unlockedSting=true; showSting(); return;
  }
  feed.advance();
  if(!feed.current){ finishFeed(); return; }
  renderCard();
}

// Feed finished → rug-pull → Creator Mode → post-measure → end screen, in that order.
function finishFeed(){
  if(!rugDone){ showRug(); return; }
  if(!creatorDone){ showCreator(); return; }
  if(firstRun) startPost(); else showEnd();
}

// — C1 learning measurement (D-SITE-092, amended D-SITE-095): matched novel cards,
// cold at the start, fresh at the end. No reveals, no tokens, no streak — but the
// verify button IS available and silently counted, so the instrument gives children
// an opportunity to check. Each set holds a loud-true, a quiet-false and a loud-fake,
// so a style-matcher scores 1/3, not full marks.
function startRun(){
  if(!firstRun){ phase='feed'; feed.reset(); renderCard(); return; } // replay: skip measurement
  phase='pre'; mIdx=0; mScore.pre=0; mScore.post=0; renderMeasure();
}
function startPost(){ phase='post'; mIdx=0; renderMeasure(); }
function renderMeasure(){
  document.querySelectorAll('.card').forEach(c=>c.remove());
  if(!measure || !measure[phase] || !measure[phase].length){
    if(phase==='pre'){ phase='feed'; renderCard(); } else { showEnd(); }
    return;
  }
  const c=measure[phase][mIdx];
  if(c.verify) vSeen++;
  const lastM = mIdx === measure[phase].length-1; // only tease what actually comes next
  const el=document.createElement('div');
  el.className='card';
  el.innerHTML=`
    <div class="media"><span class="tag">${c.tag}</span><img class="photo" src="${c.img}" alt=""></div>
    <div class="cap"><span class="handle">${c.handle}</span> ${c.cap}</div>
    <div class="meta"><span>♡ like</span><span>💬 comment</span><span>↗ share</span></div>
    <div class="swipeflash" id="flash"></div>
    ${c.verify?`
    <div class="vpanel" id="vpanel">
      <div class="vhead"><span class="dot"></span> SOURCE CHECK</div>
      <ul>${c.verify.lines.map(l=>'<li>'+l+'</li>').join('')}</ul>
      <button class="next" onclick="closeVerify()">Back</button>
    </div>`:''}
    <div class="reveal" id="reveal">
      <div class="verdict ok" id="verdict">✓ Logged</div>
      <div class="tn"><span class="dot"></span> ${phase==='pre'?'WARM-UP':'FINAL CHECK'}</div>
      <div class="tell" id="tell">${phase==='pre'
        ? (lastM ? "No answers yet — they'd spoil the game. Let's play." : "No answers yet — they'd spoil the game. Next one…")
        : (lastM ? "Banked. Let's see how you did…" : "Banked. Next one…")}</div>
      <button class="next" onclick="measureAdvance()">Next →</button>
    </div>`;
  stage.appendChild(el);
  controls.style.display='flex'; hint.style.display='block';
  hint.textContent = phase==='pre'
    ? (mIdx===0 ? 'Warm-up — no points yet, just your gut' : c.question + '  ·  warm-up, your call')
    : c.question + '  ·  final check';
  const vb=document.getElementById('verifybtn');
  if(c.verify){
    vb.textContent='🔍 check source'; vb.disabled=false; vb.classList.remove('done'); vb.classList.remove('pulse');
    setVerifyRow(true);
  } else setVerifyRow(false);
  updateProgress(phase==='pre' ? mIdx : measure.pre.length + feed.length + mIdx);
}
function measureDecide(choice){
  const c=measure[phase][mIdx];
  if(choice===c.truth) mScore[phase]++;
  verifiedThisCard=false; // checks are counted, never rewarded, and never leak into the feed
  const flash=document.getElementById('flash');
  flash.style.background = flashFor(choice);
  flash.style.opacity=1; setTimeout(()=>flash.style.opacity=0,180);
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  document.getElementById('reveal').classList.add('show');
}
function measureAdvance(){
  mIdx++;
  if(mIdx < measure[phase].length){ renderMeasure(); return; }
  if(phase==='pre'){ phase='feed'; feed.reset(); renderCard(); return; }
  showEnd();
}

let stingPlayback;
function showSting(){
  document.querySelectorAll('.card').forEach(c=>c.remove());
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  document.getElementById('sting').classList.add('show');
  const v=document.getElementById('stingvid');
  const errorMessage=document.getElementById('sting-error');
  errorMessage.hidden=true;
  v.currentTime=0;
  stingPlayback=v.play().catch(error=>{
    console.error('TruthNet sting video failed to play',error);
    errorMessage.hidden=false;
  });
}
function closeSting(){
  const v=document.getElementById('stingvid');
  const sting=document.getElementById('sting');
  sting.classList.remove('show');
  // Pausing a pending play request rejects it. Leave the screen immediately and
  // pause the muted video once that request has settled.
  stingPlayback?.then(()=>{ if(!sting.classList.contains('show')) v.pause(); });
  feed.advance();
  if(!feed.current){ finishFeed(); return; }
  renderCard();
}

// Rug-pull: the controlled reveal that the "real" veracity cards were synthetic too.
// Honesty dependency: card-birthday-real.png and card-bakery-real.png ARE AI-made.
function showRug(){
  document.querySelectorAll('.card').forEach(c=>c.remove());
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  document.getElementById('rug').classList.add('show');
}
function closeRug(){
  rugDone=true;
  document.getElementById('rug').classList.remove('show');
  finishFeed();
}

// — Creator Mode: scripted, menu-based. Reusing card components, no free typing. —
let bHasCap=false, bHasArrow=false, bAwarded=false;
function showCreator(){
  document.querySelectorAll('.card').forEach(c=>c.remove());
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  document.getElementById('sting').classList.remove('show');
  document.getElementById('creator').classList.add('show');
}
function bSetCap(btn,text){
  document.querySelectorAll('#creator .build-step:nth-child(2) .chip').forEach(c=>c.classList.remove('sel'));
  btn.classList.add('sel');
  document.getElementById('bCap').innerHTML='<span class="handle">@you</span> '+text;
  bHasCap=true; bInflate();
}
function bToggleArrow(btn){
  bHasArrow=!bHasArrow;
  document.getElementById('bArrow').style.display=bHasArrow?'block':'none';
  btn.classList.toggle('sel',bHasArrow);
  btn.textContent=bHasArrow?'✓ red arrow added':'➕ add red arrow';
  bInflate();
}
function bInflate(){
  // the fake engagement number balloons as manipulation is added — the lesson made visible
  let likes=12; if(bHasCap) likes=486000; if(bHasCap&&bHasArrow) likes=2400000;
  document.getElementById('bLikes').textContent = likes>=1000 ? (likes/1000000>=1?(likes/1000000).toFixed(1)+'M':Math.round(likes/1000)+'K') : likes;
  if(bHasCap && bHasArrow){
    document.getElementById('bPayoff').innerHTML =
      "<strong>You just made the thumbnail lie.</strong> Same true photo — but the panic caption and an arrow pointing at nothing took it from 12 likes to millions. Nothing real changed. Only the framing did.";
    document.getElementById('bDone').style.display='inline-block';
    if(!bAwarded){ bAwarded=true; tokens+=1; tokEl.textContent='🪙 '+tokens; } // creator awards one token, once
  }
}
function closeCreator(){
  creatorDone=true;
  document.getElementById('creator').classList.remove('show');
  finishFeed(); // routes to the final check on a first run, straight to the end on a replay
}

function showEnd(){
  // the last measurement card arrives straight before the end screen — clear it,
  // same as every other full-screen state (rug/creator/sting) does
  document.querySelectorAll('.card').forEach(c=>c.remove());
  controls.style.display='none'; hint.style.display='none'; setVerifyRow(false);
  updateProgress(totalSteps());
  document.getElementById('endtok').textContent='🪙 '+tokens;
  document.getElementById('endmsg').textContent = tokens>=10 ? 'Sharp eyes. Round clear.' : 'Round clear — replay to beat your score';
  const ms=document.getElementById('mstat');
  if(firstRun && measure && measure.pre && measure.pre.length){
    const p=mScore.pre, q=mScore.post, n=measure.pre.length;
    let msg;
    if(q>p) msg='You caught more of the brand-new posts this time.';
    else if(p===n && q===n) msg='Sharp from the start — and still sharp at the end.';
    else if(q===p) msg='Held steady on posts you had never seen.';
    else msg="Brand-new posts are harder — that's normal. Practice helps.";
    ms.style.display='block';
    ms.innerHTML=`🎯 <strong>Your detector — before: ${p}/${n} · after: ${q}/${measure.post.length}</strong><br>${msg}`;
  } else { ms.style.display='none'; }
  const vs=document.getElementById('vstat');
  if(vSeen>0){
    vs.style.display='block';
    vs.innerHTML = `🔍 <strong>Checked before calling: ${vChecked}/${vSeen}</strong><br>`
      + 'The check is the skill that still works when the fakes are perfect.';
  } else { vs.style.display='none'; }
  document.getElementById('end').classList.add('show');
}
function resetState(){
  feed.reset(); tokens=0; streak=0; unlockedSting=false; rugDone=false; creatorDone=false;
  phase='pre'; mIdx=0; mScore.pre=0; mScore.post=0; verifyIntroDone=false;
  for(const k of Object.keys(competence)) delete competence[k];
  bHasCap=false; bHasArrow=false; bAwarded=false; verifiedThisCard=false; vSeen=0; vChecked=0;
  tokEl.textContent='🪙 0'; strkEl.textContent='🔥 0';
  const f=document.getElementById('pfill'); if(f) f.style.width='0%';
  const w=document.getElementById('pwalk'); if(w) w.style.left='0%';
  document.getElementById('end').classList.remove('show');
  document.getElementById('sting').classList.remove('show');
  document.getElementById('rug').classList.remove('show');
  document.getElementById('creator').classList.remove('show');
}
function restart(){ firstRun=false; resetState(); startRun(); }

// Day 2 booster — same tactics, the streak/return loop made legible (prototype only, no real scheduling)
function day2(){
  firstRun=false;
  resetState();
  document.querySelector('.brand').innerHTML='<span class="dot"></span> TRUTHNET · DAY 2';
  startRun();
}

// one-tap front door: don't render the feed until PLAY is tapped (and the deck has loaded)
function start(){
  deckReady.then(ready=>{
    if(!ready) return;
    document.getElementById('start').classList.add('hide');
    startRun();
  });
}
