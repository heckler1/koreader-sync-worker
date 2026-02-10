// KOReader Sync Server — Landing Page

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KOReader Sync Server — API Reference</title>
<link rel="icon" href="/favicon.ico" type="image/svg+xml">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    color: #1a1a1a;
    background: #fafafa;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 720px; margin: 0 auto; padding: 48px 24px 96px; }
  h1 { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
  .subtitle { color: #666; font-size: 0.95rem; margin-bottom: 40px; }
  h2 {
    font-size: 1.1rem; font-weight: 600; letter-spacing: -0.01em;
    margin-top: 48px; margin-bottom: 16px;
    padding-bottom: 8px; border-bottom: 1px solid #e0e0e0;
  }
  p { margin-bottom: 12px; color: #333; font-size: 0.925rem; }
  .endpoint {
    background: #fff; border: 1px solid #e0e0e0; border-radius: 6px;
    margin-bottom: 24px; overflow: hidden;
  }
  .endpoint-header {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px; border-bottom: 1px solid #e8e8e8; background: #f6f6f6;
  }
  .method {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 3px;
    background: #1a1a1a; color: #fff; letter-spacing: 0.03em;
  }
  .method.get { background: #2563eb; }
  .method.put { background: #d97706; }
  .method.post { background: #16a34a; }
  .path {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    font-size: 0.875rem; color: #333;
  }
  .endpoint-body { padding: 16px; }
  .endpoint-body h4 {
    font-size: 0.8rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: #888; margin-bottom: 6px; margin-top: 14px;
  }
  .endpoint-body h4:first-child { margin-top: 0; }
  pre {
    background: #1a1a1a; color: #d4d4d4; padding: 14px 16px; border-radius: 4px;
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    font-size: 0.8rem; line-height: 1.5; overflow-x: auto; margin-bottom: 8px;
    white-space: pre; word-wrap: normal;
  }
  pre .c { color: #6a9955; }
  pre .s { color: #ce9178; }
  pre .k { color: #569cd6; }
  code {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    font-size: 0.85em; background: #eee; padding: 2px 5px; border-radius: 3px;
  }
  .note {
    font-size: 0.85rem; color: #666; background: #f0f0f0; padding: 10px 14px;
    border-radius: 4px; margin-top: 6px;
  }
  .config-step { margin-bottom: 10px; font-size: 0.925rem; }
  .config-step strong { color: #1a1a1a; }
  ol { padding-left: 20px; margin-bottom: 12px; }
  ol li { margin-bottom: 6px; font-size: 0.925rem; color: #333; }
  footer {
    margin-top: 64px; padding-top: 20px; border-top: 1px solid #e0e0e0;
    color: #999; font-size: 0.8rem; text-align: center;
  }
  a { color: #2563eb; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .response-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 2px; }
  .status-code {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
    font-size: 0.8rem; font-weight: 600; color: #555; flex-shrink: 0;
  }
  .response-desc { font-size: 0.85rem; color: #555; }
</style>
</head>
<body>
<div class="container">

<h1>KOReader Sync Server</h1>
<p class="subtitle">
  A lightweight API for syncing reading progress across devices running
  <a href="https://koreader.rocks">KOReader</a>.
  Built on Cloudflare Workers with KV storage.
</p>

<p>
  This server implements the
  <a href="https://github.com/koreader/koreader">KOReader</a> sync protocol,
  allowing you to seamlessly resume reading on any device. Register an account,
  authenticate, and your reading position is kept in sync automatically.
  It is a Cloudflare Worker reimplementation of the original
  <a href="https://github.com/myelsukov/koreader-sync">koreader-sync</a> Flask server.
</p>

<!-- ──────────────── Configuration ──────────────── -->

<h2>Configuring KOReader</h2>
<ol>
  <li>Open KOReader and navigate to <strong>Tools → Progress sync</strong>.</li>
  <li>Tap <strong>Custom sync server</strong> and enter the URL of this server (e.g. <code>https://your-worker.workers.dev</code>).</li>
  <li>Tap <strong>Register</strong> or <strong>Login</strong> and enter your credentials.</li>
  <li>Enable <strong>Auto sync now and at startup</strong> for seamless operation.</li>
</ol>
<p>Once configured, KOReader will automatically push and pull reading progress every time you open or close a book.</p>

<!-- ──────────────── Endpoints ──────────────── -->

<h2>API Reference</h2>

<!-- POST /users/create -->
<div class="endpoint">
  <div class="endpoint-header">
    <span class="method post">POST</span>
    <span class="path">/users/create</span>
  </div>
  <div class="endpoint-body">
    <p>Register a new user account. The <code>password</code> field must be an MD5 hash of the plaintext password.</p>

    <h4>Request Body</h4>
<pre>{
  <span class="s">"username"</span>: <span class="s">"name"</span>,
  <span class="s">"password"</span>: <span class="s">"5ebe2294ecd0e0f08eab7690d2a6ee69"</span>
}</pre>

    <h4>Responses</h4>
    <div class="response-row">
      <span class="status-code">201</span>
      <span class="response-desc">Account created</span>
    </div>
<pre>{
  <span class="s">"username"</span>: <span class="s">"name"</span>
}</pre>
    <div class="response-row">
      <span class="status-code">409</span>
      <span class="response-desc">Username already taken</span>
    </div>
<pre><span class="s">"Username is already registered."</span></pre>

    <h4>curl Example</h4>
<pre>curl -X POST https://your-worker.workers.dev/users/create \\
  -H <span class="s">"Content-Type: application/json"</span> \\
  -d <span class="s">'{"username": "name", "password": "5ebe2294ecd0e0f08eab7690d2a6ee69"}'</span></pre>
    <div class="note">Tip: generate the hash with <code>echo -n "secret" | md5sum</code></div>
  </div>
</div>

<!-- GET /users/auth -->
<div class="endpoint">
  <div class="endpoint-header">
    <span class="method get">GET</span>
    <span class="path">/users/auth</span>
  </div>
  <div class="endpoint-body">
    <p>Verify credentials. Use this to test that your account works. The <code>x-auth-key</code> header is the MD5-hashed password.</p>

    <h4>Headers</h4>
<pre>x-auth-user: <span class="s">name</span>
x-auth-key:  <span class="s">5ebe2294ecd0e0f08eab7690d2a6ee69</span></pre>

    <h4>Responses</h4>
    <div class="response-row">
      <span class="status-code">200</span>
      <span class="response-desc">Credentials valid</span>
    </div>
<pre>{
  <span class="s">"authorized"</span>: <span class="s">"OK"</span>
}</pre>
    <div class="response-row">
      <span class="status-code">401</span>
      <span class="response-desc">Invalid password or missing headers</span>
    </div>
    <div class="response-row">
      <span class="status-code">403</span>
      <span class="response-desc">User not found</span>
    </div>

    <h4>curl Example</h4>
<pre>curl https://your-worker.workers.dev/users/auth \\
  -H <span class="s">"x-auth-user: name"</span> \\
  -H <span class="s">"x-auth-key: secret"</span></pre>
  </div>
</div>

<!-- GET /syncs/progress/:document -->
<div class="endpoint">
  <div class="endpoint-header">
    <span class="method get">GET</span>
    <span class="path">/syncs/progress/{document}</span>
  </div>
  <div class="endpoint-body">
    <p>Retrieve the saved reading position for a document.</p>

    <h4>Headers</h4>
<pre>x-auth-user: <span class="s">name</span>
x-auth-key:  <span class="s">secret</span></pre>

    <h4>Responses</h4>
    <div class="response-row">
      <span class="status-code">200</span>
      <span class="response-desc">Position found</span>
    </div>
<pre>{
  <span class="s">"document"</span>:  <span class="s">"b]a]s]e]6]4-encoded-doc-id"</span>,
  <span class="s">"progress"</span>:  <span class="s">"/body/DocFragment[22]/body/div/p[1]/img.0"</span>,
  <span class="s">"percentage"</span>: <span class="k">0.5</span>,
  <span class="s">"device"</span>:     <span class="s">"Kindle"</span>,
  <span class="s">"device_id"</span>:  <span class="s">"a1b2c3d4"</span>,
  <span class="s">"timestamp"</span>:  <span class="k">1234567890</span>
}</pre>
    <div class="note">Returns an empty object <code>{}</code> if no position has been saved for this document.</div>

    <h4>curl Example</h4>
<pre>curl https://your-worker.workers.dev/syncs/progress/my-document-id \\
  -H <span class="s">"x-auth-user: name"</span> \\
  -H <span class="s">"x-auth-key: secret"</span></pre>
  </div>
</div>

<!-- PUT /syncs/progress -->
<div class="endpoint">
  <div class="endpoint-header">
    <span class="method put">PUT</span>
    <span class="path">/syncs/progress</span>
  </div>
  <div class="endpoint-body">
    <p>Update the reading position for a document.</p>

    <h4>Headers</h4>
<pre>x-auth-user: <span class="s">name</span>
x-auth-key:  <span class="s">secret</span></pre>

    <h4>Request Body</h4>
<pre>{
  <span class="s">"document"</span>:  <span class="s">"my-document-id"</span>,
  <span class="s">"progress"</span>:  <span class="s">"/body/DocFragment[22]/body/div/p[1]/img.0"</span>,
  <span class="s">"percentage"</span>: <span class="k">0.5</span>,
  <span class="s">"device"</span>:     <span class="s">"Kindle"</span>,
  <span class="s">"device_id"</span>:  <span class="s">"a1b2c3d4"</span>
}</pre>

    <h4>Responses</h4>
    <div class="response-row">
      <span class="status-code">200</span>
      <span class="response-desc">Position saved</span>
    </div>
<pre>{
  <span class="s">"document"</span>:  <span class="s">"my-document-id"</span>,
  <span class="s">"timestamp"</span>: <span class="k">1234567890</span>
}</pre>

    <h4>curl Example</h4>
<pre>curl -X PUT https://your-worker.workers.dev/syncs/progress \\
  -H <span class="s">"Content-Type: application/json"</span> \\
  -H <span class="s">"x-auth-user: name"</span> \\
  -H <span class="s">"x-auth-key: secret"</span> \\
  -d <span class="s">'{"document":"my-document-id","progress":"/body/DocFragment[22]/body/div/p[1]/img.0","percentage":0.5,"device":"Kindle","device_id":"a1b2c3d4"}'</span></pre>
  </div>
</div>

<footer>
  KOReader Sync Server &middot; Powered by Cloudflare Workers
</footer>

</div>
</body>
</html>`;

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<path d="M6 4a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1h2a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6zm0 2h16v20H6V6zm18 2h2v15h-2V8z" fill="#1a1a1a"/>
<path d="M9 10h10v1.5H9zm0 4h10v1.5H9zm0 4h6v1.5H9z" fill="#666"/>
</svg>`;

export function landingPage(): Response {
  return new Response(HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export function favicon(): Response {
  return new Response(FAVICON_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=604800",
    },
  });
}
