/**
 * Ruby Document Diff Utilities
 * Compares TipTap JSON documents and generates diffs
 */

/**
 * Convert TipTap JSON to plain text for comparison
 */
export function tiptapToText(tiptapJSON) {
  if (!tiptapJSON || !tiptapJSON.content) return '';

  function extractText(node) {
    if (!node) return '';
    
    if (node.type === 'text') {
      return node.text || '';
    }
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }
    
    return '';
  }

  return tiptapJSON.content.map(extractText).join('\n');
}

/**
 * Simple diff algorithm - compares two text strings line by line
 * Returns array of { type: 'equal'|'insert'|'delete', value: string, lineNumber: number }
 */
export function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const diff = [];
  let oldIndex = 0;
  let newIndex = 0;
  let lineNumber = 1;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Only new lines left
      diff.push({ type: 'insert', value: newLines[newIndex], lineNumber });
      newIndex++;
      lineNumber++;
    } else if (newIndex >= newLines.length) {
      // Only old lines left
      diff.push({ type: 'delete', value: oldLines[oldIndex], lineNumber });
      oldIndex++;
      lineNumber++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines match
      diff.push({ type: 'equal', value: oldLines[oldIndex], lineNumber });
      oldIndex++;
      newIndex++;
      lineNumber++;
    } else {
      // Lines differ - check if it's an insertion or deletion
      // Simple heuristic: if next old line matches current new line, it's a deletion
      // If next new line matches current old line, it's an insertion
      if (oldIndex + 1 < oldLines.length && oldLines[oldIndex + 1] === newLines[newIndex]) {
        diff.push({ type: 'delete', value: oldLines[oldIndex], lineNumber });
        oldIndex++;
        lineNumber++;
      } else if (newIndex + 1 < newLines.length && oldLines[oldIndex] === newLines[newIndex + 1]) {
        diff.push({ type: 'insert', value: newLines[newIndex], lineNumber });
        newIndex++;
        lineNumber++;
      } else {
        // Both changed
        diff.push({ type: 'delete', value: oldLines[oldIndex], lineNumber });
        diff.push({ type: 'insert', value: newLines[newIndex], lineNumber: lineNumber + 0.5 });
        oldIndex++;
        newIndex++;
        lineNumber++;
      }
    }
  }

  return diff;
}

/**
 * Generate natural language summary of changes
 */
export function generateChangeSummary(diff) {
  const stats = {
    insertions: 0,
    deletions: 0,
    modifications: 0,
  };

  diff.forEach((item) => {
    if (item.type === 'insert') stats.insertions++;
    if (item.type === 'delete') stats.deletions++;
  });

  // Count modifications (adjacent delete+insert pairs)
  for (let i = 0; i < diff.length - 1; i++) {
    if (diff[i].type === 'delete' && diff[i + 1].type === 'insert') {
      stats.modifications++;
      stats.insertions--;
      stats.deletions--;
    }
  }

  const summary = [];
  
  if (stats.insertions > 0) {
    summary.push(`${stats.insertions} line${stats.insertions !== 1 ? 's' : ''} added`);
  }
  if (stats.deletions > 0) {
    summary.push(`${stats.deletions} line${stats.deletions !== 1 ? 's' : ''} removed`);
  }
  if (stats.modifications > 0) {
    summary.push(`${stats.modifications} line${stats.modifications !== 1 ? 's' : ''} modified`);
  }

  if (summary.length === 0) {
    return 'No changes detected';
  }

  return summary.join(', ');
}

/**
 * Compare two TipTap JSON documents
 */
export function compareDocuments(oldDoc, newDoc) {
  const oldText = tiptapToText(oldDoc);
  const newText = tiptapToText(newDoc);
  const diff = computeDiff(oldText, newText);
  const summary = generateChangeSummary(diff);

  return {
    diff,
    summary,
    stats: {
      totalLines: Math.max(oldText.split('\n').length, newText.split('\n').length),
      changedLines: diff.filter(d => d.type !== 'equal').length,
      insertions: diff.filter(d => d.type === 'insert').length,
      deletions: diff.filter(d => d.type === 'delete').length,
    },
  };
}

