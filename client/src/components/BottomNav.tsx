/*
 * Design: Gentle Push — Bottom navigation with organic shapes
 * 4 tabs: Home/Dashboard, Tasks, Chat, Streak
 */
import { useLocation } from "wouter";
import { Home, ListTodo, MessageCircle, Flame } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", icon: Home, label: "ホーム" },
  { path: "/tasks", icon: ListTodo, label: "タスク" },
  { path: "/chat", icon: MessageCircle, label: "コーチ" },
  { path: "/streak", icon: Flame, label: "記録" },
];

export default function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 w-16 h-full"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
