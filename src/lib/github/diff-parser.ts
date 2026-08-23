export interface ParsedDiffLine {
  type: 'add' | 'delete' | 'context';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  position: number; // GitHub comment position index within the patch
  content: string;
}

export interface ParsedFileDiff {
  filename: string;
  oldFilename?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  patch: string;
  additions: number;
  deletions: number;
  lines: ParsedDiffLine[];
}

export function parseUnifiedDiff(rawDiff: string): ParsedFileDiff[] {
  if (!rawDiff || typeof rawDiff !== 'string') return [];

  const files: ParsedFileDiff[] = [];
  const rawFileDiffs = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const rawFile of rawFileDiffs) {
    const lines = rawFile.split('\n');
    let filename = '';
    let oldFilename = '';
    let status: ParsedFileDiff['status'] = 'modified';
    let additions = 0;
    let deletions = 0;
    const parsedLines: ParsedDiffLine[] = [];

    // Parse header lines
    for (const line of lines) {
      if (line.startsWith('--- a/')) {
        oldFilename = line.substring(6).trim();
      } else if (line.startsWith('+++ b/')) {
        filename = line.substring(6).trim();
      } else if (line.startsWith('new file mode')) {
        status = 'added';
      } else if (line.startsWith('deleted file mode')) {
        status = 'deleted';
      } else if (line.startsWith('rename from')) {
        status = 'renamed';
      }
    }

    if (!filename && oldFilename) filename = oldFilename;
    if (!filename) {
      const match = lines[0]?.match(/a\/(.*?)\s+b\/(.*)/);
      if (match) {
        filename = match[2];
        oldFilename = match[1];
      } else {
        continue;
      }
    }

    // Parse hunks and lines
    let currentOldLine = 0;
    let currentNewLine = 0;
    let position = 0;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        // Hunk header e.g. @@ -12,6 +12,8 @@
        const hunkMatch = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (hunkMatch) {
          currentOldLine = parseInt(hunkMatch[1], 10);
          currentNewLine = parseInt(hunkMatch[2], 10);
        }
        position++;
        continue;
      }

      if (position > 0) {
        if (line.startsWith('+')) {
          additions++;
          parsedLines.push({
            type: 'add',
            oldLineNumber: null,
            newLineNumber: currentNewLine,
            position,
            content: line.substring(1),
          });
          currentNewLine++;
          position++;
        } else if (line.startsWith('-')) {
          deletions++;
          parsedLines.push({
            type: 'delete',
            oldLineNumber: currentOldLine,
            newLineNumber: null,
            position,
            content: line.substring(1),
          });
          currentOldLine++;
          position++;
        } else if (line.startsWith(' ') || line === '') {
          parsedLines.push({
            type: 'context',
            oldLineNumber: currentOldLine,
            newLineNumber: currentNewLine,
            position,
            content: line.startsWith(' ') ? line.substring(1) : line,
          });
          currentOldLine++;
          currentNewLine++;
          position++;
        }
      }
    }

    files.push({
      filename,
      oldFilename: oldFilename !== filename ? oldFilename : undefined,
      status,
      patch: rawFile,
      additions,
      deletions,
      lines: parsedLines,
    });
  }

  return files;
}
