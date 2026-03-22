'use client';

import { useMemo, useState } from 'react';

const DEFAULT_QUESTIONS = [
  'What are the strongest arguments for building SoRR Control rather than buying an off-the-shelf solution?',
  'Where do the documents agree and disagree on implementation approach?',
  'What are likely stakeholder objections and how should we address them?',
  'Summarise the business case for a CPO in three bullet points.',
];

function typeColor(type) {
  if (type === 'PDF') return '#9A3D08';
  if (type === 'DOCX') return '#1E40AF';
  if (type === 'PPTX') return '#9A3412';
  return '#0F6E56';
}

export default function PocDocAssistant({ compact = false, title = 'POC Analysis', subtitle = 'Ask questions across the SoRR POC context and document set.' }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);
  const [docs, setDocs] = useState([]);
  const [fetchedDocs, setFetchedDocs] = useState(false);

  const presets = useMemo(() => (compact ? DEFAULT_QUESTIONS.slice(0, 2) : DEFAULT_QUESTIONS), [compact]);

  async function ensureDocsLoaded() {
    if (fetchedDocs) return;
    const response = await fetch('/api/sorr/controlui/poc-analysis', { method: 'GET' });
    const payload = await response.json();
    if (response.ok) {
      setDocs(Array.isArray(payload.docs) ? payload.docs : []);
      setFetchedDocs(true);
      return;
    }
    throw new Error(payload.error || 'Failed to load docs');
  }

  async function runAnalysis() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);
    try {
      await ensureDocsLoaded();
      const response = await fetch('/api/sorr/controlui/poc-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Analysis failed');
      }
      setAnswer(payload.answer || '');
      setSources(Array.isArray(payload.sources) ? payload.sources : []);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: compact ? 12 : 0, background: '#EFF4FF', borderRadius: 16, padding: compact ? 14 : 16 }}>
      <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14, lineHeight: '22px' }}>{subtitle}</div>

      {!compact && (
        <div style={{ marginTop: 14 }}>
          <div style={{ color: '#94A3B8', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Documents</div>
          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {[
              {
                title: 'SoRR Control Product POC Build Spec',
                href: '/docs/sorr/sorr-control-product-poc-build-spec.md',
                type: 'MD',
              },
              {
                title: 'SoRR Control V0 Spec',
                href: '/docs/sorr/sorr-control-v0-spec.md',
                type: 'MD',
              },
              {
                title: 'Compass Workflow Artifact',
                href: '/docs/sorr/compass-artifact.md',
                type: 'MD',
              },
              {
                title: 'CPO AI Rollout Strategy Considerations',
                href: '/docs/sorr/cpo-ai-rollout-strategy-considerations.pdf',
                type: 'PDF',
              },
              {
                title: 'SoRR Control Internal Business Case',
                href: '/docs/sorr/sorr-control-internal-business-case.docx',
                type: 'DOCX',
              },
              {
                title: 'SoRR Control Pitch Deck',
                href: '/docs/sorr/sorr-control-pitch-deck.pptx',
                type: 'PPTX',
              },
            ].map((doc) => (
              <a
                key={doc.href}
                href={doc.href}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: 'none',
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: '1px solid #D6E0F4',
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <span style={{ color: '#10294D', fontSize: 14 }}>{doc.title}</span>
                <span style={{ color: typeColor(doc.type), fontWeight: 700, fontSize: 12 }}>{doc.type}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuestion(preset)}
              style={{
                border: '1px solid #D6E0F4',
                background: '#FFFFFF',
                borderRadius: 999,
                padding: '6px 10px',
                color: '#4C5D74',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {preset}
            </button>
          ))}
        </div>

        <div style={{ border: '1px solid #D6E0F4', borderRadius: 12, overflow: 'hidden', background: '#FFFFFF' }}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={compact ? 3 : 4}
            placeholder="Ask for a summary, comparison, or key takeaways from the docs/deck..."
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              resize: 'vertical',
              padding: '12px 14px',
              color: '#10294D',
              fontSize: 14,
              lineHeight: '22px',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ borderTop: '1px solid #E4ECFA', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>
              {compact ? 'Discovery shortcut: summarise across the docs/deck to understand SoRR Control.' : 'Uses POC context + markdown docs. PDF/DOCX/PPTX are listed and linkable.'}
            </span>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading || question.trim().length === 0}
              style={{
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                background: loading || question.trim().length === 0 ? '#CAD5EB' : '#10294D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 12,
                cursor: loading || question.trim().length === 0 ? 'default' : 'pointer',
              }}
            >
              {loading ? 'Analysing...' : 'Ask OpenAI'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 10, background: '#FFEFE3', border: '1px solid #FFD3BD', borderRadius: 10, padding: '10px 12px', color: '#9A3D08', fontSize: 13 }}>
          {error}
        </div>
      ) : null}

      {answer ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#10294D', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Answer</div>
          <div style={{ background: '#FFFFFF', border: '1px solid #D6E0F4', borderRadius: 12, padding: '12px 14px', color: '#334155', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: '22px' }}>
            {answer}
          </div>
          {sources.length > 0 ? (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sources.map((source) => (
                <a
                  key={`${source.id}-${source.cite}`}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: 'none',
                    background: '#E1F5EE',
                    color: '#0F6E56',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {source.cite} {source.title}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
