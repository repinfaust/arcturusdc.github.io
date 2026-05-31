'use client';

// Extract plain text from an uploaded CV file (PDF or DOCX) in the browser.
// Dynamic imports keep these heavy libs out of the main bundle and off the server.

export async function extractCvText(file) {
  const name = (file?.name || '').toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    return extractPdf(file);
  }
  if (name.endsWith('.docx') || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return extractDocx(file);
  }
  if (name.endsWith('.txt') || file.type === 'text/plain') {
    return (await file.text()).trim();
  }
  throw new Error('Unsupported file type. Please upload a PDF, DOCX, or paste the text.');
}

async function extractPdf(file) {
  const pdfjs = await import('pdfjs-dist');
  // Point the worker at the CDN build matching the installed version — avoids
  // the bundler having to resolve the worker file (which fails in Next).
  pdfjs.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  let text = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    text += content.items.map((i) => i.str).join(' ') + '\n';
  }
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function extractDocx(file) {
  const mammoth = await import('mammoth');
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || '').replace(/\n{3,}/g, '\n\n').trim();
}
