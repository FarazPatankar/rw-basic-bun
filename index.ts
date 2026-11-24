import { SQL } from "bun";

let db: SQL | undefined;
const getDb = () => (db ??= new SQL(process.env.DATABASE_URL!, { connectionTimeout: 5, max: 4 }));

const quoteIdent = (name: string) => `"${name.replaceAll('"', '""')}"`;

// Exact row count for every base table outside the system schemas.
async function countRows(): Promise<Record<string, number>> {
  const sql = getDb();
  const tables: { table_schema: string; table_name: string }[] = await sql`
    SELECT table_schema, table_name FROM information_schema.tables
    WHERE table_type = 'BASE TABLE'
      AND table_schema NOT IN ('pg_catalog', 'information_schema')
      AND table_schema NOT LIKE 'pg\_%'
    ORDER BY table_schema, table_name`;
  const counts: Record<string, number> = {};
  for (const { table_schema, table_name } of tables) {
    const [{ count }] = await sql.unsafe(
      `SELECT COUNT(*) AS count FROM ${quoteIdent(table_schema)}.${quoteIdent(table_name)}`,
    );
    const key = table_schema === "public" ? table_name : `${table_schema}.${table_name}`;
    counts[key] = Number(count);
  }
  return counts;
}

const pages = [
  { path: "/api", title: "API", description: "A JSON response with some buns, for you.", tag: "JSON" },
  { path: "/test", title: "Test", description: "A plain-text check that the server is up.", tag: "TEXT" },
  { path: "/count", title: "Count", description: "Row counts for every table in the database.", tag: "JSON" },
];

const homePage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to Bun</title>
    <style>
      :root {
        --bg: #fbf6ee;
        --card: #ffffff;
        --ink: #1f1a17;
        --muted: #6f655d;
        --accent: #f472b6;
        --border: #ece3d6;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 48px 20px;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 15% 10%, #fde2ef 0, transparent 40%),
          radial-gradient(circle at 85% 90%, #fdecc8 0, transparent 40%),
          var(--bg);
      }
      main { width: 100%; max-width: 560px; }
      .logo { font-size: 56px; line-height: 1; }
      h1 { margin: 16px 0 8px; font-size: 40px; letter-spacing: -0.02em; }
      .lead { margin: 0 0 32px; color: var(--muted); font-size: 17px; }
      ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
      a.card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 20px;
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: 14px;
        color: inherit;
        text-decoration: none;
        transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease;
      }
      a.card:hover, a.card:focus-visible {
        transform: translateY(-2px);
        border-color: var(--accent);
        box-shadow: 0 10px 24px -12px rgba(244, 114, 182, .55);
        outline: none;
      }
      .info { flex: 1; min-width: 0; }
      .title { display: flex; align-items: baseline; gap: 10px; font-weight: 600; font-size: 17px; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: var(--muted); }
      .desc { margin-top: 4px; color: var(--muted); font-size: 14px; }
      .tag {
        font: 600 11px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
        letter-spacing: .06em;
        padding: 6px 8px;
        border-radius: 6px;
        background: #fdf2f8;
        color: #be185d;
      }
      .arrow { color: var(--muted); font-size: 20px; transition: transform .15s ease; }
      a.card:hover .arrow { transform: translateX(3px); color: var(--accent); }
      footer { margin-top: 32px; color: var(--muted); font-size: 13px; }
    </style>
  </head>
  <body>
    <main>
      <div class="logo" aria-hidden="true">🥟</div>
      <h1>Welcome to Bun.</h1>
      <p class="lead">A tiny server with a few pages to poke at.</p>
      <ul>
${pages
  .map(
    (p) => `        <li>
          <a class="card" href="${p.path}">
            <div class="info">
              <div class="title">${p.title} <code>${p.path}</code></div>
              <div class="desc">${p.description}</div>
            </div>
            <span class="tag">${p.tag}</span>
            <span class="arrow" aria-hidden="true">→</span>
          </a>
        </li>`,
  )
  .join("\n")}
      </ul>
      <footer>Served by Bun ${Bun.version}</footer>
    </main>
  </body>
</html>`;

const server = Bun.serve({
  port: Number(process.env.PORT) || 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/")
      return new Response(homePage, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // test endpoint
    if (path === "/test") return new Response("test successful");

    // row counts per table
    if (path === "/count" && req.method === "GET") {
      if (!process.env.DATABASE_URL)
        return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
      try {
        return Response.json(await countRows());
      } catch (err) {
        console.error("/count failed:", err);
        return Response.json(
          { error: "Database unreachable", detail: err instanceof Error ? err.message : String(err) },
          { status: 500 },
        );
      }
    }

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
