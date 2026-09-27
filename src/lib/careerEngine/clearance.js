// Security clearance helpers for Squared (no dependencies; server and client).

// Clearance levels, lowest to highest. A higher level held satisfies a lower
// one asked for.
export const CLEARANCE_LEVELS = ['None', 'BPSS', 'CTC', 'SC', 'eDV', 'DV'];

// Patterns for clearance mentioned in a job listing. Acronyms are matched
// case-sensitively so ordinary words ("sc", "dv") don't trigger them.
const CLEARANCE_PATTERNS = [
  ['DV', /\b(?:e?DV\b|[Dd]eveloped [Vv]etting)/],
  ['SC', /\b(?:SC\b|[Ss]ecurity [Cc]heck(?:ed)?\b|SC[- ][Cc]lear)/],
  ['CTC', /\b(?:CTC\b|[Cc]ounter[- ][Tt]errorist [Cc]heck)/],
  ['BPSS', /\b(?:BPSS\b|[Bb]aseline [Pp]ersonnel [Ss]ecurity [Ss]tandard)/],
];

// Highest clearance a listing mentions, or null.
export function clearanceMentioned(text = '') {
  for (const [level, re] of CLEARANCE_PATTERNS) if (re.test(text)) return level;
  return null;
}

const NSV = new Set(['CTC', 'SC', 'eDV', 'DV']);
const rank = (l) => CLEARANCE_LEVELS.indexOf(l === 'eDV' ? 'DV' : l);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Where a leaver's clearance stands today (D-SITE-036). Rules from UK Security
// Vetting aftercare guidance (gov.uk, "Aftercare and existing clearances"): a
// national security clearance (CTC/SC/DV) lapses when the holder leaves; it may
// be reinstated if they move to another cleared role within 12 months; a
// transfer needs the clearance to be no older than 10 years (CTC/SC) or 7 years
// (DV). Reinstatement is the new sponsor's decision, never automatic.
export function clearanceStatus(profile = {}, now = new Date()) {
  const level = CLEARANCE_LEVELS.includes(profile.clearance) ? profile.clearance : 'None';
  if (level === 'None') return { level, state: 'none', label: 'No clearance' };
  const exit = profile.exit_date ? new Date(`${profile.exit_date}T00:00:00`) : null;
  const out = exit && !isNaN(exit) && exit <= now;

  if (!NSV.has(level)) {
    // BPSS is a pre-employment check, not a national security clearance.
    return out
      ? { level, state: 'past', label: 'BPSS was a service check — the new employer decides' }
      : { level, state: 'held', label: `You hold ${level}` };
  }
  if (!out) return { level, state: 'held', label: `You hold ${level}` };

  const limit = level === 'SC' || level === 'CTC' ? 10 : 7;
  const granted = Number(profile.clearance_granted) || null;
  const tooOld = granted ? now.getFullYear() - granted > limit : false;
  const until = new Date(exit);
  until.setFullYear(until.getFullYear() + 1);
  if (now > until) return { level, state: 'lapsed', label: `${level} lapsed — a new cleared role needs fresh vetting` };
  if (tooOld) return { level, state: 'lapsed', label: `${level} lapsed — over ${limit} years old, so it can't transfer` };
  return {
    // Local date parts, not toISOString(): UTC would shift UK midnight back a day.
    level, state: 'transferable', until: ymd(until), ageKnown: !!granted,
    label: `${level} lapsed — may transfer to a new cleared role until ${fmt(until)}${granted ? '' : ` if under ${limit} years old`}; the new employer decides`,
  };
}

// Tag for a listing that mentions `required`, given the leaver's status.
// tone: 'ok' (holds it), 'maybe' (lapsed but may transfer, or check), 'no'.
export function clearanceTag(required, status) {
  const meets = rank(status.level) >= rank(required);
  if (status.state === 'held') {
    return { required, tone: meets ? 'ok' : 'no', label: `${required} mentioned · you hold ${status.level}` };
  }
  if (status.state === 'transferable') {
    return { required, tone: meets ? 'maybe' : 'no', label: `${required} mentioned · your ${status.level} may transfer until ${fmt(new Date(`${status.until}T00:00:00`))}` };
  }
  if (status.state === 'lapsed') return { required, tone: 'no', label: `${required} mentioned · your ${status.level} has lapsed` };
  if (status.state === 'past') return { required, tone: 'maybe', label: `${required} mentioned · check with the employer` };
  return { required, tone: 'no', label: `${required} mentioned · you hold none` };
}
