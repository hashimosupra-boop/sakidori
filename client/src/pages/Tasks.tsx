/*
 * Design: Gentle Push - Task management page
 * Data: fetched from server via tRPC
 */
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, Clock, AlertTriangle, Minus, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const priorityConfig = {
  high: { label: "高", color: "bg-coral/15 text-coral border-coral/20", icon: AlertTriangle },
  medium: { label: "中", color: "bg-sunny/20 text-amber-600 border-sunny/30", icon: Clock },
  low: { label: "低", color: "bg-teal/10 text-teal border-teal/20", icon: Minus },
};

export default function Tasks() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newMinutes, setNewMinutes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const utils = trpc.useUtils();
  const tasksQuery = trpc.task.list.useQuery(undefined, { enabled: !!user });

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      setNewTitle("");
      setNewPriority("medium");
      setNewMinutes("");
      setShowForm(false);
      toast.success("タスクを追加しました");
    },
    onError: () => toast.error("タスクの追加に失敗しました"),
  });

  const toggleMutation = trpc.task.toggle.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.task.list.cancel();
      const prev = utils.task.list.getData();
      utils.task.list.setData(undefined, (old) =>
        old?.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date() : null } : t
        )
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.task.list.setData(undefined, ctx.prev);
      toast.error("更新に失敗しました");
    },
    onSettled: () => utils.task.list.invalidate(),
  });

  const deleteMutation = trpc.task.delete.useMutation({
    onMutate: async ({ taskId }) => {
      await utils.task.list.cancel();
      const prev = utils.task.list.getData();
      utils.task.list.setData(undefined, (old) => old?.filter((t) => t.id !== taskId));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.task.list.setData(undefined, ctx.prev);
      toast.error("削除に失敗しました");
    },
    onSettled: () => utils.task.list.invalidate(),
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [authLoading, user, setLocation]);

  if (authLoading || tasksQuery.isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  const allTasks = tasksQuery.data ?? [];
  const filteredTasks = allTasks.filter((t) => {
    if (filter === "pending") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1);
  });

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate({
      title: newTitle.trim(),
      priority: newPriority,
      estimatedMinutes: newMinutes ? parseInt(newMinutes) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)" }}>
            タスク
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {allTasks.filter((t) => !t.completed).length}個のタスクが残っています
          </p>
        </div>
      </div>

      <div className="px-4 max-w-lg mx-auto space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "pending", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f
                  ? "bg-coral text-white shadow-sm"
                  : "bg-card text-muted-foreground border border-border/50 hover:border-coral/30"
              }`}
            >
              {f === "all" ? "すべて" : f === "pending" ? "未完了" : "完了済み"}
            </button>
          ))}
        </div>

        {/* Add task form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm space-y-3">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="タスクを入力..."
                  className="rounded-xl h-11 bg-cream/50 border-border/50 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5 flex-1">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                          newPriority === p ? priorityConfig[p].color + " ring-1 ring-current/20" : "bg-muted/50 text-muted-foreground border-transparent"
                        }`}
                      >
                        {priorityConfig[p].label}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(e.target.value.replace(/\D/g, ""))}
                    placeholder="分"
                    className="w-16 rounded-lg h-8 text-xs text-center bg-cream/50 border-border/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAdd}
                    disabled={!newTitle.trim() || createMutation.isPending}
                    className="flex-1 bg-coral hover:bg-coral/90 text-white rounded-xl h-10 text-sm font-bold"
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "追加"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl h-10 text-sm border-border/50"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task list */}
        <div className="space-y-2">
          <AnimatePresence>
            {sortedTasks.map((task) => {
              const config = priorityConfig[task.priority as keyof typeof priorityConfig];
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3 ${
                    task.completed ? "opacity-60" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleMutation.mutate({ taskId: task.id })}
                    className="flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-teal" />
                    ) : (
                      <Circle className="w-6 h-6 text-border hover:text-coral transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {config && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${config.color}`}>
                          {config.label}
                        </span>
                      )}
                      {task.estimatedMinutes && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-3 h-3" /> {task.estimatedMinutes}分
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMutation.mutate({ taskId: task.id })}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {sortedTasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {filter === "completed" ? "完了したタスクはまだありません" : "タスクを追加してみましょう！"}
              </p>
            </div>
          )}
        </div>

        {/* FAB */}
        {!showForm && (
          <motion.div
            className="fixed bottom-20 right-4 z-40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              className="w-14 h-14 rounded-full bg-coral hover:bg-coral/90 text-white shadow-lg shadow-coral/30 p-0"
            >
              <Plus className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
