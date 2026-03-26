import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  profiles, InsertProfile, Profile,
  tasks, InsertTask, Task,
  chatMessages, InsertChatMessage, ChatMessage,
  streakEntries, InsertStreakEntry, StreakEntry,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ──────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Profiles ───────────────────────────────────────────────────
export async function getProfile(userId: number): Promise<Profile | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertProfile(data: InsertProfile): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await getProfile(data.userId);
  if (existing) {
    await db.update(profiles).set({
      nickname: data.nickname,
      coachType: data.coachType,
      procrastinationType: data.procrastinationType,
      onboardingComplete: data.onboardingComplete,
    }).where(eq(profiles.userId, data.userId));
  } else {
    await db.insert(profiles).values(data);
  }
}

// ─── Tasks ──────────────────────────────────────────────────────
export async function getUserTasks(userId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(tasks).where(eq(tasks.id, insertId)).limit(1);
  return created[0];
}

export async function toggleTaskComplete(taskId: number, userId: number): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db.select().from(tasks).where(
    and(eq(tasks.id, taskId), eq(tasks.userId, userId))
  ).limit(1);
  if (!existing[0]) return undefined;

  const newCompleted = !existing[0].completed;
  await db.update(tasks).set({
    completed: newCompleted,
    completedAt: newCompleted ? new Date() : null,
  }).where(eq(tasks.id, taskId));

  const updated = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  return updated[0];
}

export async function deleteTask(taskId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(tasks).where(
    and(eq(tasks.id, taskId), eq(tasks.userId, userId))
  );
  return result[0].affectedRows > 0;
}

// ─── Chat Messages ──────────────────────────────────────────────
export async function getChatHistory(userId: number, limit = 50): Promise<ChatMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function addChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chatMessages).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(chatMessages).where(eq(chatMessages.id, insertId)).limit(1);
  return created[0];
}

// ─── Streaks ────────────────────────────────────────────────────
export async function getStreakEntries(userId: number): Promise<StreakEntry[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(streakEntries)
    .where(eq(streakEntries.userId, userId))
    .orderBy(desc(streakEntries.date));
}

export async function addStreakEntry(userId: number, date: string): Promise<StreakEntry | null> {
  const db = await getDb();
  if (!db) return null;

  // Check if already exists
  const existing = await db.select().from(streakEntries).where(
    and(eq(streakEntries.userId, userId), eq(streakEntries.date, date))
  ).limit(1);
  if (existing[0]) return existing[0];

  const result = await db.insert(streakEntries).values({ userId, date });
  const insertId = result[0].insertId;
  const created = await db.select().from(streakEntries).where(eq(streakEntries.id, insertId)).limit(1);
  return created[0];
}

export function calculateStreak(entries: StreakEntry[]): { currentStreak: number; longestStreak: number } {
  if (entries.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const dates = entries.map(e => e.date).sort().reverse(); // newest first
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Calculate current streak
  if (dates[0] === today || dates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  const sortedAsc = [...dates].sort();
  tempStreak = 1;
  longestStreak = 1;
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}
