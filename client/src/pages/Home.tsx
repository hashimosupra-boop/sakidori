/*
 * Design: Gentle Push — Landing page
 * Hero with illustration, feature highlights, CTA to onboarding
 * Color: Cream base, Coral primary, Teal secondary, Sunny accent
 */
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { ArrowRight, Brain, ListChecks, Flame, MessageCircle, Loader2, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import PreviewModal from "@/components/PreviewModal";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663097564530/knVDDtcSL2Wdwe8QpUtBw5/hero-illustration-3o9Tg6SKiGmtzfGoKu7Nyg.webp";

const features = [
  {
    icon: MessageCircle,
    title: "AIコーチが寄り添う",
    description: "3タイプのキャラクターから選べるAIコーチが、あなたのペースに合わせて励ましてくれます。",
    color: "bg-coral-light text-coral",
  },
  {
    icon: Brain,
    title: "先延ばしタイプを診断",
    description: "あなたの先延ばしの原因を分析し、パーソナライズされた克服戦略を提案します。",
    color: "bg-teal-light text-teal",
  },
  {
    icon: ListChecks,
    title: "スマートなタスク管理",
    description: "AIが優先順位を提案。「5分だけ」のマイクロタスクで、無理なく始められます。",
    color: "bg-sunny-light text-amber-600",
  },
  {
    icon: Flame,
    title: "ストリークで習慣化",
    description: "毎日の達成を記録。連続日数が伸びるほど、あなたの「庭」が育っていきます。",
    color: "bg-coral-light text-coral",
  },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const profileQuery = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.data?.onboardingComplete) {
      setLocation("/dashboard");
    }
  }, [profileQuery.data, setLocation]);

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-coral" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 px-4">
        {/* Floating blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-coral/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="max-w-lg mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-coral">サキドリ</span>
            </h1>
            <p className="text-muted-foreground text-sm font-medium">先延ばしを、先取りに変えよう</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto max-w-sm"
          >
            <img
              src={HERO_IMG}
              alt="サキドリ - AIコーチと一緒にタスクを先取り"
              className="w-full h-auto rounded-3xl"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-6 space-y-3"
          >
            <p className="text-foreground/80 text-base leading-relaxed max-w-xs mx-auto">
              AIコーチがあなたに寄り添い、<br />
              <span className="font-semibold text-teal">「5分だけ」</span>の一歩を後押しします。
            </p>
            <Button
              size="lg"
              onClick={() => setLocation("/onboarding")}
              className="bg-coral hover:bg-coral/90 text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-coral/25 transition-all hover:shadow-xl hover:shadow-coral/30 hover:-translate-y-0.5"
            >
              はじめる
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="text-teal hover:text-teal/80 hover:bg-teal/5 rounded-full gap-1.5"
            >
              <Eye className="w-4 h-4" />
              プレビューを見る
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-10">
        <div className="max-w-lg mx-auto space-y-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-2xl bg-card/60 backdrop-blur-sm"
            >
              <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${feature.color} flex items-center justify-center`}>
                <feature.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1" style={{ fontFamily: "var(--font-display)" }}>
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-12">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-muted-foreground text-xs mb-4">
            無料で始められます。
          </p>
          <Button
            variant="outline"
            onClick={() => setLocation("/onboarding")}
            className="rounded-full border-coral/30 text-coral hover:bg-coral/5 px-6"
          >
            さっそく試してみる
          </Button>
        </div>
      </section>

      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}
