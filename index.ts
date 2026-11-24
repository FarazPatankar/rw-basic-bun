const server = Bun.serve({
  port: Number(process.env.PORT) || 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/")
      return new Response(
        `<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Bun</title></head>
  <body>
    <h1>Welcome to Bun.</h1>
    <ul>
      <li><a href="/api">/api</a></li>
      <li><a href="/test">/test</a></li>
    </ul>
  </body>
</html>`,
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // test endpoint
    if (path === "/test") return new Response("test successful");

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
