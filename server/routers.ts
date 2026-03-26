import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getProfile, upsertProfile,
  getUserTasks, createTask, toggleTaskComplete, deleteTask,
  getChatHistory, addChatMessage,
  getStreakEntries, addStreakEntry, calculateStreak,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { COACH_DATA } from "@shared/coaches";
import type { CoachType, ProcrastinationType } from "@shared/coaches";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getProfile(ctx.user.id);
    }),

    save: protectedProcedure
      .input(z.object({
        nickname: z.string().min(1).max(100),
        coachType: z.enum(["cat", "owl", "dog"]),
        procrastinationType: z.enum(["perfectionist", "overwhelmed", "rebel", "dreamer"]),
      }))
      .mutation(async ({ ctx, input }) => {
        await upsertProfile({
          userId: ctx.user.id,
          nickname: input.nickname,
          coachType: input.coachType,
          procrastinationType: input.procrastinationType,
          onboardingComplete: true,
        });
        return { success: true };
      }),
  }),

  // ─── Tasks ──────────────────────────────────────────────────
  task: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserTasks(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        estimatedMinutes: z.number().int().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return createTask({
          userId: ctx.user.id,
          title: input.title,
          priority: input.priority,
          estimatedMinutes: input.estimatedMinutes ?? null,
        });
      }),

    toggle: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const task = await toggleTaskComplete(input.taskId, ctx.user.id);
        if (!task) throw new Error("Task not found");
        return task;
      }),

    delete: protectedProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ok = await deleteTask(input.taskId, ctx.user.id);
        if (!ok) throw new Error("Task not found");
        return { success: true };
      }),
  }),

  // ─── Chat (AI Coach) ───────────────────────────────────────
  chat: router({
    history: protectedProcedure.query(async ({ ctx }) => {
      const messages = await getChatHistory(ctx.user.id, 50);
      return messages.reverse(); // oldest first for display
    }),

    send: protectedProcedure
      .input(z.object({ message: z.string().min(1).max(2000) }))
      .mutation(async ({ ctx, input }) => {
        // Get user profile for coach type
        const profile = await getProfile(ctx.user.id);
        const coachType: CoachType = (profile?.coachType as CoachType) || "cat";
        const procType: ProcrastinationType = (profile?.procrastinationType as ProcrastinationType) || "perfectionist";
        const coach = COACH_DATA[coachType];

        // Save user message
        const userMsg = await addChatMessage({
          userId: ctx.user.id,
          role: "user",
          content: input.message,
        });

        // Get recent history for context
        const history = await getChatHistory(ctx.user.id, 20);
        const recentMessages = history.reverse();

        // Get user's tasks for context
        const userTasks = await getUserTasks(ctx.user.id);
        const pendingTasks = userTasks.filter(t => !t.completed).slice(0, 5);
        const taskContext = pendingTasks.length > 0
          ? `\n\n【ユーザーの未完了タスク】\n${pendingTasks.map(t => `- ${t.title}（優先度: ${t.priority}）`).join("\n")}`
          : "";

        // Build LLM messages
        const llmMessages = [
          {
            role: "system" as const,
            content: `${coach.systemPrompt}\n\n【ユーザー情報】\n- ニックネーム: ${profile?.nickname || "ユーザー"}\n- 先延ばしタイプ: ${procType}${taskContext}\n\n重要: 日本語で返答してください。返答は2〜4文で簡潔にしてください。`,
          },
          ...recentMessages.slice(-10).map(m => ({
            role: (m.role === "coach" ? "assistant" : "user") as "assistant" | "user",
            content: m.content,
          })),
        ];

        try {
          const llmResult = await invokeLLM({ messages: llmMessages });
          const coachReply = typeof llmResult.choices[0]?.message?.content === "string"
            ? llmResult.choices[0].message.content
            : "ごめんね、ちょっと考え中...もう一度話しかけてくれる？";

          // Save coach response
          const coachMsg = await addChatMessage({
            userId: ctx.user.id,
            role: "coach",
            content: coachReply,
          });

          return { userMessage: userMsg, coachMessage: coachMsg };
        } catch (error) {
          console.error("[Chat] LLM error:", error);
          // Fallback response
          const fallbackReply = coach.greeting;
          const coachMsg = await addChatMessage({
            userId: ctx.user.id,
            role: "coach",
            content: fallbackReply,
          });
          return { userMessage: userMsg, coachMessage: coachMsg };
        }
      }),
  }),

  // ─── Streaks ────────────────────────────────────────────────
  streak: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const entries = await getStreakEntries(ctx.user.id);
      const stats = calculateStreak(entries);
      return {
        ...stats,
        completedDates: entries.map(e => e.date),
        totalCompleted: entries.length,
      };
    }),

    recordToday: protectedProcedure.mutation(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      await addStreakEntry(ctx.user.id, today);
      const entries = await getStreakEntries(ctx.user.id);
      const stats = calculateStreak(entries);
      return {
        ...stats,
        completedDates: entries.map(e => e.date),
        totalCompleted: entries.length,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
