import { Octokit } from '@octokit/rest';

export interface InlineComment {
  path: string;
  line: number;
  side?: 'RIGHT' | 'LEFT';
  body: string;
}

export class GitHubClient {
  private octokit: Octokit | null = null;

  constructor(token?: string) {
    const ghToken = token || process.env.GITHUB_TOKEN;
    if (ghToken && ghToken !== 'your_github_personal_access_token_here' && ghToken !== 'mock_github_token_for_testing') {
      this.octokit = new Octokit({ auth: ghToken });
    }
  }

  public isConfigured(): boolean {
    return this.octokit !== null;
  }

  public async fetchPullRequestFiles(owner: string, repo: string, pullNumber: number) {
    if (!this.octokit) {
      console.log(`[Mock GitHubClient] Fetching PR files for ${owner}/${repo}#${pullNumber}`);
      return [
        {
          filename: 'src/controllers/auth.ts',
          status: 'modified',
          additions: 15,
          deletions: 3,
          patch: `@@ -20,6 +20,15 @@ export async function loginUser(req: Request, res: Response) {\n-  const query = "SELECT * FROM users WHERE email = ?";\n+  // Vulnerable raw query string concatenation\n+  const query = "SELECT * FROM users WHERE email = '" + req.body.email + "' AND password = '" + req.body.password + "'";\n+  const user = await db.query(query);\n+  return res.json(user);\n }`,
        },
      ];
    }

    const { data } = await this.octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    return data.map(file => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch || '',
    }));
  }

  public async postPullRequestReview(
    owner: string,
    repo: string,
    pullNumber: number,
    commitSha: string,
    event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
    body: string,
    comments: InlineComment[] = []
  ) {
    if (!this.octokit) {
      console.log(`[Mock GitHubClient] Posting PR Review for ${owner}/${repo}#${pullNumber} (${event}):`);
      console.log(`Summary: ${body}`);
      console.log(`Comments count: ${comments.length}`);
      return { id: 9999, html_url: `https://github.com/${owner}/${repo}/pull/${pullNumber}` };
    }

    const response = await this.octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitSha,
      event,
      body,
      comments: comments.map(c => ({
        path: c.path,
        line: c.line,
        side: c.side || 'RIGHT',
        body: c.body,
      })),
    });

    return response.data;
  }

  public async updateCommitStatus(
    owner: string,
    repo: string,
    sha: string,
    state: 'error' | 'failure' | 'pending' | 'success',
    description: string,
    targetUrl?: string
  ) {
    if (!this.octokit) {
      console.log(`[Mock GitHubClient] Set commit status for ${owner}/${repo}@${sha}: ${state} - ${description}`);
      return;
    }

    await this.octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      context: 'AI Audit Bot / Security & Code Check',
      description,
      target_url: targetUrl,
    });
  }
}
