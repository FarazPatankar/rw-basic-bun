import { SQL } from "bun";

let db: SQL | null = null;
function getDb(): SQL {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  db ??= new SQL({ url: process.env.DATABASE_URL, connectionTimeout: 5, max: 5 });
  return db;
}

const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function countRows(): Promise<Record<string, number>> {
  const sql = getDb();
  const tables: { schemaname: string; tablename: string }[] = await sql`
    SELECT schemaname, tablename FROM pg_catalog.pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND schemaname NOT LIKE 'pg\_toast%' AND schemaname NOT LIKE 'pg\_temp\_%'
    ORDER BY schemaname, tablename`;
  const counts: Record<string, number> = {};
  for (const { schemaname, tablename } of tables) {
    const [row] = await sql.unsafe(
      `SELECT COUNT(*)::bigint AS n FROM ${quoteIdent(schemaname)}.${quoteIdent(tablename)}`,
    );
    const key = schemaname === "public" ? tablename : `${schemaname}.${tablename}`;
    counts[key] = Number(row.n);
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

    // row counts for every user table
    if (path === "/count" && req.method === "GET") {
      try {
        return Response.json(await countRows());
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: `Database unavailable: ${message}` }, { status: 500 });
      }
    }

    // 404s
    return new Response("Page not found", { status: 404 });
  }
})

console.log(`Listening on ${server.url}`);
