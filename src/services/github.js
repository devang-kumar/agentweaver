/**
 * GitHub REST API service.
 * Automates creating repositories and committing code directly from the browser.
 */

/**
 * Creates a repository and pushes a set of files to GitHub.
 * @param {object} params
 * @param {string} params.token    - GitHub Personal Access Token (PAT)
 * @param {string} params.owner    - Username
 * @param {string} params.repo     - Target repository name
 * @param {object} params.files    - Map of { "filename": "content" }
 * @param {Function} [params.onProgress]
 */
export async function pushToGitHub({ token, owner, repo, files, onProgress }) {
  const headers = {
    Authorization: `token ${token.trim()}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Create Repository (ignore if already exists)
  onProgress?.('Verifying GitHub repository…');
  try {
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: repo,
        description: 'Auto-generated ML solution powered by AgentWeaver.',
        private: false,
        auto_init: true, // creates default main branch immediately
      }),
    });

    if (createRes.status === 201) {
      onProgress?.('Created new repository!');
      // Wait for repository initialization
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (err) {
    // Repo might exist, proceed to commit files
  }

  // 2. Commit Files one by one
  for (const [path, content] of Object.entries(files)) {
    onProgress?.(`Pushing ${path} to main branch…`);

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

    // Get current SHA (if file exists)
    let sha = null;
    try {
      const getRes = await fetch(url, { headers });
      if (getRes.ok) {
        const getJson = await getRes.json();
        sha = getJson.sha;
      }
    } catch {}

    // Put file content (base64 encoded)
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    // Safe Base64 encoder for browsers
    let base64Content = '';
    const chunk = 0xffff;
    for (let i = 0; i < bytes.length; i += chunk) {
      const sub = bytes.subarray(i, i + chunk);
      base64Content += String.fromCharCode.apply(null, sub);
    }
    base64Content = btoa(base64Content);

    const body = {
      message: `Deploy: added ${path} via AgentWeaver Platform`,
      content: base64Content,
      ...(sha ? { sha } : {}),
      branch: 'main',
    };

    const putRes = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const errJson = await putRes.json().catch(() => ({}));
      throw new Error(`Failed to write ${path}: ${errJson.message || putRes.statusText}`);
    }
  }

  onProgress?.('Successfully deployed code & metrics to GitHub!');
  return `https://github.com/${owner}/${repo}`;
}
