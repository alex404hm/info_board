import { pgTable, text, boolean, timestamp, json, integer } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export type WageStep = {
  apprenticeshipPeriod: string
  hourlySalaryDkk: number
  monthlySalaryDkk: number
}

export type WageGroup = {
  ageGroup: "under18" | "over18"
  label: string
  steps: WageStep[]
}

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  phoneNumber: text("phone_number"),
  role: text("role").notNull().default("user"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})
// Two-Factor table for 2FA
export const twoFactor = pgTable("twoFactor", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  secret: text("secret"),
  backupCodes: text("backupCodes"),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").unique().notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  password: text("password"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
})

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  priority: text("priority").notNull().default("normal"), // normal, high, urgent
  active: boolean("active").notNull().default(true),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeFrom: timestamp("activeFrom"),
  expiresAt: timestamp("expiresAt"),
  pinned: boolean("pinned").notNull().default(false),
  repeatDays: json("repeat_days").$type<number[]>().default([]),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const setting = pgTable("setting", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const invitation = pgTable("invitation", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  role: text("role").notNull().default("teacher"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").notNull(),
})

export const drNewsArticle = pgTable("dr_news_article", {
  link: text("link").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  pubDate: timestamp("pubDate"),
  imageUrl: text("imageUrl"),
  imageCaption: text("imageCaption"),
  author: text("author"),
  bodyParagraphs: json("bodyParagraphs").$type<string[]>().default([]),
  fetchedAt: timestamp("fetchedAt").notNull(),
})

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  rating: integer("rating").notNull(),           // 1-5
  comment: text("comment"),
  ideas: json("ideas").$type<string[]>().default([]),
  ip: text("ip"),
  createdAt: timestamp("createdAt").notNull(),
})

export const requestLog = pgTable("request_log", {
  id: text("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  eventType: text("event_type").notNull(),        // page_view | login_success | login_failure | feedback | api_error | rate_limited
  ip: text("ip"),
  method: text("method").notNull().default("GET"),
  path: text("path").notNull().default("/"),
  statusCode: integer("status_code"),
  userId: text("user_id"),
  userEmail: text("user_email"),
  userAgent: text("user_agent"),
  details: json("details").$type<Record<string, unknown>>().default({}),
})

export const wageData = pgTable("wage_data", {
  id: integer("id").primaryKey(),
  groups: json("groups").$type<WageGroup[]>().notNull(),
  currency: text("currency").notNull().default("DKK"),
  lastUpdated: text("last_updated").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const kokkenvagtEntry = pgTable("kokkenvagt_entry", {
  id: text("id").primaryKey(),
  week: integer("week").notNull(),
  year: integer("year").notNull(),
  person1: text("person1").notNull(),
  person2: text("person2").notNull(),
  note: text("note"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  authorId: text("authorId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const messageRelations = relations(message, ({ one }) => ({
  author: one(user, { fields: [message.authorId], references: [user.id] }),
}))

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  messages: many(message),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))