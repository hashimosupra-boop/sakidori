/*
 * Design: Gentle Push — Onboarding flow
 * Step 1: Name input
 * Step 2: Procrastination type quiz (3 questions)
 * Step 3: Result display
 * Step 4: Coach selection (cat/owl/dog)
 * Saves profile to server via tRPC
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COACH_DATA, PROCRASTINATION_TYPES } from "@shared/coaches";
import type { CoachType, ProcrastinationType } from "@shared/coaches";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";

const ONBOARDING_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663097564530/knVDDtcSL2Wdwe8QpUtBw5/onboarding-bg-jeu6TZWsdLyGRt2YZ2qeta.webp";

const quizQuestions = [
  {
    question: "タスクを後回しにする一番の理由は？",
    options: [
      { label: "完璧にやりたいから、準備が整うまで待ちたい", type: "perfectionist" as const },
      { label: "やることが多すぎて、何から手をつけていいかわからない", type: "overwhelmed" as const },
      { label: "やらなきゃいけないと言われると、逆にやりたくなくなる", type: "rebel" as const },
      { label: "もっと楽しいことや面白いアイデアに気が散ってしまう", type: "dreamer" as const },
    ],
  },
  {
    question: "締め切りが近づいたとき、どう感じる？",
    options: [
      { label: "もっと時間があれば完璧にできるのに…と焦る", type: "perfectionist" as const },
      { label: "パニックになって、とにかく何かやろうとする", type: "overwhelmed" as const },
      { label: "プレッシャーを感じると逆にやる気が出る", type: "rebel" as const },
      { label: "なんとかなるでしょ、と楽観的に考える", type: "dreamer" as const },
    ],
  },
  {
    question: "作業を始めるとき、一番の障壁は？",
    options: [
      { label: "失敗するのが怖くて、なかなか着手できない", type: "perfectionist" as const },
      { label: "タスクが大きすぎて、どこから始めればいいかわからない", type: "overwhelmed" as const },
      { label: "自分のペースでやりたいのに、強制されている感じがする", type: "rebel" as const },
      { label: "他のことに興味が移って、集中が続かない", type: "dreamer" as const },
    ],
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0); // 0: name, 1-3: quiz, 4: result, 5: coach select
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<ProcrastinationType[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<CoachType | null>(null);
  const [, setLocation] = useLocation();

  const { user, loading: authLoading } = useAuth();
  const saveProfile = trpc.profile.save.useMutation();

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const procrastinationType = (): ProcrastinationType => {
    const counts: Record<string, number> = {};
    answers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "overwhelmed") as ProcrastinationType;
  };

  const handleQuizAnswer = (type: ProcrastinationType) => {
    setAnswers([...answers, type]);
    if (step < 3) {
      setStep(step + 1);
    } else {
      setStep(4);
    }
  };

  const handleComplete = async () => {
    if (!selectedCoach) return;
    try {
      await saveProfile.mutateAsync({
        nickname: name || "ユーザー",
        coachType: selectedCoach,
        procrastinationType: procrastinationType(),
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: `url(${ONBOARDING_BG})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-cream/80 backdrop-blur-sm" />

      {/* Progress bar */}
      <div className="relative z-10 pt-6 px-6">
        <div className="max-w-sm mx-auto">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i <= step ? "bg-coral" : "bg-foreground/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pt-12 pb-8 max-w-sm mx-auto min-h-[calc(100vh-3rem)]">
        <AnimatePresence mode="wait">
          {/* Step 0: Name */}
          {step === 0 && (
            <motion.div
              key="name"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  はじめまして！
                </h2>
                <p className="text-muted-foreground text-sm">あなたのことを教えてください。</p>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-medium">ニックネーム</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: たろう"
                  className="rounded-xl h-12 bg-card border-border/50 text-base"
                />
              </div>
              <Button
                onClick={() => setStep(1)}
                disabled={!name.trim()}
                className="w-full bg-coral hover:bg-coral/90 text-white rounded-full h-12 font-bold shadow-lg shadow-coral/20"
              >
                次へ
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Steps 1-3: Quiz */}
          {step >= 1 && step <= 3 && (
            <motion.div
              key={`quiz-${step}`}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div>
                <p className="text-xs text-coral font-bold mb-2">質問 {step} / 3</p>
                <h2 className="text-xl font-bold leading-snug" style={{ fontFamily: "var(--font-display)" }}>
                  {quizQuestions[step - 1].question}
                </h2>
              </div>
              <div className="space-y-3">
                {quizQuestions[step - 1].options.map((option) => (
                  <button
                    key={option.type}
                    onClick={() => handleQuizAnswer(option.type)}
                    className="w-full text-left p-4 rounded-2xl bg-card border border-border/50 hover:border-coral/40 hover:bg-coral/5 transition-all duration-200 text-sm leading-relaxed active:scale-[0.98]"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {step > 1 && (
                <button
                  onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }}
                  className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" /> 前の質問に戻る
                </button>
              )}
            </motion.div>
          )}

          {/* Step 4: Result */}
          {step === 4 && (
            <motion.div
              key="result"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-8 text-center"
            >
              <Sparkles className="w-10 h-10 text-sunny mx-auto" />
              <div>
                <p className="text-xs text-muted-foreground mb-2">あなたの先延ばしタイプは…</p>
                <h2 className="text-3xl font-extrabold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {PROCRASTINATION_TYPES[procrastinationType()].label}
                </h2>
                <p className="text-muted-foreground text-sm mt-4 leading-relaxed max-w-xs mx-auto">
                  {PROCRASTINATION_TYPES[procrastinationType()].strategy}
                </p>
              </div>
              <Button
                onClick={() => setStep(5)}
                className="bg-coral hover:bg-coral/90 text-white rounded-full h-12 px-8 font-bold shadow-lg shadow-coral/20"
              >
                コーチを選ぶ
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 5: Coach Selection */}
          {step === 5 && (
            <motion.div
              key="coach"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  コーチを選ぼう
                </h2>
                <p className="text-muted-foreground text-sm">あなたに寄り添うパートナーを選んでください。</p>
              </div>
              <div className="space-y-3">
                {(Object.entries(COACH_DATA) as [CoachType, typeof COACH_DATA["cat"]][]).map(([type, coach]) => (
                  <button
                    key={type}
                    onClick={() => setSelectedCoach(type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
                      selectedCoach === type
                        ? "border-coral bg-coral/5 shadow-md shadow-coral/10"
                        : "border-border/50 bg-card hover:border-coral/30"
                    }`}
                  >
                    <img
                      src={coach.image}
                      alt={coach.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-cream"
                    />
                    <div className="text-left flex-1">
                      <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
                        {coach.name}
                      </h3>
                      <p className="text-muted-foreground text-xs">{coach.description}</p>
                      <p className="text-foreground/70 text-xs mt-1 leading-relaxed">{coach.personality}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleComplete}
                disabled={!selectedCoach || saveProfile.isPending}
                className="w-full bg-coral hover:bg-coral/90 text-white rounded-full h-12 font-bold shadow-lg shadow-coral/20"
              >
                {saveProfile.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    サキドリを始める！
                    <Sparkles className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
