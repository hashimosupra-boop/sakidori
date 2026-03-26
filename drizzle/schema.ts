import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profile for Sakidori — stores onboarding results and preferences.
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nickname: varchar("nickname", { length: 100 }).notNull(),
  coachType: mysqlEnum("coachType", ["cat", "owl", "dog"]).notNull(),
  procrastinationType: mysqlEnum("procrastinationType", ["perfectionist", "overwhelmed", "rebel", "dreamer"]).notNull(),
  onboardingComplete: boolean("onboardingComplete").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Tasks — user's task list with priority and completion tracking.
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  completed: boolean("completed").default(false).notNull(),
  estimatedMinutes: int("estimatedMinutes"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Chat messages — conversation history between user and AI coach.
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "coach"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

/**
 * Streaks — daily completion tracking for streak calculation.
 */
export const streakEntries = mysqlTable("streak_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StreakEntry = typeof streakEntries.$inferSelect;
export type InsertStreakEntry = typeof streakEntries.$inferInsert;
