const server = Bun.serve({
  port: 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/") return new Response("Welcome to Bun!!!");

    // cute hello-from-sbx page
    if (path === "/hello-from-sbx") {
      return new Response(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello from Sandbox</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 500px;
    }
    h1 {
      color: #667eea;
      font-size: 2.5rem;
      margin-bottom: 1rem;
      animation: bounce 2s infinite;
    }
    p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    .emoji {
      font-size: 4rem;
      margin: 1rem 0;
      animation: spin 3s linear infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .badge {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello from Sandbox! 🎉</h1>
    <div class="emoji">🚀</div>
    <p>You've successfully accessed the sandbox dev server via localtunnel!</p>
    <p>This is a cute little page running in your local environment.</p>
    <span class="badge">Sandbox Mode Active</span>
  </div>
</body>
</html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // test endpoint
    if (path === "/test") return new Response("test successful");

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);

