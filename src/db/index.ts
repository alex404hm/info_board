import { drizzle } from "drizzle-orm/neon-http"
import { neon } from "@neondatabase/serverless"
import * as schema from "./schema"

const DATABASE_ENV_KEYS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEON_DATABASE_URL",
] as const

type Database = ReturnType<typeof drizzle>

let dbInstance: Database | null = null

function getConnectionString() {
  for (const key of DATABASE_ENV_KEYS) {
    const value = process.env[key]
    if (value) return value
  }

  throw new Error(
    `Database connection string is not set. Expected one of: ${DATABASE_ENV_KEYS.join(", ")}`,
  )
}

export function getDb() {
  if (!dbInstance) {
    const sql = neon(getConnectionString())
    dbInstance = drizzle(sql, { schema })
  }

  return dbInstance
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb()
    const value = Reflect.get(instance as object, prop, receiver)
    return typeof value === "function" ? value.bind(instance) : value
  },
})
