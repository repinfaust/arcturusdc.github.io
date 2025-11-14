/**
 * Ruby Document Export Utilities
 * Handles PDF, HTML, Markdown exports and watermarking
 */

/**
 * Convert TipTap JSON to HTML with styling
 */
export function tiptapToHTML(tiptapJSON, options = {}) {
  const { includeWatermark = false, watermarkText = 'CONFIDENTIAL' } = options;
  
  // Simple converter - in production, use TipTap's HTML serializer
  function nodeToHTML(node) {
    if (!node) return '';
    
    switch (node.type) {
      case 'doc':
        return node.content?.map(child => nodeToHTML(child)).join('') || '';
      
      case 'paragraph':
        return `<p>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</p>`;
      
      case 'heading':
        const level = node.attrs?.level || 1;
        return `<h${level}>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</h${level}>`;
      
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach(mark => {
            switch (mark.type) {
              case 'bold':
                text = `<strong>${text}</strong>`;
                break;
              case 'italic':
                text = `<em>${text}</em>`;
                break;
              case 'code':
                text = `<code>${text}</code>`;
                break;
              case 'link':
                text = `<a href="${mark.attrs?.href || '#'}">${text}</a>`;
                break;
              case 'highlight':
                text = `<mark>${text}</mark>`;
                break;
            }
          });
        }
        return text;
      
      case 'bulletList':
        return `<ul>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</ul>`;
      
      case 'orderedList':
        return `<ol>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</ol>`;
      
      case 'listItem':
        return `<li>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</li>`;
      
      case 'blockquote':
        return `<blockquote>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</blockquote>`;
      
      case 'codeBlock':
        const language = node.attrs?.language || '';
        return `<pre><code class="language-${language}">${node.content?.map(child => child.text || '').join('') || ''}</code></pre>`;
      
      case 'image':
        return `<img src="${node.attrs?.src || ''}" alt="${node.attrs?.alt || ''}" />`;
      
      case 'table':
        return `<table>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</table>`;
      
      case 'tableRow':
        return `<tr>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</tr>`;
      
      case 'tableHeader':
        return `<th>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</th>`;
      
      case 'tableCell':
        return `<td>${node.content?.map(child => nodeToHTML(child)).join('') || ''}</td>`;
      
      case 'taskList':
        return `<ul class="task-list">${node.content?.map(child => nodeToHTML(child)).join('') || ''}</ul>`;
      
      case 'taskItem':
        const checked = node.attrs?.checked ? 'checked' : '';
        return `<li class="task-item"><input type="checkbox" ${checked} disabled />${node.content?.map(child => nodeToHTML(child)).join('') || ''}</li>`;
      
      case 'horizontalRule':
        return '<hr />';
      
      default:
        return node.content?.map(child => nodeToHTML(child)).join('') || '';
    }
  }
  
  const bodyContent = nodeToHTML(tiptapJSON);
  
  const watermarkHTML = includeWatermark
    ? `<div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; opacity: 0.1; font-size: 4rem; font-weight: bold; color: #000; display: flex; align-items: center; justify-content: center; transform: rotate(-45deg); z-index: 9999;">${watermarkText}</div>`
    : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Export</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: #fff;
    }
    h1 { font-size: 2.5rem; margin-top: 0; margin-bottom: 1rem; }
    h2 { font-size: 2rem; margin-top: 2rem; margin-bottom: 1rem; }
    h3 { font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    h4 { font-size: 1.25rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; }
    ul, ol { margin-bottom: 1rem; padding-left: 2rem; }
    li { margin-bottom: 0.5rem; }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #666;
      font-style: italic;
    }
    code {
      background: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      margin-bottom: 1rem;
    }
    pre code {
      background: none;
      padding: 0;
    }
    img {
      max-width: 100%;
      height: auto;
      margin: 1rem 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background: #f5f5f5;
      font-weight: 600;
    }
    .task-list {
      list-style: none;
      padding-left: 0;
    }
    .task-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .task-item input[type="checkbox"] {
      margin-top: 0.25rem;
    }
    mark {
      background: #ffeb3b;
      padding: 0.1em 0.2em;
    }
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    @media print {
      body { padding: 1rem; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${watermarkHTML}
  ${bodyContent}
</body>
</html>`;
}

/**
 * Convert TipTap JSON to Markdown
 */
export function tiptapToMarkdown(tiptapJSON) {
  function nodeToMarkdown(node, depth = 0) {
    if (!node) return '';
    
    switch (node.type) {
      case 'doc':
        return node.content?.map(child => nodeToMarkdown(child, depth)).join('\n\n') || '';
      
      case 'paragraph':
        const paraContent = node.content?.map(child => nodeToMarkdown(child, depth)).join('') || '';
        return paraContent || '\n';
      
      case 'heading':
        const level = node.attrs?.level || 1;
        const headingContent = node.content?.map(child => nodeToMarkdown(child, depth)).join('') || '';
        return `${'#'.repeat(level)} ${headingContent}`;
      
      case 'text':
        let text = node.text || '';
        if (node.marks) {
          node.marks.forEach(mark => {
            switch (mark.type) {
              case 'bold':
                text = `**${text}**`;
                break;
              case 'italic':
                text = `*${text}*`;
                break;
              case 'code':
                text = `\`${text}\``;
                break;
              case 'link':
                text = `[${text}](${mark.attrs?.href || '#'})`;
                break;
            }
          });
        }
        return text;
      
      case 'bulletList':
        return node.content?.map(child => nodeToMarkdown(child, depth + 1)).join('\n') || '';
      
      case 'orderedList':
        return node.content?.map((child, index) => nodeToMarkdown(child, depth + 1, index + 1)).join('\n') || '';
      
      case 'listItem':
        const prefix = depth > 0 ? '  '.repeat(depth - 1) + '- ' : '- ';
        return prefix + (node.content?.map(child => nodeToMarkdown(child, depth)).join('') || '');
      
      case 'blockquote':
        const quoteContent = node.content?.map(child => nodeToMarkdown(child, depth)).join('\n') || '';
        return quoteContent.split('\n').map(line => `> ${line}`).join('\n');
      
      case 'codeBlock':
        const language = node.attrs?.language || '';
        const codeContent = node.content?.map(child => child.text || '').join('') || '';
        return `\`\`\`${language}\n${codeContent}\n\`\`\``;
      
      case 'image':
        return `![${node.attrs?.alt || ''}](${node.attrs?.src || ''})`;
      
      case 'table':
        // Simple table conversion
        return node.content?.map(child => nodeToMarkdown(child, depth)).join('\n') || '';
      
      case 'tableRow':
        const cells = node.content?.map(child => nodeToMarkdown(child, depth)).filter(Boolean) || [];
        return '| ' + cells.join(' | ') + ' |';
      
      case 'tableHeader':
      case 'tableCell':
        return node.content?.map(child => nodeToMarkdown(child, depth)).join('') || '';
      
      case 'taskList':
        return node.content?.map(child => nodeToMarkdown(child, depth)).join('\n') || '';
      
      case 'taskItem':
        const checked = node.attrs?.checked ? '[x]' : '[ ]';
        return `${checked} ${node.content?.map(child => nodeToMarkdown(child, depth)).join('') || ''}`;
      
      case 'horizontalRule':
        return '---';
      
      default:
        return node.content?.map(child => nodeToMarkdown(child, depth)).join('') || '';
    }
  }
  
  return nodeToMarkdown(tiptapJSON);
}

/**
 * Export as HTML file
 */
export function exportAsHTML(tiptapJSON, filename, options = {}) {
  const html = tiptapToHTML(tiptapJSON, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export as Markdown file
 */
export function exportAsMarkdown(tiptapJSON, filename) {
  const markdown = tiptapToMarkdown(tiptapJSON);
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'document.md';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export as PDF using browser print (fallback)
 * For better PDF generation, use jsPDF or server-side rendering
 */
export function exportAsPDF(tiptapJSON, filename, options = {}) {
  // Create a temporary window with HTML content
  const html = tiptapToHTML(tiptapJSON, options);
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Optionally close after print dialog
      // printWindow.close();
    }, 250);
  };
}

