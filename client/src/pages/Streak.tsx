/*
 * Design: Gentle Push - Streak tracking page
 * Calendar heatmap, stats, garden metaphor
 * Data: fetched from server via tRPC
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { COACH_DATA } from "@shared/coaches";
import type { CoachType } from "@shared/coaches";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Flame, Trophy, Calendar, Sprout, Flower2, TreePine, Loader2, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"];

function getGardenStage(streak: number): { icon: typeof Sprout; label: string; color: string } {
  if (streak >= 30) return { icon: TreePine, label: "大きな木", color: "text-emerald-600" };
  if (streak >= 14) return { icon: Flower2, label: "花が咲いた", color: "text-pink-500" };
  if (streak >= 7) return { icon: Flower2, label: "つぼみ", color: "text-teal" };
  if (streak >= 3) return { icon: Sprout, label: "芽が出た", color: "text-green-500" };
  return { icon: Sprout, label: "種まき", color: "text-muted-foreground" };
}

export default function Streak() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const streakQuery = trpc.streak.get.useQuery(undefined, { enabled: !!user });
  const tasksQuery = trpc.task.list.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const recordMutation = trpc.streak.recordToday.useMutation({
    onSuccess: () => {
      utils.streak.get.invalidate();
      toast.success("今日の記録を追加しました！");
    },
    onError: () => toast.error("記録に失敗しました"),
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [profileQuery.data, setLocation]);

  const calendarData = useMemo(() => {
    const completedDates = streakQuery.data?.completedDates ?? [];
    const today = new Date();
    const days: { date: string; completed: boolean; isToday: boolean; isCurrentMonth: boolean }[] = [];

    for (let i = 34; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        completed: completedDates.includes(dateStr),
        isToday: i === 0,
        isCurrentMonth: d.getMonth() === today.getMonth(),
      });
    }
    return days;
  }, [streakQuery.data?.completedDates]);

  if (authLoading || profileQuery.isLoading || streakQuery.isLoading) {
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
  const streak = streakQuery.data ?? { currentStreak: 0, longestStreak: 0, completedDates: [], totalCompleted: 0 };
  const garden = getGardenStage(streak.currentStreak);
  const GardenIcon = garden.icon;
  const totalCompleted = (tasksQuery.data ?? []).filter((t) => t.completed).length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecorded = streak.completedDates.includes(todayStr);

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
            記録
          </h1>
          <p className="text-muted-foreground text-sm mt-1">あなたの成長の軌跡</p>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Garden Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-teal/10 via-green-50 to-sunny/10 rounded-2xl p-6 border border-teal/10 text-center"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <GardenIcon className={`w-16 h-16 mx-auto ${garden.color}`} />
          </motion.div>
          <p className="text-lg font-bold mt-3" style={{ fontFamily: "var(--font-display)" }}>
            {garden.label}
          </p>
          <p className="text-muted-foreground text-xs mt-1">
            {streak.currentStreak}日連続で水やり中
          </p>

          {/* Record today button */}
          {!todayRecorded ? (
            <Button
              onClick={() => recordMutation.mutate()}
              disabled={recordMutation.isPending}
              className="mt-4 bg-teal hover:bg-teal/90 text-white rounded-full px-6 shadow-sm"
            >
              {recordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-1" />
              )}
              今日の水やりをする
            </Button>
          ) : (
            <p className="mt-4 text-teal text-xs font-medium flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              今日の水やり完了！
            </p>
          )}
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
            <Flame className="w-5 h-5 text-coral mx-auto mb-1" />
            <p className="text-xl font-extrabold text-coral" style={{ fontFamily: "var(--font-display)" }}>
              {streak.currentStreak}
            </p>
            <p className="text-[10px] text-muted-foreground">連続日数</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
            <Trophy className="w-5 h-5 text-sunny mx-auto mb-1" />
            <p className="text-xl font-extrabold text-amber-600" style={{ fontFamily: "var(--font-display)" }}>
              {streak.longestStreak}
            </p>
            <p className="text-[10px] text-muted-foreground">最長記録</p>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm text-center">
            <Calendar className="w-5 h-5 text-teal mx-auto mb-1" />
            <p className="text-xl font-extrabold text-teal" style={{ fontFamily: "var(--font-display)" }}>
              {totalCompleted}
            </p>
            <p className="text-[10px] text-muted-foreground">完了タスク</p>
          </div>
        </motion.div>

        {/* Calendar Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm"
        >
          <h3 className="font-bold text-sm mb-4" style={{ fontFamily: "var(--font-display)" }}>
            直近5週間
          </h3>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[10px] text-muted-foreground font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarData.map((day) => {
              const d = new Date(day.date);
              return (
                <div
                  key={day.date}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium transition-all ${
                    day.isToday ? "ring-2 ring-coral ring-offset-1" : ""
                  } ${
                    day.completed
                      ? "bg-teal/20 text-teal"
                      : day.isCurrentMonth
                        ? "bg-muted/50 text-muted-foreground"
                        : "bg-muted/20 text-muted-foreground/40"
                  }`}
                  title={day.date}
                >
                  {d.getDate()}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 mt-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-muted/50" />
              <span className="text-[10px] text-muted-foreground">未達成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-teal/20" />
              <span className="text-[10px] text-muted-foreground">達成</span>
            </div>
          </div>
        </motion.div>

        {/* Coach encouragement */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <img src={coach.image} alt={coach.name} className="w-10 h-10 rounded-xl object-cover bg-cream" />
            <div className="flex-1">
              <p className="text-xs text-coral font-bold mb-1">{coach.name}より</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {streak.currentStreak === 0
                  ? "今日から新しいスタート！最初の一歩を踏み出そう。"
                  : streak.currentStreak < 7
                    ? `${streak.currentStreak}日連続、いい調子！まずは1週間を目指そう。`
                    : streak.currentStreak < 30
                      ? `${streak.currentStreak}日連続！素晴らしい習慣が身についてきたね。`
                      : `${streak.currentStreak}日連続！もう立派な習慣マスターだね！`
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
