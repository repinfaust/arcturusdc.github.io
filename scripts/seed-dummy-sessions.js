// Script to generate dummy sessions for ApexTwin
// Run with: GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json node scripts/seed-dummy-sessions.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const EVENT_ID = 'gTdQbodxyIfTSfwcF2pq';

// Session times starting at 09:40, every 2 hours
const SESSION_TIMES = ['09:40', '11:40', '13:40', '15:40', '17:40'];

// Weather conditions
const WEATHER_OPTIONS = ['sunny', 'cloudy', 'mixed'];

// Tyre brands and compounds
const TYRE_BRANDS = ['Pirelli', 'Dunlop', 'Michelin'];
const FRONT_COMPOUNDS = ['SC1', 'SC2', 'SC3'];
const REAR_COMPOUNDS = ['SC0', 'SC1', 'SC2'];

// Handling notes templates
const HANDLING_NOTES = [
  'Good front grip, rear slightly loose on exit',
  'Bike felt planted, made some minor adjustments mid-session',
  'Front pushing in slow corners, need more compression',
  'Great session, consistent lap times',
  'Struggled with rear traction early on, improved as tyre came in',
  'Slight chatter on brakes, adjusted preload',
  'Best feeling all day, setup dialed in',
  'Had to back off due to traffic, pace was good when clear',
  'Rear started to slide late session, might need pressure adjustment',
  'Smooth session, working on consistency',
];

// Bike options (typical track day bikes)
const BIKES = [
  { id: 'bike1', name: 'R6 Track', make: 'Yamaha', model: 'YZF-R6' },
  { id: 'bike2', name: 'Panigale V2', make: 'Ducati', model: 'Panigale V2' },
];

// Generate random number between min and max (inclusive)
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate random integer between min and max (inclusive)
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Pick random item from array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate lap time in seconds between 02:59:01 (179.01s) and 03:33:33 (213.33s)
function generateLapTime() {
  // 02:59:01 = 179.01 seconds
  // 03:33:33 = 213.33 seconds
  return randomBetween(179.01, 213.33);
}

async function seedSessions() {
  console.log('Fetching event data...');

  // Get event details
  const eventDoc = await db.collection('apextwin_events').doc(EVENT_ID).get();

  if (!eventDoc.exists) {
    console.error('Event not found:', EVENT_ID);
    process.exit(1);
  }

  const event = eventDoc.data();
  console.log('Event:', event.trackName);

  // Use the first bike from event or default
  const bikesOnEvent = event.bikes || BIKES;

  // Date: 21st November 2025
  const sessionDate = new Date('2025-11-21T00:00:00');

  const sessions = [];

  for (let i = 0; i < SESSION_TIMES.length; i++) {
    const sessionTime = SESSION_TIMES[i];
    const bike = bikesOnEvent[i % bikesOnEvent.length];

    // Generate realistic data
    const fastestLapSec = generateLapTime();
    const lapsCompleted = randomInt(8, 15);
    const confidence = randomInt(40, 95);

    // Tyre pressures (realistic range)
    const frontColdPsi = randomBetween(30, 33).toFixed(1);
    const frontHotPsi = (parseFloat(frontColdPsi) + randomBetween(2, 4)).toFixed(1);
    const rearColdPsi = randomBetween(27, 30).toFixed(1);
    const rearHotPsi = (parseFloat(rearColdPsi) + randomBetween(2, 4)).toFixed(1);

    // Suspension clicks (realistic range)
    const forkComp = randomInt(8, 16);
    const forkReb = randomInt(8, 16);
    const shockComp = randomInt(10, 20);
    const shockReb = randomInt(10, 20);

    const session = {
      riderId: event.riderId || 'demo_rider',
      riderName: 'Demo Rider',
      eventId: EVENT_ID,
      bikeId: bike.id,
      bikeName: bike.name,
      trackId: event.trackId,
      trackName: event.trackName,
      date: Timestamp.fromDate(sessionDate),
      sessionTime: sessionTime,
      sessionNumber: i + 1,
      // Tyres
      tireBrandFront: pickRandom(TYRE_BRANDS),
      tireCompoundFront: pickRandom(FRONT_COMPOUNDS),
      tirePressureFrontColdPsi: parseFloat(frontColdPsi),
      tirePressureFrontHotPsi: parseFloat(frontHotPsi),
      tireBrandRear: pickRandom(TYRE_BRANDS),
      tireCompoundRear: pickRandom(REAR_COMPOUNDS),
      tirePressureRearColdPsi: parseFloat(rearColdPsi),
      tirePressureRearHotPsi: parseFloat(rearHotPsi),
      tireSetAgeSessions: randomInt(0, 3),
      // Suspension
      forkCompClicksOut: forkComp,
      forkRebClicksOut: forkReb,
      shockCompClicksOut: shockComp,
      shockRebClicksOut: shockReb,
      // Electronics
      tractionControlLevel: `TC ${randomInt(2, 5)}`,
      engineMap: pickRandom(['A', 'B', 'Race']),
      // Outcome
      lapsCompleted: lapsCompleted,
      fastestLapSec: parseFloat(fastestLapSec.toFixed(2)),
      notesHandling: pickRandom(HANDLING_NOTES),
      // Conditions
      weather: pickRandom(WEATHER_OPTIONS),
      // Confidence
      confidence: confidence,
      // Meta
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    sessions.push(session);
  }

  console.log(`\nCreating ${sessions.length} sessions...`);

  for (const session of sessions) {
    const docRef = await db.collection('apextwin_sessions').add(session);
    const mins = Math.floor(session.fastestLapSec / 60);
    const secs = (session.fastestLapSec % 60).toFixed(2).padStart(5, '0');
    console.log(`  Session ${session.sessionNumber} @ ${session.sessionTime} - ${mins}:${secs} - ${session.lapsCompleted} laps (Confidence: ${session.confidence}%)`);
  }

  // Update event session count
  await db.collection('apextwin_events').doc(EVENT_ID).update({
    sessionCount: sessions.length,
  });

  console.log('\nDone! Sessions created successfully.');
}

seedSessions().catch(console.error);
