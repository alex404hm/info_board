import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

function getConnectionString() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL environment variable is not set")
  return url
}

const pool = new Pool({ connectionString: getConnectionString() })

export const db = drizzle(pool, { schema })
