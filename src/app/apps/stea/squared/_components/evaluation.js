// Parse Squared's evaluation markdown (format fixed by the evaluate prompt in
// src/lib/careerEngine/apps/squared.js) into the verdict panel's parts.

const line = (md, label) =>
  md.match(new RegExp(`^\\s*\\**${label}\\**\\s*:\\s*\\**\\s*(.+?)\\s*$`, 'im'))?.[1]?.replace(/\*\*/g, '').trim() || '';

export function parseEvaluation(md = '') {
  const text = md || '';
  const sections = [];
  const parts = text.split(/^##\s+/m);
  for (const part of parts.slice(1)) {
    const [heading, ...rest] = part.split('\n');
    const body = rest.join('\n').trim();
    if (heading.trim()) sections.push({ title: heading.trim(), body });
  }
  return {
    action: line(text, 'Recommended action'),
    risk: line(text, 'Risk Signal'),
    sections,
  };
}

// Verdict band from the rough score: olive GO -> amber care -> brick NO-GO.
export function verdictFor(score) {
  // No parsable score is not a NO-GO; send the reader to the reasoning.
  if (typeof score !== 'number') return { label: 'No score', color: '#686c62', bg: '#f3efe3', sub: 'Read the reasoning for the call.' };
  const s = score;
  if (s >= 4) return { label: 'GO — strong fit', color: '#4c5c3f', bg: '#eef1e8', sub: 'Apply — tailor and submit.' };
  if (s >= 3) return { label: 'Proceed with care', color: '#8a5a1e', bg: '#f6ecdc', sub: 'Selective — apply only with a strong tailored narrative.' };
  return { label: 'NO-GO — weak fit', color: '#C63C00', bg: '#f7e6dc', sub: 'Skip unless you have a specific reason.' };
}

export const scoreColor = (s) => (typeof s !== 'number' ? '#686c62' : s >= 4 ? '#4c5c3f' : s >= 3 ? '#8a5a1e' : '#C63C00');
