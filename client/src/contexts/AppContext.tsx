/*
 * Design: Gentle Push — Organic UI × Illustration-driven × Storytelling
 * Color: Cream #FFF8F0, Coral #FF6B6B, Teal #2EC4B6, Sunny #FFD93D
 * Typography: Nunito (headings) + Noto Sans JP (body) + Caveat (accents)
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type CoachType = "cat" | "owl" | "dog";
export type ProcrastinationType = "perfectionist" | "overwhelmed" | "rebel" | "dreamer";

export interface Task {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  estimatedMinutes?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "coach";
  content: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  coachType: CoachType;
  procrastinationType: ProcrastinationType;
  onboardingComplete: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  completedDates: string[];
}

interface AppState {
  profile: UserProfile | null;
  tasks: Task[];
  chatMessages: ChatMessage[];
  streak: StreakData;
  setProfile: (profile: UserProfile) => void;
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateStreak: () => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEYS = {
  profile: "sakidori_profile",
  tasks: "sakidori_tasks",
  chat: "sakidori_chat",
  streak: "sakidori_streak",
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(
    () => loadFromStorage(STORAGE_KEYS.profile, null)
  );
  const [tasks, setTasks] = useState<Task[]>(
    () => loadFromStorage(STORAGE_KEYS.tasks, [])
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    () => loadFromStorage(STORAGE_KEYS.chat, [])
  );
  const [streak, setStreak] = useState<StreakData>(
    () => loadFromStorage(STORAGE_KEYS.streak, { currentStreak: 0, longestStreak: 0, completedDates: [] })
  );

  useEffect(() => {
    if (profile) localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.chat, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(streak));
  }, [streak]);

  const setProfile = (p: UserProfile) => setProfileState(p);

  const addTask = (task: Omit<Task, "id" | "createdAt" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined }
          : t
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const addChatMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
  };

  const updateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    setStreak((prev) => {
      if (prev.completedDates.includes(today)) return prev;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const isConsecutive = prev.completedDates.includes(yesterday);
      const newCurrent = isConsecutive ? prev.currentStreak + 1 : 1;
      const newLongest = Math.max(prev.longestStreak, newCurrent);
      return {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        completedDates: [...prev.completedDates, today],
      };
    });
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        tasks,
        chatMessages,
        streak,
        setProfile,
        addTask,
        toggleTask,
        deleteTask,
        addChatMessage,
        updateStreak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
