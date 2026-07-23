import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

let client: ReturnType<typeof postgres> | undefined;
export function getDb() {
  if (!process.env.DATABASE_URL) return null;
  client ??= postgres(process.env.DATABASE_URL, { max: 4, prepare: false });
  return drizzle(client, { schema });
}
export async function checkDb() { if (!process.env.DATABASE_URL) return { configured: false, ok: true }; const sql = client ??= postgres(process.env.DATABASE_URL, { max: 4, prepare: false }); await sql`select 1`; return { configured: true, ok: true }; }
