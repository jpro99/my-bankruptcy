import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema/index.js";

export * from "./schema/index.js";

export type Database = NeonHttpDatabase<typeof schema>;

export function createDb(connectionString: string): Database {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

export function getDb(): Database {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  return createDb(url);
}
