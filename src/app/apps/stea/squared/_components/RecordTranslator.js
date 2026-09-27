'use client';

// Whole-record translation (D-SITE-035): upload or paste a service record, get
// civilian lines back, review each one. The record stays in this component's
// memory only; nothing but the lines the user ticks is saved.
import { useState, useMemo } from 'react';
import { extractCvText } from '@/lib/careerEngine/cvParse';
import { chunkText, validateLine, unresolvedClaims, CATEGORIES, MAX_CHUNKS, MAX_TRANSLATIONS } from '@/lib/careerEngine/recordTranslate';
import { Btn, SmallBtn, INPUT, MONO, CAPS } from './ui';

export default function RecordTranslator({ translations, saveTranslations, translateRecord, usage, anchors, saveAnchors, onClose }) {
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState(null); // [{ mil, civ, category, added, confirmed, note, ticked }]
  const [anchorIdx, setAnchorIdx] = useState('');
  const [result, setResult] = useState('');

  const parts = useMemo(() => chunkText(source).length, [source]);
  const tooLong = parts > MAX_CHUNKS;
  const remaining = usage?.unlimited ? Infinity : (usage?.remaining ?? 0);
  const room = MAX_TRANSLATIONS - translations.length;

  // Re-run every check live, against the record still held in memory. A line
  // is usable only when it is traceable, adds no numbers, and every inferred
  // claim has been removed or confirmed.
  const checked = useMemo(() => (lines || []).map((l) => {
    const v = validateLine(l, source);
    const unresolved = unresolvedClaims(l);
    return { ...l, ...v, unresolved, usable: v.found && v.numbersOk && unresolved.length === 0 };
  }), [lines, source]);
  const tickedCount = checked.filter((l) => l.ticked && l.usable).length;

  const loadFile = async (file) => {
    setBusy(true);
    try { setSource(await extractCvText(file)); }
    catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const run = async () => {
    setBusy(true);
    setResult('');
    const out = await translateRecord(source);
    setBusy(false);
    if (!out) return;
    // Everything starts unticked: the user decides line by line.
    setLines(out.lines.map((l) => ({ mil: l.mil, civ: l.civ, category: l.category, added: l.added || [], confirmed: [], note: l.note, ticked: false })));
    if (out.failed) setResult(`${out.failed} of ${out.chunks} parts couldn't be translated and weren't charged. Try pasting that part on its own.`);
  };

  const patch = (i, p) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));

  const addTicked = async () => {
    const picked = checked.filter((l) => l.ticked && l.usable);
    if (!picked.length) return;
    if (picked.length > room) { alert(`You can keep ${MAX_TRANSLATIONS} translations; there's room for ${room} more. Untick some or remove old ones.`); return; }
    const add = picked.map((l) => ({
      mil: l.mil, civ: l.civ, used: true, source: 'record', category: l.category,
      confirmed_claims: (l.confirmed || []).filter((c) => (l.added || []).includes(c)),
    }));
    const { res, data } = await saveTranslations([...translations, ...add]);
    if (!res.ok) { alert('Could not save: ' + (data?.error || res.status)); return; }
    if (anchorIdx !== '') {
      const i = Number(anchorIdx);
      const next = anchors.map((a, j) => (j === i ? { ...a, bullets: [...(a.bullets || []).filter(Boolean), ...add.map((t) => t.civ)] } : a));
      await saveAnchors(next);
    }
    setLines((ls) => ls.filter((l, j) => !(checked[j].ticked && checked[j].usable)));
    setResult(`${add.length} line${add.length === 1 ? '' : 's'} added to your CV${anchorIdx !== '' ? ' and your evidence anchor' : ''}.`);
  };

  return (
    <div className="mt-5 p-4 sm:p-5 border border-[#22251f] bg-[#f8f4ea]">
      <div className="flex justify-between items-center gap-3">
        <span className={`${CAPS} text-[#4c5c3f]`}>Translate a whole record</span>
        <button onClick={onClose} className={`${CAPS} text-[#686c62]`}>Close ✕</button>
      </div>

      {!lines && (
        <>
          <p className="mt-2 text-[13px] leading-relaxed">
            Upload or paste an appraisal report (SJAR / OJAR), JPA extract, course report or military CV. We&apos;ll pick out the lines worth having on a civilian CV and suggest how to say them. You review every line.
          </p>
          <div className="mt-3 flex gap-2.5 p-3 bg-[#f3e5dc] border border-[#d9b8a6] text-[13px] sm:text-xs leading-relaxed text-[#5a3c2f]">
            <span className="font-extrabold text-[#C63C00]">!</span>
            <span>Only use documents marked OFFICIAL or unmarked. Remove anything about operations, locations or people you wouldn&apos;t put on a CV. Your record isn&apos;t stored — only the lines you tick are saved.</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <label className={`inline-flex items-center h-[42px] px-4 text-sm font-extrabold ${busy ? 'bg-[#d7cebc] text-[#686c62]' : 'bg-[#4c5c3f] text-[#f8f4ea] cursor-pointer'}`}>
              Upload (PDF/DOCX)
              <input type="file" accept=".pdf,.docx,.txt,application/pdf" className="hidden" disabled={busy}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) loadFile(f); }} />
            </label>
          </div>
          <textarea value={source} onChange={(e) => setSource(e.target.value)} placeholder="…or paste the record here"
            className={`${INPUT} mt-2.5 h-40 resize-y ${MONO} text-[12px]`} />
          <div className="mt-3 flex flex-wrap justify-between items-center gap-3">
            <span className={`text-[13px] sm:text-xs ${tooLong ? 'text-[#C63C00] font-bold' : 'text-[#686c62]'}`}>
              {!source.trim() ? 'Nothing added yet.'
                : tooLong ? `Too long: ${parts} parts. Translate up to ${MAX_CHUNKS} parts at a time.`
                : `${source.length.toLocaleString('en-GB')} characters · uses ${parts} action${parts === 1 ? '' : 's'}${Number.isFinite(remaining) ? ` (you have ${remaining})` : ''}`}
            </span>
            <Btn variant="dark" className="h-[42px] px-5 text-[13px]" onClick={run}
              disabled={busy || !source.trim() || tooLong || parts > remaining}>
              {busy ? 'Translating…' : 'Translate record →'}
            </Btn>
          </div>
        </>
      )}

      {lines && (
        <>
          <p className="mt-2 text-[13px] leading-relaxed">
            Tick the lines you want on your CV. Edit anything first. Lines with a flag can&apos;t be ticked until the flag clears — you may be asked about any of these at interview.
          </p>
          {lines.length === 0 && <p className="mt-3 text-[13px] text-[#686c62]">No lines left to review.</p>}
          {CATEGORIES.map((cat) => {
            const rows = checked.map((l, i) => ({ ...l, i })).filter((l) => l.category === cat);
            if (!rows.length) return null;
            return (
              <div key={cat} className="mt-4">
                <div className={`${CAPS} text-[#686c62] pb-1.5 border-b-2 border-[#22251f]`}>{cat}</div>
                {rows.map((l) => {
                  const ok = l.usable;
                  return (
                    <div key={l.i} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2.5 py-3 border-b border-[#ede5d4]">
                      <button onClick={() => ok && patch(l.i, { ticked: !l.ticked })} disabled={!ok} aria-label="Tick line"
                        className={`mt-0.5 w-5 h-5 border-2 flex items-center justify-center text-[13px] sm:text-xs font-extrabold ${!ok ? 'border-[#d7cebc] cursor-not-allowed' : 'border-[#4c5c3f]'} ${ok && l.ticked ? 'bg-[#4c5c3f] text-[#f8f4ea]' : ''}`}>
                        {ok && l.ticked ? '✓' : ''}
                      </button>
                      <div className="min-w-0 flex flex-col gap-1.5">
                        <textarea value={l.mil} onChange={(e) => patch(l.i, { mil: e.target.value })} rows={2}
                          className="w-full text-[13px] leading-snug text-[#686c62] bg-transparent border-b border-[#ede5d4] focus:border-[#4c5c3f] outline-none resize-y" />
                        <div className="flex gap-2 items-start">
                          <span className={`${MONO} text-[#4c5c3f] pt-0.5`}>→</span>
                          <textarea value={l.civ} onChange={(e) => patch(l.i, { civ: e.target.value })} rows={2}
                            className="flex-1 text-sm font-semibold leading-snug bg-transparent border-b border-[#ede5d4] focus:border-[#4c5c3f] outline-none resize-y" />
                        </div>
                        {!l.found && <span className="text-xs sm:text-[11px] font-bold text-[#C63C00]">Can&apos;t find this wording in your record — edit it to match the original.</span>}
                        {l.numbersOk === false && <span className="text-xs sm:text-[11px] font-bold text-[#C63C00]">Number not in the original ({l.extraNumbers.join(', ')}) — check and edit.</span>}
                        {l.unresolved.map((ph) => (
                          <span key={ph} className="flex flex-wrap items-center gap-2 text-xs sm:text-[11px] font-bold text-[#C63C00]">
                            Inferred, not in the original: &ldquo;{ph}&rdquo; — remove it, or
                            <button onClick={() => patch(l.i, { confirmed: [...(l.confirmed || []), ph] })}
                              className="px-2 py-0.5 border border-[#C63C00] text-[#C63C00] uppercase tracking-[0.08em]">I can back this up</button>
                          </span>
                        ))}
                        {(l.confirmed || []).filter((c) => (l.added || []).includes(c)).map((c) => (
                          <span key={c} className="text-xs sm:text-[11px] text-[#4c5c3f]">&ldquo;{c}&rdquo; — confirmed by you, not in the original record</span>
                        ))}
                        {l.note && <span className="text-xs sm:text-[11px] text-[#8a5a1e]">{l.note}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={`${CAPS} text-[#686c62]`}>Also add to an evidence anchor · optional</span>
              <select value={anchorIdx} onChange={(e) => setAnchorIdx(e.target.value)} className={`${INPUT} w-auto min-w-[220px]`}>
                <option value="">— no, just my CV lines —</option>
                {anchors.map((a, i) => <option key={i} value={i}>{a.company || `Anchor ${i + 1}`}{a.period ? ` (${a.period})` : ''}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <SmallBtn onClick={() => { setLines(null); setResult(''); }}>Start again</SmallBtn>
              <SmallBtn dark onClick={addTicked} disabled={!tickedCount}>Add {tickedCount || ''} ticked to my CV</SmallBtn>
            </div>
          </div>
        </>
      )}
      {result && <p className="mt-3 text-[13px] sm:text-xs font-bold text-[#4c5c3f]">{result}</p>}
    </div>
  );
}
