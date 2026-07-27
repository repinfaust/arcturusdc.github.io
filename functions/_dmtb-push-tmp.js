/* Dialled activation comms — Loops contact sync. In-memory, NO PII to disk.
 * DEFAULT = dry-run (prints payloads, sends nothing). Pass --send to hit Loops.
 * Reads LOOPS_API_KEY from env only (never a file). Contact-sync only: sets a
 * userGroup (A/B) + minimised merge fields; does NOT trigger any email — the
 * campaign is built/sent by a human inside Loops against those groups.
 * Upsert: Loops PUT /v1/contacts/update creates if missing, updates if present. */
const admin=require('firebase-admin');
const app=admin.initializeApp({projectId:'dialledmtb-ea850'},'dmtb');
const db=admin.firestore(app);

const SEND = process.argv.includes('--send');
const KEY = process.env.LOOPS_API_KEY || '';

/* Internal + partner test accounts. These are indistinguishable from real users in
 * Firestore — no flag on the user doc — so the list is hardcoded here. The four
 * @cann addresses are a business partner's test accounts; repinfaust@gmail.com is
 * the founder's. See OPEN_QUESTIONS "internal accounts unflagged" — the durable fix
 * is users/{uid}.internalType, at which point this literal list goes away. */
const HARD_SCRUB=new Set(['dialled.app@gmail.com','syncfit.tester@gmail.com','repinfaust@pm.me',
  'repinfaust@gmail.com','jpcann@me.com','sjcann@me.com','tgcann@me.com','amcann94@gmail.com']);

/* Excluded from the v1 activation send — calculator ran to completion, single output
 * field written null (suspected calculator defect, not rider inaction). "Setup hasn't
 * finished running" is false for this recipient. NOT a test account — do not fold
 * into HARD_SCRUB. See OPEN_QUESTIONS "MOAB shock sag". */
const SEND_EXCLUDE=new Set(['t8p79b4fd9@privaterelay.appleid.com']);

const isTestLab=(e)=>/@cloudtestlabaccounts\.com$/i.test(e);
const CALC_FULL=[['recommendedFrontPsi','Front tyre pressure'],['recommendedRearPsi','Rear tyre pressure'],['recommendedForkSagPercent','Fork sag'],['recommendedShockSagPercent','Shock sag']];
const isSet=(v)=>v!==null&&v!==undefined&&!(typeof v==='number'&&Number.isNaN(v));
const fmtDate=(ts)=>{try{const d=ts&&ts.toDate?ts.toDate():(ts?new Date(ts):null);return d?d.toISOString().slice(0,10):'';}catch{return '';}};

function buildSegments(users,bikesByOwner){
  const A=[],B=[];
  for(const u of users){
    const email=(u.email||'').trim(); if(!email) continue;
    const store=u.subscription&&u.subscription.store;
    if(HARD_SCRUB.has(email.toLowerCase())||isTestLab(email)) continue;
    if(SEND_EXCLUDE.has(email.toLowerCase())) continue;
    if(store==='promotional') continue;
    const mine=bikesByOwner[u.uid]||[]; const active=mine.filter(b=>!b.isArchived);
    if(mine.length===0){A.push({email,signupDate:fmtDate(u.createdAt)});continue;}
    if(active.length===0) continue; // archived-only excluded
    let bike=active.find(b=>b.isActive===true)||active.slice().sort((a,b)=>fmtDate(b.createdAt).localeCompare(fmtDate(a.createdAt)))[0];
    const sd=bike.setupData||{}; const isHT=bike.type==='hardtail';
    const empties=(isHT?CALC_FULL.slice(0,3):CALC_FULL).filter(([k])=>!isSet(sd[k]));
    if(empties.length===0) continue; // Segment C excluded
    B.push({email,bikeName:bike.name,emptyFieldList:empties.map(([,l])=>l).join(', ')});
  }
  return {A,B};
}

// Loops payloads — minimised. userGroup drives the in-Loops campaign audience.
function payloadA(r){return {email:r.email, source:'dialled-activation-v1', userGroup:'activation_A_empty_garage', signupDate:r.signupDate||''};}
function payloadB(r){return {email:r.email, source:'dialled-activation-v1', userGroup:'activation_B_setup_incomplete', bikeName:r.bikeName, emptyFieldList:r.emptyFieldList};}

async function loopsUpsert(payload){
  const res=await fetch('https://app.loops.so/api/v1/contacts/update',{
    method:'PUT',
    headers:{'Authorization':`Bearer ${KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(payload),
  });
  const body=await res.json().catch(()=>({}));
  return {ok:res.ok,status:res.status,body};
}

(async()=>{
  const users=(await db.collection('users').get()).docs.map(d=>({uid:d.id,...d.data()}));
  const bikesByOwner={};
  for(const d of (await db.collection('bikes').get()).docs){const b={id:d.id,...d.data()};(bikesByOwner[b.ownerUid]=bikesByOwner[b.ownerUid]||[]).push(b);}
  const {A,B}=buildSegments(users,bikesByOwner);
  const all=[...A.map(payloadA),...B.map(payloadB)];

  console.log(`Segment A: ${A.length} | Segment B: ${B.length} | total: ${all.length}`);
  console.log(`Mode: ${SEND?'*** SEND (live Loops upsert) ***':'DRY-RUN (no network)'}`);
  if(SEND && !KEY){console.error('ABORT: --send but LOOPS_API_KEY not set in env.');process.exit(2);}

  if(!SEND){
    console.log('\n--- exact payloads that WOULD be sent (upsert PUT /v1/contacts/update) ---');
    all.forEach(p=>console.log('  '+JSON.stringify(p)));
    console.log('\n[dry-run — nothing sent. Re-run with --send after exporting LOOPS_API_KEY to push.]');
    process.exit(0);
  }

  let ok=0,fail=0; const failures=[];
  for(const p of all){
    const r=await loopsUpsert(p);
    if(r.ok) ok++; else {fail++; failures.push(`${p.email} -> ${r.status} ${JSON.stringify(r.body).slice(0,160)}`);}
    await new Promise(res=>setTimeout(res,120)); // gentle pacing under rate limits
  }
  console.log(`\nSENT. ok=${ok} fail=${fail}`);
  if(failures.length) console.log('failures:\n'+failures.join('\n'));
  process.exit(fail?1:0);
})().catch(e=>{console.error('ERR',e.message,e.stack);process.exit(1);});
