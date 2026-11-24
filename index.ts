import { SQL } from "bun";

// Lazily created so the app still starts without DATABASE_URL.
let db: SQL | undefined;
function getDb(): SQL {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (db ??= new SQL(process.env.DATABASE_URL));
}

// Exact row counts for every user table in the public schema.
async function countRows(): Promise<Record<string, number>> {
  const sql = getDb();
  // format('%I') makes Postgres quote the identifiers safely.
  const tables: { name: string; ident: string }[] = await sql`
    SELECT c.relname AS name, format('%I.%I', n.nspname, c.relname) AS ident
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND NOT c.relispartition
    ORDER BY c.relname`;
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const [row] = await sql.unsafe(`SELECT COUNT(*)::bigint AS n FROM ${t.ident}`);
    counts[t.name] = Number(row.n);
  }
  return counts;
}

const server = Bun.serve({
  port: Number(process.env.PORT) || 1234,
  async fetch(req) {
    const path = new URL(req.url).pathname;

    // respond with text/html
    if (path === "/") return new Response("Welcome to Bun.");

    // respond with JSON
    if (path === "/api") return Response.json({ some: "buns", for: "you" });

    // test endpoint
    if (path === "/test") return new Response("test successful");

    // row counts per table
    if (path === "/count" && req.method === "GET") {
      try {
        return Response.json(await countRows());
      } catch (err) {
        console.error("/count failed:", err);
        return Response.json({ error: "Failed to count rows" }, { status: 500 });
      }
    }

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
