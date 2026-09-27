// Print a Markdown CV / letter as an A4 PDF via the browser print dialog.
// Shared by Career Ops and Squared (client-side only).

/* Minimal, ATS-friendly Markdown -> HTML for the print/PDF view.
   Produces selectable text, single column, standard headings. The AI output
   often includes a CV + cover note + rationale; we only print up to the
   "rationale"/"cover note" boundary if present, else the whole thing. */
function markdownToPrintHtml(md) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

  const lines = (md || '').split('\n');
  const out = [];
  let inList = false, inTable = false;
  const closeList = () => { if (inList) { out.push('</ul>'); inList = false; } };
  const closeTable = () => { if (inTable) { out.push('</tbody></table>'); inTable = false; } };

  for (let raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*$/.test(line)) { closeList(); continue; }
    if (/^#{1,6}\s/.test(line)) {
      closeList(); closeTable();
      const level = Math.min(line.match(/^#+/)[0].length, 4);
      out.push(`<h${level}>${inline(line.replace(/^#+\s/, ''))}</h${level}>`);
    } else if (/^\s*[-*]\s+/.test(line)) {
      closeTable();
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`);
    } else if (/^\|.*\|$/.test(line)) {
      closeList();
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (/^[-:\s|]+$/.test(line.replace(/\|/g, ''))) continue; // separator row
      if (!inTable) { out.push('<table><tbody>'); inTable = true; }
      out.push('<tr>' + cells.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>');
    } else if (/^>\s?/.test(line)) {
      closeList(); closeTable();
      out.push(`<blockquote>${inline(line.replace(/^>\s?/, ''))}</blockquote>`);
    } else if (/^---+$/.test(line)) {
      closeList(); closeTable(); out.push('<hr/>');
    } else {
      closeList(); closeTable();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList(); closeTable();
  return out.join('\n');
}

export function printCvAsPdf({ name = 'Candidate', role = 'Role', cvMarkdown = '' }) {
  const w = window.open('', '_blank');
  if (!w) { alert('Please allow pop-ups to download the PDF.'); return; }
  const body = markdownToPrintHtml(cvMarkdown);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${name} — ${role}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#111; font-size:11pt; line-height:1.45; max-width: 800px; margin: 0 auto; }
    h1 { font-size: 20pt; margin: 0 0 2pt; }
    h2 { font-size: 12.5pt; margin: 16pt 0 4pt; border-bottom:1px solid #ccc; padding-bottom:2pt; }
    h3 { font-size: 11pt; margin: 10pt 0 3pt; color:#333; }
    h4 { font-size: 10.5pt; margin: 8pt 0 2pt; }
    p { margin: 4pt 0; }
    ul { margin: 4pt 0; padding-left: 18pt; }
    li { margin: 2pt 0; }
    table { width:100%; border-collapse: collapse; margin: 6pt 0; font-size:10pt; }
    td { border:1px solid #ddd; padding: 4pt 6pt; vertical-align: top; }
    blockquote { margin: 6pt 0; padding: 4pt 10pt; border-left:3px solid #006C50; color:#333; }
    code { background:#f3f3f3; padding:1px 4px; border-radius:3px; }
    hr { border:none; border-top:1px solid #ddd; margin: 10pt 0; }
    @media print { body { max-width:none; } }
  </style></head><body>${body}
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
  </body></html>`);
  w.document.close();
}
