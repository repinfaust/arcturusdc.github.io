'use client';

import { useMemo, useState } from 'react';

const DEFAULT_QUESTIONS = [
  'What are the most important POC constraints we should not violate?',
  'Summarise the six profile strategy across UK, IE, and US in plain language.',
  'What are likely stakeholder objections and how should we answer them?',
  'What should we demo first in under 5 minutes?',
];

function typeColor(type) {
  if (type === 'XLSX') return '#0F6E56';
  return '#1E40AF';
}

export default function PaygoDocAssistant({ compact = false, title = 'Start Here: Ask OpenAI', subtitle = 'Ask questions across the PAYGO POC build specs.' }) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);

  const presets = useMemo(() => (compact ? DEFAULT_QUESTIONS.slice(0, 2) : DEFAULT_QUESTIONS), [compact]);

  async function runAnalysis() {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError('');
    setAnswer('');
    setSources([]);

    try {
      const response = await fetch('/api/stea/paygo/poc-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Analysis failed');
      setAnswer(payload.answer || '');
      setSources(Array.isArray(payload.sources) ? payload.sources : []);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  const docCards = [
    { title: 'PAYGO POC Build Spec v02', href: '/docs/paygo/paygo_poc_build_spec_v02.md', type: 'MD' },
    { title: 'PAYG POC Build Spec', href: '/docs/paygo/payg_poc_build_spec.md', type: 'MD' },
    { title: 'PAYGO AI Analyst Spec', href: '/docs/paygo/paygo_ai_analyst_spec.md', type: 'MD' },
    { title: 'PAYGO Seed Data v4', href: '/docs/paygo/payg_seed_data_v4.xlsx', type: 'XLSX' },
  ];

  return (
    <div style={{ background: '#EFF4FF', borderRadius: 16, padding: compact ? 14 : 16 }}>
      <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14, lineHeight: '22px' }}>{subtitle}</div>

      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {docCards.map((doc) => (
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

      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setQuestion(preset)}
              style={{ border: '1px solid #D6E0F4', background: '#FFFFFF', borderRadius: 999, padding: '6px 10px', color: '#4C5D74', fontSize: 12, cursor: 'pointer' }}
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
            placeholder="Ask a question about the PAYGO POC/build specs..."
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', padding: '12px 14px', color: '#10294D', fontSize: 14, lineHeight: '22px', fontFamily: 'inherit' }}
          />
          <div style={{ borderTop: '1px solid #E4ECFA', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>Uses PAYGO markdown build specs as context.</span>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={loading || question.trim().length === 0}
              style={{ border: 'none', borderRadius: 8, padding: '8px 14px', background: loading || question.trim().length === 0 ? '#CAD5EB' : '#10294D', color: '#FFFFFF', fontWeight: 700, fontSize: 12, cursor: loading || question.trim().length === 0 ? 'default' : 'pointer' }}
            >
              {loading ? 'Analysing...' : 'Ask OpenAI'}
            </button>
          </div>
        </div>
      </div>

      {error ? <div style={{ marginTop: 10, background: '#FFEFE3', border: '1px solid #FFD3BD', borderRadius: 10, padding: '10px 12px', color: '#9A3D08', fontSize: 13 }}>{error}</div> : null}

      {answer ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: '#10294D', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Answer</div>
          <div style={{ background: '#FFFFFF', border: '1px solid #D6E0F4', borderRadius: 12, padding: '12px 14px', color: '#334155', fontSize: 14, whiteSpace: 'pre-wrap', lineHeight: '22px' }}>{answer}</div>
          {sources.length > 0 ? (
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sources.map((source) => (
                <a
                  key={`${source.id}-${source.cite}`}
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', background: '#E1F5EE', color: '#0F6E56', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}
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
