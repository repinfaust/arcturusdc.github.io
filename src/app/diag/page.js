export const revalidate = 0; // disable ISR so we can see live server time

export default function DiagPage() {
  const ts = new Date().toISOString();
  return (
    <main style={{padding:'2rem', fontFamily:'ui-sans-serif, system-ui'}}>
      <h1 style={{fontSize:'1.5rem', fontWeight:700}}>Next.js Runtime Check</h1>
      <p>Server time (should change on refresh): <code>{ts}</code></p>
      <p>Tailwind test: <span className="px-2 py-1 rounded bg-red-600 text-white">brand</span></p>
    </main>
  );
}
