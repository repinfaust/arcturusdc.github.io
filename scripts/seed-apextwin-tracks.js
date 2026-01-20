/**
 * ApexTwin Track Seed Script
 *
 * Run with: node scripts/seed-apextwin-tracks.js
 *
 * Seeds the apextwin_tracks collection with popular UK/EU circuits.
 * Requires Firebase Admin SDK credentials.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS || '../stea-775cd-1adc69763f06.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const TRACKS = [
  // UK Circuits
  { name: 'Donington Park', layout: 'National', country: 'UK', latitude: 52.8307, longitude: -1.3750 },
  { name: 'Donington Park', layout: 'GP', country: 'UK', latitude: 52.8307, longitude: -1.3750 },
  { name: 'Silverstone', layout: 'National', country: 'UK', latitude: 52.0706, longitude: -1.0167 },
  { name: 'Silverstone', layout: 'GP', country: 'UK', latitude: 52.0706, longitude: -1.0167 },
  { name: 'Brands Hatch', layout: 'Indy', country: 'UK', latitude: 51.3569, longitude: 0.2611 },
  { name: 'Brands Hatch', layout: 'GP', country: 'UK', latitude: 51.3569, longitude: 0.2611 },
  { name: 'Cadwell Park', layout: 'Full', country: 'UK', latitude: 53.3103, longitude: -0.0597 },
  { name: 'Snetterton', layout: '300', country: 'UK', latitude: 52.4625, longitude: 0.9450 },
  { name: 'Snetterton', layout: '200', country: 'UK', latitude: 52.4625, longitude: 0.9450 },
  { name: 'Oulton Park', layout: 'International', country: 'UK', latitude: 53.1783, longitude: -2.6133 },
  { name: 'Oulton Park', layout: 'Island', country: 'UK', latitude: 53.1783, longitude: -2.6133 },
  { name: 'Thruxton', layout: 'Full', country: 'UK', latitude: 51.2086, longitude: -1.6058 },
  { name: 'Knockhill', layout: 'Full', country: 'UK', latitude: 56.1289, longitude: -3.5011 },
  { name: 'Anglesey', layout: 'Coastal', country: 'UK', latitude: 53.1867, longitude: -4.4967 },
  { name: 'Castle Combe', layout: 'Full', country: 'UK', latitude: 51.4881, longitude: -2.2172 },
  { name: 'Mallory Park', layout: 'Full', country: 'UK', latitude: 52.5939, longitude: -1.3344 },
  { name: 'Croft', layout: 'Full', country: 'UK', latitude: 54.4533, longitude: -1.5556 },
  { name: 'Pembrey', layout: 'Full', country: 'UK', latitude: 51.7128, longitude: -4.3178 },
  { name: 'Bedford Autodrome', layout: 'GT', country: 'UK', latitude: 52.2303, longitude: -0.4744 },

  // Ireland
  { name: 'Mondello Park', layout: 'International', country: 'Ireland', latitude: 53.2567, longitude: -6.7458 },
  { name: 'Kirkistown', layout: 'Full', country: 'Ireland', latitude: 54.4953, longitude: -5.4569 },
  { name: 'Bishopscourt', layout: 'Full', country: 'Ireland', latitude: 54.3047, longitude: -5.5728 },

  // Spain
  { name: 'Circuit de Barcelona-Catalunya', layout: 'GP', country: 'Spain', latitude: 41.5700, longitude: 2.2611 },
  { name: 'Circuito de Jerez', layout: 'GP', country: 'Spain', latitude: 36.7089, longitude: -6.0342 },
  { name: 'MotorLand Aragón', layout: 'GP', country: 'Spain', latitude: 41.0783, longitude: -0.4303 },
  { name: 'Circuit Ricardo Tormo', layout: 'GP', country: 'Spain', latitude: 39.4856, longitude: -0.6314 },
  { name: 'Circuito de Navarra', layout: 'Full', country: 'Spain', latitude: 42.3558, longitude: -1.9750 },
  { name: 'Ascari Race Resort', layout: 'Full', country: 'Spain', latitude: 36.7961, longitude: -4.9547 },
  { name: 'Almería Circuit', layout: 'Full', country: 'Spain', latitude: 36.8539, longitude: -2.3553 },
  { name: 'Cartagena', layout: 'Full', country: 'Spain', latitude: 37.5572, longitude: -1.0081 },
  { name: 'Circuito de Andalucía', layout: 'Full', country: 'Spain', latitude: 36.8539, longitude: -2.3553 },
  { name: 'Guadix', layout: 'Full', country: 'Spain', latitude: 37.3017, longitude: -3.1358 },
  { name: 'Motorland Aragón', layout: 'National', country: 'Spain', latitude: 41.0783, longitude: -0.4303 },

  // Portugal
  { name: 'Autódromo Internacional do Algarve (Portimão)', layout: 'GP', country: 'Portugal', latitude: 37.2297, longitude: -8.6267 },
  { name: 'Estoril', layout: 'Full', country: 'Portugal', latitude: 38.7503, longitude: -9.3939 },

  // France
  { name: 'Circuit Paul Ricard', layout: 'GP', country: 'France', latitude: 43.2506, longitude: 5.7917 },
  { name: 'Circuit de Nevers Magny-Cours', layout: 'GP', country: 'France', latitude: 46.8642, longitude: 3.1633 },
  { name: 'Le Mans', layout: 'Bugatti', country: 'France', latitude: 47.9567, longitude: 0.2078 },
  { name: 'Pau-Arnos', layout: 'Full', country: 'France', latitude: 43.4361, longitude: -0.5472 },
  { name: 'Carole', layout: 'Full', country: 'France', latitude: 48.9761, longitude: 2.5175 },

  // Italy
  { name: 'Misano World Circuit', layout: 'GP', country: 'Italy', latitude: 43.9631, longitude: 12.6842 },
  { name: 'Mugello', layout: 'GP', country: 'Italy', latitude: 43.9975, longitude: 11.3719 },
  { name: 'Imola', layout: 'GP', country: 'Italy', latitude: 44.3439, longitude: 11.7133 },
  { name: 'Monza', layout: 'GP', country: 'Italy', latitude: 45.6156, longitude: 9.2811 },
  { name: 'Cremona', layout: 'Full', country: 'Italy', latitude: 45.0642, longitude: 10.0928 },

  // Germany
  { name: 'Nürburgring', layout: 'GP', country: 'Germany', latitude: 50.3356, longitude: 6.9475 },
  { name: 'Nürburgring', layout: 'Nordschleife', country: 'Germany', latitude: 50.3356, longitude: 6.9475 },
  { name: 'Hockenheimring', layout: 'GP', country: 'Germany', latitude: 49.3278, longitude: 8.5656 },
  { name: 'Sachsenring', layout: 'GP', country: 'Germany', latitude: 50.7903, longitude: 12.6867 },
  { name: 'Lausitzring', layout: 'Full', country: 'Germany', latitude: 51.5311, longitude: 13.9264 },

  // Netherlands
  { name: 'TT Circuit Assen', layout: 'GP', country: 'Netherlands', latitude: 52.9614, longitude: 6.5244 },
  { name: 'Zandvoort', layout: 'GP', country: 'Netherlands', latitude: 52.3889, longitude: 4.5408 },

  // Belgium
  { name: 'Circuit de Spa-Francorchamps', layout: 'GP', country: 'Belgium', latitude: 50.4372, longitude: 5.9714 },
  { name: 'Zolder', layout: 'Full', country: 'Belgium', latitude: 50.9906, longitude: 5.2567 },

  // Austria
  { name: 'Red Bull Ring', layout: 'GP', country: 'Austria', latitude: 47.2197, longitude: 14.7647 },

  // Czech Republic
  { name: 'Brno', layout: 'GP', country: 'Czech Republic', latitude: 49.2036, longitude: 16.4728 },
  { name: 'Most', layout: 'Full', country: 'Czech Republic', latitude: 50.5231, longitude: 13.6322 },

  // Hungary
  { name: 'Hungaroring', layout: 'GP', country: 'Hungary', latitude: 47.5789, longitude: 19.2486 },
];

async function seedTracks() {
  console.log('Seeding ApexTwin tracks...');

  const batch = db.batch();
  let count = 0;

  for (const track of TRACKS) {
    // Create a unique ID based on name and layout
    const trackId = `${track.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${(track.layout || 'full').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const trackRef = db.collection('apextwin_tracks').doc(trackId);

    batch.set(trackRef, {
      name: track.layout ? `${track.name} (${track.layout})` : track.name,
      layout: track.layout || null,
      country: track.country,
      latitude: track.latitude || null,
      longitude: track.longitude || null,
      source: 'seed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    count++;
  }

  await batch.commit();
  console.log(`Seeded ${count} tracks successfully!`);
  process.exit(0);
}

seedTracks().catch((err) => {
  console.error('Error seeding tracks:', err);
  process.exit(1);
});
