/*
 * Design: Gentle Push - AI Coach Chat
 * Chat interface with real LLM-powered AI coach via tRPC
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { COACH_DATA } from "@shared/coaches";
import type { CoachType } from "@shared/coaches";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const historyQuery = trpc.chat.history.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  const sendMutation = trpc.chat.send.useMutation({
    onSuccess: () => {
      utils.chat.history.invalidate();
    },
  });

  useEffect(() => {
    if (!authLoading && !user) setLocation("/");
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.onboardingComplete) {
      setLocation("/onboarding");
    }
  }, [profileQuery.data, setLocation]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historyQuery.data, sendMutation.isPending]);

  if (authLoading || profileQuery.isLoading || historyQuery.isLoading) {
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
  const messages = historyQuery.data ?? [];

  const handleSend = () => {
    if (!input.trim() || sendMutation.isPending) return;
    const userMsg = input.trim();
    setInput("");
    sendMutation.mutate({ message: userMsg });
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 bg-card/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img src={coach.image} alt={coach.name} className="w-10 h-10 rounded-xl object-cover bg-cream" />
          <div>
            <h1 className="font-bold text-sm" style={{ fontFamily: "var(--font-display)" }}>{coach.name}</h1>
            <p className="text-[10px] text-teal font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal inline-block" />
              オンライン
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <div className="max-w-lg mx-auto space-y-3">
          {messages.length === 0 && !sendMutation.isPending && (
            <div className="text-center py-8">
              <img src={coach.image} alt={coach.name} className="w-16 h-16 rounded-2xl object-cover bg-cream mx-auto mb-3" />
              <p className="text-sm text-foreground/80 font-medium mb-1">{coach.name}がお待ちしています</p>
              <p className="text-xs text-muted-foreground">{coach.greeting}</p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "coach" && (
                  <img src={coach.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-cream mr-2 mt-1 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-coral text-white rounded-2xl rounded-br-md"
                      : "bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm"
                  }`}
                >
                  {msg.role === "coach" ? (
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {sendMutation.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-end gap-2"
            >
              <img src={coach.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-cream" />
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-muted-foreground/40"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto pb-2">
            {["やる気が出ない...", "タスクを整理したい", "先延ばしをやめたい"].map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-card border border-border/50 text-xs text-muted-foreground hover:border-coral/30 hover:text-coral transition-colors"
              >
                <Sparkles className="w-3 h-3 inline mr-1" />
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="fixed bottom-16 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/30 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && handleSend()}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-full h-10 bg-cream border-border/50 text-sm px-4"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-full bg-coral hover:bg-coral/90 text-white p-0 shadow-sm"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
