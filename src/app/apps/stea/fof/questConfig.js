/* =============================================================================
   FIGHT OR FLIGHT — Quest Map config
   =============================================================================
   This is the WHOLE write surface for the quest map. Two-person fridge-door.
   To update progress: edit this file, commit, push. No CMS, no database.

   The only thing you change regularly:
     - a zone's `state`: 'locked' -> 'active' -> 'cleared'
     - add a `learned` note to a zone after you clear it
     - add a row to `gallery` when Felix's drawing makes it into the game
     - add to `canon` when a new villain/power becomes official

   Keep it simple. If this file starts wanting to be a database, stop.
   ----------------------------------------------------------------------------- */

export const game = {
  title: 'Fight or Flight',
  tagline: "Felix's game. Built with Dad.",
  // 'unity' => no in-browser play; map links to the build + shows screenshots.
  engine: 'unity',
  // The current thing you can actually play right now (the canvas demo).
  playableDemo: {
    label: 'Play the Pish the Penguin demo',
    href: '/stea/felix/fight-or-flight',
    note: 'Early test build — Smasher vs Pish the Penguin.',
  },
  // Real Unity builds go here when they exist (TestFlight / APK). Empty = "coming soon".
  builds: [
    // { label: 'Android APK (v0.2)', href: 'https://...' },
    // { label: 'TestFlight', href: 'https://...' },
  ],
};

/* -----------------------------------------------------------------------------
   ZONES = the build milestones, themed as game levels.
   Zones unlock left-to-right. state: 'locked' | 'active' | 'cleared'
   `goal` is in kid language. `learned` is optional, added after clearing.
   ----------------------------------------------------------------------------- */
export const zones = [
  {
    id: 1,
    name: 'Sky School',
    themedAs: 'Tutorial level',
    state: 'active',
    goal: 'The hero can move in 3 lanes and one hero animates.',
    learned: '',
  },
  {
    id: 2,
    name: 'Thunder Run',
    themedAs: 'Speed level',
    state: 'locked',
    goal: 'Obstacles appear, you collect coins, and the power meter fills up.',
    learned: '',
  },
  {
    id: 3,
    name: 'City Chase',
    themedAs: 'Boss level',
    state: 'locked',
    goal: 'The first proper boss fight you can actually play.',
    learned: '',
  },
  {
    id: 4,
    name: 'To be named with Felix',
    themedAs: 'TBD',
    state: 'locked',
    goal: "We'll fill this in from the workbook as we go.",
    learned: '',
  },
];

/* -----------------------------------------------------------------------------
   GALLERY = the emotional core. "You drew this -> here it is in the game."
   Each item: Felix's sketch on the left, the in-game version on the right.
   Use `sketch: ''` if a drawing isn't scanned yet (shows a friendly placeholder).
   ----------------------------------------------------------------------------- */
export const gallery = [
  {
    id: 'god-of-lightning',
    title: 'God of Lightning',
    note: 'Felix invented him — throws lightning bolts.',
    sketch: '',
    inGame: '/fof/art/god-of-lightning.jpg',
  },
  {
    id: 'zeus',
    title: 'Storm Boss',
    note: 'The big bearded lightning boss.',
    sketch: '',
    inGame: '/fof/art/zeus.jpg',
  },
  {
    id: 'winged-villain',
    title: 'Winged Villain',
    note: 'Has wings and is NOT friendly.',
    sketch: '',
    inGame: '/fof/art/winged-villain.jpg',
  },
];

/* -----------------------------------------------------------------------------
   CANON = official game lore. Felix's heroes, villains and invented powers.
   ----------------------------------------------------------------------------- */
export const canon = {
  heroes: [
    { name: 'Smasher', power: 'Super strength', unlock: 'Starting hero' },
    { name: 'Flyman', power: 'Flight', unlock: 'Unlock with coins (2nd)' },
    { name: 'Arachnid', power: '15 legs and 3 horns', unlock: 'Unlock with coins (3rd)' },
    { name: 'Stretchy McStretch', power: 'Long stretchy arms', unlock: 'Unlock with coins (4th)' },
  ],
  villains: [
    { name: 'Cowboy', power: 'Laser eyes' },
    { name: 'Smashatron', power: 'Super strength' },
    { name: 'Jupiter', power: 'Throws lightning bolts' },
    { name: 'Knifetenant', power: 'Knife hands' },
    { name: 'Pish the Penguin', power: 'Massive penguin — piranhas and the ice of Antarctica' },
  ],
  bigBoss: {
    name: 'The Enormous Cockroach',
    detail: 'A giant cockroach fight in a colosseum.',
  },
  inventedPowers: [
    { name: 'Eating hotdogs at the speed of light', detail: 'Unlocks randomly during levels.' },
  ],
};

/* -----------------------------------------------------------------------------
   REFERENCE = tucked away. For Dad + settling "what did we decide."
   ----------------------------------------------------------------------------- */
export const reference = {
  decisions: [
    { label: 'Art style', value: 'Cartoon (Felix ticked it in the workbook).' },
    { label: 'Engine', value: 'Unity — so no in-browser play; the map links to builds.' },
    { label: 'Tone', value: 'No one ever dies — the hero retreats to regroup. Reward-first.' },
    { label: 'Target age', value: '6–10, superhero fans.' },
  ],
  assetLibrary: [
    { label: 'Hero sprites (idle / fly)', value: '/fof/sprites/' },
    { label: 'Collectibles (coin / power orb)', value: '/fof/sprites/' },
    { label: 'Lightning bolts', value: '/fof/sprites/' },
  ],
  buildNotes: [
    'Workbook source: Fight_or_Flight_Design_Workbook.md',
    'Current playable demo is a canvas test, not the Unity build.',
  ],
};
