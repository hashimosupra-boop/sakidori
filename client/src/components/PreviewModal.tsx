import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Brain, ListChecks, Flame, MessageCircle, CheckCircle2, Circle, Plus, ChevronRight, Sparkles } from "lucide-react";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

function DashboardPreview() {
  return (
    <div className="bg-[#FFF8F0] rounded-2xl p-4 space-y-3 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center text-lg">🦉</div>
        <div>
          <p className="font-bold text-[#3D3D3D]">こんにちは、田中さん！</p>
          <p className="text-xs text-muted-foreground">今日も一緒に頑張ろう</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <p className="text-xs text-muted-foreground">今日のタスク</p>
          <p className="text-2xl font-bold text-coral">3 <span className="text-sm font-normal text-muted-foreground">/ 5</span></p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <p className="text-xs text-muted-foreground">ストリーク</p>
          </div>
          <p className="text-2xl font-bold text-orange-400">7 <span className="text-sm font-normal text-muted-foreground">日連続</span></p>
        </div>
      </div>
      <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">今日のタスク</p>
        {["レポートの下書き", "メールを返信する"].map((task, i) => (
          <div key={i} className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal flex-shrink-0" />
            <span className="text-xs line-through text-muted-foreground">{task}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-coral/40 flex-shrink-0" />
          <span className="text-xs text-[#3D3D3D]">企画書を完成させる</span>
        </div>
      </div>
    </div>
  );
}

function TasksPreview() {
  const tasks = [
    { text: "企画書を完成させる", tag: "仕事", done: false, priority: "高" },
    { text: "5分だけ部屋を片付ける", tag: "生活", done: false, priority: "中" },
    { text: "英単語10個覚える", tag: "学習", done: true, priority: "低" },
  ];
  return (
    <div className="bg-[#FFF8F0] rounded-2xl p-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[#3D3D3D]">タスク一覧</p>
        <div className="w-7 h-7 bg-coral rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="space-y-2">
        {tasks.map((t, i) => (
          <div key={i} className={`bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 ${t.done ? "opacity-60" : ""}`}>
            {t.done
              ? <CheckCircle2 className="w-5 h-5 text-teal flex-shrink-0" />
              : <Circle className="w-5 h-5 text-coral/40 flex-shrink-0" />
            }
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium ${t.done ? "line-through text-muted-foreground" : "text-[#3D3D3D]"}`}>{t.text}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded-full">{t.tag}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${t.priority === "高" ? "bg-coral/10 text-coral" : t.priority === "中" ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-500"}`}>{t.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-teal/10 rounded-xl p-2 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-teal flex-shrink-0" />
        <p className="text-xs text-teal">AIが「5分タスク」を提案できます</p>
        <ChevronRight className="w-3 h-3 text-teal ml-auto flex-shrink-0" />
      </div>
    </div>
  );
}

function ChatPreview() {
  const messages = [
    { role: "coach", text: "企画書、まだ手をつけていないんだね。どのあたりから始めると楽になりそう？" },
    { role: "user", text: "構成を考えるのが苦手で…" },
    { role: "coach", text: "じゃあ、まず「目的を1行書く」だけやってみよう！それだけでOK😊" },
  ];
  return (
    <div className="bg-[#FFF8F0] rounded-2xl p-4 space-y-3 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center text-base">🦉</div>
        <div>
          <p className="font-bold text-[#3D3D3D] text-xs">フクロウ先生</p>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-teal rounded-full animate-pulse" />
            <span className="text-[10px] text-teal">オンライン</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
              m.role === "user"
                ? "bg-coral text-white rounded-br-sm"
                : "bg-white shadow-sm text-[#3D3D3D] rounded-bl-sm"
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-full px-3 py-2 flex items-center gap-2 shadow-sm">
        <span className="text-xs text-muted-foreground flex-1">メッセージを送る…</span>
        <div className="w-6 h-6 bg-coral rounded-full flex items-center justify-center">
          <ChevronRight className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  );
}

function StreakPreview() {
  const days = ["月", "火", "水", "木", "金", "土", "日"];
  const done = [true, true, true, true, true, false, false];
  return (
    <div className="bg-[#FFF8F0] rounded-2xl p-4 space-y-3 text-sm">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Flame className="w-6 h-6 text-orange-400" />
          <span className="text-3xl font-bold text-orange-400">7</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">日連続達成中！</p>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground">{d}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              done[i] ? "bg-teal text-white" : "bg-gray-100 text-gray-400"
            }`}>
              {done[i] ? "✓" : ""}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <p className="text-xs font-semibold text-muted-foreground mb-2">あなたの庭 🌱</p>
        <div className="flex gap-2 items-end">
          {[2, 3, 4, 3, 5, 4, 6].map((h, i) => (
            <div key={i} className="flex-1 rounded-t-sm bg-teal/60" style={{ height: `${h * 6}px` }} />
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">先週比 +12%</p>
      </div>
    </div>
  );
}

const slides = [
  {
    key: "dashboard",
    icon: Brain,
    title: "ダッシュボード",
    description: "コーチの挨拶と今日の進捗をひと目で確認",
    color: "text-coral",
    bg: "bg-coral/10",
    preview: <DashboardPreview />,
  },
  {
    key: "tasks",
    icon: ListChecks,
    title: "タスク管理",
    description: "AIが優先順位を提案。「5分タスク」で無理なく始められる",
    color: "text-teal",
    bg: "bg-teal/10",
    preview: <TasksPreview />,
  },
  {
    key: "chat",
    icon: MessageCircle,
    title: "AIコーチチャット",
    description: "3タイプのコーチが24時間あなたの悩みに寄り添います",
    color: "text-amber-600",
    bg: "bg-amber-50",
    preview: <ChatPreview />,
  },
  {
    key: "streak",
    icon: Flame,
    title: "ストリーク記録",
    description: "毎日の達成が積み重なり、あなたの「庭」が育ちます",
    color: "text-orange-400",
    bg: "bg-orange-50",
    preview: <StreakPreview />,
  },
];

export default function PreviewModal({ open, onClose }: PreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm mx-auto p-0 overflow-hidden bg-[#FFF8F0] rounded-3xl border-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold text-[#3D3D3D] text-center">
            アプリをプレビュー
          </DialogTitle>
          <p className="text-xs text-muted-foreground text-center">スワイプして各機能を確認できます</p>
        </DialogHeader>
        <Carousel className="w-full px-2 pb-6" opts={{ loop: true }}>
          <CarouselContent>
            {slides.map((slide, i) => (
              <CarouselItem key={slide.key}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="px-2"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-2">
                      <div className={`w-9 h-9 rounded-xl ${slide.bg} flex items-center justify-center`}>
                        <slide.icon className={`w-5 h-5 ${slide.color}`} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#3D3D3D]">{slide.title}</p>
                        <p className="text-xs text-muted-foreground">{slide.description}</p>
                      </div>
                    </div>
                    {slide.preview}
                    <div className="flex justify-center gap-1.5 pt-1">
                      {slides.map((_, j) => (
                        <div key={j} className={`w-1.5 h-1.5 rounded-full transition-all ${j === i ? "bg-coral w-4" : "bg-coral/20"}`} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-white/80 border-0 shadow-sm" />
          <CarouselNext className="right-0 bg-white/80 border-0 shadow-sm" />
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
