import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculateStreak } from "./db";
import type { StreakEntry } from "../drizzle/schema";

// ─── calculateStreak (pure function, no DB needed) ──────────────

function makeEntry(date: string, id = 1, userId = 1): StreakEntry {
  return {
    id,
    userId,
    date,
    createdAt: new Date(),
  };
}

describe("calculateStreak", () => {
  it("returns zeros for empty entries", () => {
    const result = calculateStreak([]);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("returns 1 for a single entry today", () => {
    const today = new Date().toISOString().split("T")[0];
    const result = calculateStreak([makeEntry(today)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("returns 1 for a single entry yesterday", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const result = calculateStreak([makeEntry(yesterday)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("returns 0 current streak for an old entry", () => {
    const oldDate = new Date(Date.now() - 86400000 * 5).toISOString().split("T")[0];
    const result = calculateStreak([makeEntry(oldDate)]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
  });

  it("calculates consecutive streak correctly", () => {
    const today = new Date();
    const dates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today.getTime() - i * 86400000);
      return d.toISOString().split("T")[0];
    });
    const entries = dates.map((d, i) => makeEntry(d, i + 1));
    const result = calculateStreak(entries);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
  });

  it("handles gaps in streak", () => {
    const today = new Date();
    // Today, yesterday, then skip a day, then 2 more
    const dates = [
      new Date(today.getTime()).toISOString().split("T")[0],
      new Date(today.getTime() - 86400000).toISOString().split("T")[0],
      // gap: skip day -2
      new Date(today.getTime() - 86400000 * 3).toISOString().split("T")[0],
      new Date(today.getTime() - 86400000 * 4).toISOString().split("T")[0],
    ];
    const entries = dates.map((d, i) => makeEntry(d, i + 1));
    const result = calculateStreak(entries);
    expect(result.currentStreak).toBe(2); // today + yesterday
    expect(result.longestStreak).toBe(2); // both segments are 2
  });

  it("finds longest streak even when current is shorter", () => {
    const today = new Date();
    // Current: just today (1 day)
    // Past: 4 consecutive days ending 10 days ago
    const dates = [
      today.toISOString().split("T")[0],
      new Date(today.getTime() - 86400000 * 10).toISOString().split("T")[0],
      new Date(today.getTime() - 86400000 * 11).toISOString().split("T")[0],
      new Date(today.getTime() - 86400000 * 12).toISOString().split("T")[0],
      new Date(today.getTime() - 86400000 * 13).toISOString().split("T")[0],
    ];
    const entries = dates.map((d, i) => makeEntry(d, i + 1));
    const result = calculateStreak(entries);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(4);
  });
});

// ─── Coach Data Validation ──────────────────────────────────────

describe("Coach data integrity", () => {
  it("exports all three coach types with required fields", async () => {
    const { COACH_DATA } = await import("../shared/coaches");
    const types = ["cat", "owl", "dog"] as const;

    for (const type of types) {
      const coach = COACH_DATA[type];
      expect(coach).toBeDefined();
      expect(coach.name).toBeTruthy();
      expect(coach.image).toMatch(/^https?:\/\//);
      expect(coach.description).toBeTruthy();
      expect(coach.personality).toBeTruthy();
      expect(coach.greeting).toBeTruthy();
      expect(coach.systemPrompt).toBeTruthy();
    }
  });

  it("exports all four procrastination types", async () => {
    const { PROCRASTINATION_TYPES } = await import("../shared/coaches");
    const types = ["perfectionist", "overwhelmed", "rebel", "dreamer"] as const;

    for (const type of types) {
      const pt = PROCRASTINATION_TYPES[type];
      expect(pt).toBeDefined();
      expect(pt.label).toBeTruthy();
      expect(pt.description).toBeTruthy();
      expect(pt.strategy).toBeTruthy();
    }
  });
});

// ─── Router structure validation ────────────────────────────────

describe("appRouter structure", () => {
  it("has all expected router keys", async () => {
    const { appRouter } = await import("./routers");
    // appRouter._def.procedures contains flattened procedure paths
    const procedures = Object.keys(appRouter._def.procedures);

    // Check essential routes exist
    expect(procedures).toContain("auth.me");
    expect(procedures).toContain("auth.logout");
    expect(procedures).toContain("profile.get");
    expect(procedures).toContain("profile.save");
    expect(procedures).toContain("task.list");
    expect(procedures).toContain("task.create");
    expect(procedures).toContain("task.toggle");
    expect(procedures).toContain("task.delete");
    expect(procedures).toContain("chat.history");
    expect(procedures).toContain("chat.send");
    expect(procedures).toContain("streak.get");
    expect(procedures).toContain("streak.recordToday");
  });
});
