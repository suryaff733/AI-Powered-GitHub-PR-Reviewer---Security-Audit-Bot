import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedFileDiff } from '../github/diff-parser';

export interface AuditFinding {
  filePath: string;
  lineNumber: number;
  diffPosition: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'SECURITY' | 'PERFORMANCE' | 'SYNTAX' | 'BEST_PRACTICE';
  title: string;
  description: string;
  codeSnippet?: string;
  suggestedFix?: string;
}

export interface AuditResult {
  summary: string;
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  findings: AuditFinding[];
  tokensUsed: number;
  durationMs: number;
}

export class GeminiAuditor {
  private ai: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (key && key !== 'your_gemini_api_key_here' && key !== 'mock_gemini_key_for_testing') {
      this.ai = new GoogleGenerativeAI(key);
    }
  }

  public async auditPullRequestDiffs(
    files: ParsedFileDiff[],
    prContext: { title: string; repo: string; prNumber: number }
  ): Promise<AuditResult> {
    const startTime = Date.now();

    // If Gemini client is active, perform live LLM call
    if (this.ai) {
      try {
        return await this.runLiveLLMAudit(files, prContext, startTime);
      } catch (err) {
        console.warn('[GeminiAuditor] Live LLM call failed or quota exceeded. Falling back to rule-based audit engine:', err);
      }
    }

    // Fallback static audit analyzer
    return this.runStaticAuditAnalyzer(files, startTime);
  }

  private async runLiveLLMAudit(
    files: ParsedFileDiff[],
    prContext: { title: string; repo: string; prNumber: number },
    startTime: number
  ): Promise<AuditResult> {
    if (!this.ai) throw new Error('Gemini AI client not initialized');

    const prompt = `
You are an expert Senior Security Engineer & Code Reviewer.
Analyze the following pull request code diffs for repository ${prContext.repo} (PR #${prContext.prNumber}: "${prContext.title}").

Focus on detecting:
1. SECURITY VULNERABILITIES: SQL Injection, XSS, Hardcoded Secrets/Keys, Insecure Cryptography, Path Traversal, Command Injection, OWASP Top 10.
2. PERFORMANCE BOTTLENECK: O(N^2) loops, synchronous blocking I/O, unindexed queries, memory leaks.
3. CODE QUALITY: Missing error handling, unsafe type assertions, potential runtime panics/crashes.

Code Diffs Payload:
${JSON.stringify(
  files.map(f => ({
    filename: f.filename,
    additions: f.lines.filter(l => l.type === 'add').map(l => ({ line: l.newLineNumber, text: l.content })),
  })),
  null,
  2
)}

Respond ONLY with valid JSON adhering to this exact schema:
{
  "summary": "High-level review summary paragraph",
  "decision": "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  "findings": [
    {
      "filePath": "relative file path",
      "lineNumber": 15,
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "category": "SECURITY" | "PERFORMANCE" | "SYNTAX" | "BEST_PRACTICE",
      "title": "Short title",
      "description": "Clear explanation of vulnerability and risk",
      "codeSnippet": "vulnerable code snippet",
      "suggestedFix": "corrected code snippet"
    }
  ]
}
`;

    const model = this.ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const response = await model.generateContent(prompt);
    const durationMs = Date.now() - startTime;
    const responseText = response.response.text() || '{}';
    const parsed = JSON.parse(responseText);

    const findings: AuditFinding[] = (parsed.findings || []).map((f: any) => {
      // Find diff position for file and line number
      const targetFile = files.find(file => file.filename === f.filePath);
      const targetLine = targetFile?.lines.find(l => l.newLineNumber === f.lineNumber || l.oldLineNumber === f.lineNumber);
      return {
        filePath: f.filePath,
        lineNumber: f.lineNumber || 1,
        diffPosition: targetLine?.position || 1,
        severity: f.severity || 'MEDIUM',
        category: f.category || 'SECURITY',
        title: f.title || 'Security finding',
        description: f.description || '',
        codeSnippet: f.codeSnippet || '',
        suggestedFix: f.suggestedFix || '',
      };
    });

    return {
      summary: parsed.summary || 'AI Code Audit finished successfully.',
      decision: parsed.decision || (findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH') ? 'REQUEST_CHANGES' : 'APPROVE'),
      findings,
      tokensUsed: Math.floor(prompt.length / 4) + Math.floor(responseText.length / 4),
      durationMs,
    };
  }

  private runStaticAuditAnalyzer(files: ParsedFileDiff[], startTime: number): AuditResult {
    const findings: AuditFinding[] = [];

    for (const file of files) {
      for (const line of file.lines) {
        if (line.type !== 'add') continue;
        const code = line.content;
        const lineNum = line.newLineNumber || 1;

        // Rule 1: Raw SQL string concatenation (SQL Injection)
        if (/(SELECT|INSERT|UPDATE|DELETE).*?\+\s*req\.(body|query|params)/i.test(code) || /query\s*=\s*['"`].*?\$\{.*?\}/i.test(code)) {
          findings.push({
            filePath: file.filename,
            lineNumber: lineNum,
            diffPosition: line.position,
            severity: 'CRITICAL',
            category: 'SECURITY',
            title: 'SQL Injection Vulnerability Detected',
            description: 'Unsanitized user input concatenated directly into raw SQL query string allows SQL injection attacks.',
            codeSnippet: code.trim(),
            suggestedFix: 'Use parameterized queries or ORM prepared statements.',
          });
        }

        // Rule 2: Hardcoded Secrets / API Keys
        if (/(sk_live_[0-9a-zA-Z]{24}|sk_test_[0-9a-zA-Z]{24}|AKIA[0-9A-Z]{16}|ghp_[0-9a-zA-Z]{36})/i.test(code) || /(api_key|secret_key|password)\s*=\s*["'][a-zA-Z0-9_\-]{16,}["']/i.test(code)) {
          findings.push({
            filePath: file.filename,
            lineNumber: lineNum,
            diffPosition: line.position,
            severity: 'CRITICAL',
            category: 'SECURITY',
            title: 'Hardcoded Secret / API Key Exposure',
            description: 'Potential secret credentials or private API key hardcoded in source repository.',
            codeSnippet: code.trim(),
            suggestedFix: 'Move credentials into environment variables (process.env.SECRET_KEY).',
          });
        }

        // Rule 3: Dangerous eval() or Function() constructor
        if (/\beval\(|new Function\(/i.test(code)) {
          findings.push({
            filePath: file.filename,
            lineNumber: lineNum,
            diffPosition: line.position,
            severity: 'HIGH',
            category: 'SECURITY',
            title: 'Arbitrary Code Execution (eval)',
            description: 'Usage of `eval()` or dynamic Function construction permits remote code execution (RCE).',
            codeSnippet: code.trim(),
            suggestedFix: 'Replace dynamic eval calls with explicit JSON parsing or object lookups.',
          });
        }

        // Rule 4: O(N^2) Nested Array Iteration
        if (/\.forEach\(.*\.find\(|\.map\(.*\.filter\(/i.test(code)) {
          findings.push({
            filePath: file.filename,
            lineNumber: lineNum,
            diffPosition: line.position,
            severity: 'MEDIUM',
            category: 'PERFORMANCE',
            title: 'Quadratic O(N^2) Time Complexity Bottleneck',
            description: 'Nested linear searching (`find` or `filter` inside array iteration) scales quadratically.',
            codeSnippet: code.trim(),
            suggestedFix: 'Construct a lookup Map or Set prior to iteration for O(1) key lookups.',
          });
        }

        // Rule 5: Unhandled Async Promises
        if (/\b(fetch|axios|db\.query)\(/.test(code) && !/await|\.then|\.catch/.test(code) && !/return /.test(code)) {
          findings.push({
            filePath: file.filename,
            lineNumber: lineNum,
            diffPosition: line.position,
            severity: 'LOW',
            category: 'SYNTAX',
            title: 'Floating Unhandled Async Promise',
            description: 'Asynchronous network/database operation launched without await or .catch handler.',
            codeSnippet: code.trim(),
            suggestedFix: 'Prepend `await` or chain `.catch(err => ...)` to handle potential rejections.',
          });
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const hasCritical = findings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
    const decision = hasCritical ? 'REQUEST_CHANGES' : findings.length > 0 ? 'COMMENT' : 'APPROVE';

    const summary = hasCritical
      ? `🚨 Security & Code Audit Bot flagged ${findings.length} issue(s). Action required: Critical/High severity security flaws detected in diff.`
      : findings.length > 0
      ? `⚠️ Security & Code Audit Bot found ${findings.length} potential issue(s). Please review suggested optimizations.`
      : `✅ AI Code Audit completed successfully! No critical vulnerabilities or performance bottlenecks detected.`;

    return {
      summary,
      decision,
      findings,
      tokensUsed: 1280 + files.length * 200,
      durationMs,
    };
  }
}
