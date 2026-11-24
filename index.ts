import { SQL } from "bun";

// Lazily connect so the existing routes keep working without DATABASE_URL.
let db: SQL | undefined;
function getDb(): SQL {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return (db ??= new SQL(process.env.DATABASE_URL));
}

// Double-quote a Postgres identifier, escaping embedded quotes.
const quoteIdent = (name: string) => `"${name.replace(/"/g, '""')}"`;

async function countRows(): Promise<Record<string, number>> {
  const sql = getDb();
  const tables: { table_name: string }[] = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name`;
  const counts: Record<string, number> = {};
  for (const { table_name } of tables) {
    const [row] = await sql.unsafe(
      `SELECT COUNT(*)::bigint AS count FROM public.${quoteIdent(table_name)}`,
    );
    counts[table_name] = Number(row.count);
  }
  return counts;
}

// Env vars that come from the platform or runtime, not from the service's
// own variables. Only NAMES are ever inspected or returned, never values.
const SYSTEM_VARS = new Set([
  "PATH", "HOME", "HOSTNAME", "PWD", "OLDPWD", "SHLVL", "_", "TERM",
  "LANG", "LANGUAGE", "USER", "LOGNAME", "SHELL", "TZ", "TMPDIR", "PORT",
  "CI", "NO_COLOR", "FORCE_COLOR", "COLORTERM", "SSL_CERT_FILE", "SSL_CERT_DIR",
]);
const SYSTEM_PREFIXES = [
  "RAILWAY_", "NODE_", "BUN_", "NPM_", "npm_", "NIXPACKS_", "RAILPACK_",
  "MISE_", "LC_", "XDG_", "DEBIAN_",
];

function serviceVariableNames(): string[] {
  return Object.keys(process.env)
    .filter((name) => process.env[name]) // non-empty only
    .filter((name) => !SYSTEM_VARS.has(name))
    .filter((name) => !SYSTEM_PREFIXES.some((p) => name.startsWith(p)))
    .sort();
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

    // row count of every table in the public schema
    if (path === "/count" && req.method === "GET") {
      try {
        const tables = await countRows();
        return Response.json({ tables, variables: serviceVariableNames() });
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
