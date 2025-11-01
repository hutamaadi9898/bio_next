import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import process from "node:process";

import * as schema from "@/drizzle/schema";
import { env } from "@/lib/env";

type GlobalWithDb = typeof globalThis & {
  __dbPool?: Pool;
  __db?: NodePgDatabase<typeof schema>;
};

const globalForDb = globalThis as GlobalWithDb;

const pool = globalForDb.__dbPool ?? new Pool({ connectionString: env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbPool = pool;
}

export const db = globalForDb.__db ?? drizzle(pool, { schema });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__db = db;
}

export type DbClient = typeof db;
