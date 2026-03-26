/*
 * Design: Gentle Push — Dashboard / Home after onboarding
 * Shows: greeting from coach, today's tasks summary, streak, quick actions
 * Data: fetched from server via tRPC
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { COACH_DATA } from "@shared/coaches";
import type { CoachType } from "@shared/coaches";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Plus, Flame, ListChecks, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
  });
  const tasksQuery = trpc.task.list.useQuery(undefined, {
    enabled: !!user,
  });
  const streakQuery = trpc.streak.get.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [profileQuery.data, setLocation]);

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  const profile = profileQuery.data;
  if (!profile) return null;

  const coachType = profile.coachType as CoachType;
  const coach = COACH_DATA[coachType];
  const allTasks = tasksQuery.data ?? [];
  const streak = streakQuery.data ?? { currentStreak: 0, longestStreak: 0, completedDates: [], totalCompleted: 0 };

  const todayStr = new Date().toDateString();
  const todayTasks = allTasks.filter((t) => {
    const created = new Date(t.createdAt).toDateString();
    return created === todayStr;
  });
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const pendingTasks = allTasks.filter((t) => !t.completed);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "おはよう";
    if (hour < 18) return "こんにちは";
    return "おつかれさま";
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="relative px-4 pt-8 pb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-coral/8 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-20 left-0 w-32 h-32 bg-teal/8 rounded-full blur-3xl -translate-x-1/2" />

        <div className="max-w-lg mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src={coach.image}
              alt={coach.name}
              className="w-14 h-14 rounded-2xl object-cover bg-card shadow-sm"
            />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">{getTimeGreeting()}、{profile.nickname}さん</p>
              <p className="text-sm font-medium mt-0.5 leading-snug">
                {pendingTasks.length > 0
                  ? `今日は${pendingTasks.length}個のタスクが待っているよ！`
                  : "今日のタスクを追加しよう！"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-coral/10 via-sunny/10 to-teal/10 rounded-2xl p-5 border border-coral/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-coral/15 flex items-center justify-center">
                <Flame className="w-6 h-6 text-coral" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">連続ストリーク</p>
                <p className="text-2xl font-extrabold text-coral" style={{ fontFamily: "var(--font-display)" }}>
                  {streak.currentStreak}
                  <span className="text-sm font-medium text-muted-foreground ml-1">日</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">最長記録</p>
              <p className="text-lg font-bold text-foreground/70">{streak.longestStreak}日</p>
            </div>
          </div>
        </motion.div>

        {/* Today's Progress */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>
              今日の進捗
            </h3>
            <button
              onClick={() => setLocation("/tasks")}
              className="text-xs text-coral font-medium flex items-center gap-0.5 hover:underline"
            >
              すべて見る <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-teal rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {completedToday}/{todayTasks.length}
                </span>
              </div>
              {todayTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm py-1">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    task.completed ? "bg-teal border-teal" : "border-border"
                  }`}>
                    {task.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              まだタスクがありません。追加してみましょう！
            </p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3"
        >
          <button
            onClick={() => setLocation("/tasks")}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col items-center gap-2 hover:border-coral/30 transition-colors active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-coral/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-coral" />
            </div>
            <span className="text-xs font-medium">タスク追加</span>
          </button>
          <button
            onClick={() => setLocation("/chat")}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col items-center gap-2 hover:border-teal/30 transition-colors active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-teal" />
            </div>
            <span className="text-xs font-medium">コーチに相談</span>
          </button>
          <button
            onClick={() => setLocation("/streak")}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex flex-col items-center gap-2 hover:border-sunny/50 transition-colors active:scale-[0.97]"
          >
            <div className="w-10 h-10 rounded-xl bg-sunny/20 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium">記録を見る</span>
          </button>
        </motion.div>

        {/* Coach Tip */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <img src={coach.image} alt={coach.name} className="w-10 h-10 rounded-xl object-cover bg-cream" />
            <div className="flex-1">
              <p className="text-xs text-coral font-bold mb-1">{coach.name}からのひとこと</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {coach.greeting}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
