const server = Bun.serve({
  port: 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/") return new Response("Welcome to Bun!");

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // respond with hello
    if (path === "/hello") return new Response("world");

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
