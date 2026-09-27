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

export function clearanceTag(required, held) {
  const heldLevel = CLEARANCE_LEVELS.includes(held) ? held : 'None';
  const rank = (l) => CLEARANCE_LEVELS.indexOf(l === 'eDV' ? 'DV' : l);
  const ok = rank(heldLevel) >= rank(required);
  const label = heldLevel === 'None'
    ? `${required} mentioned · you hold none`
    : `${required} mentioned · you hold ${heldLevel}`;
  return { required, held: heldLevel, ok, label };
}
