'use client';

import { useState } from 'react';

export default function PaygoDocAssistant({
  compact = false,
  title = 'Start Here: Ask OpenAI',
  subtitle = 'Ask questions about the Demo App/Prototyping Platform.',
}) {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [sources, setSources] = useState([]);

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

  return (
    <div style={{ background: '#EFF4FF', borderRadius: 16, padding: compact ? 14 : 16 }}>
      <div style={{ color: '#10294D', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ marginTop: 6, color: '#4C5D74', fontSize: 14, lineHeight: '22px' }}>{subtitle}</div>

      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        <div style={{ border: '1px solid #D6E0F4', borderRadius: 12, overflow: 'hidden', background: '#FFFFFF' }}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={compact ? 3 : 4}
            placeholder="Ask questions about the Demo App/Prototyping Platform..."
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', padding: '12px 14px', color: '#10294D', fontSize: 14, lineHeight: '22px', fontFamily: 'inherit' }}
          />
          <div style={{ borderTop: '1px solid #E4ECFA', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#94A3B8', fontSize: 12 }}>Spec files are private and loaded server-side from Firebase.</span>
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
                <span
                  key={`${source.id}-${source.cite}`}
                  style={{ background: '#E1F5EE', color: '#0F6E56', borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 600 }}
                >
                  {source.cite} {source.title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
