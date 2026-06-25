const server = Bun.serve({
  port: 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/") return new Response("Welcome to Bun!");

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // health check
    if (path === "/health") return Response.json({ status: "ok" }, { status: 200 });

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
