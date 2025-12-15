import { motion } from "framer-motion";
import { Home, Wallet, Dumbbell } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import type { AppSection } from "@/types/navigation";

interface NavItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

interface DynamicBottomNavProps {
  currentSection: AppSection;
  activeView: string;
  navItems: NavItem[];
  onViewChange: (view: string) => void;
  onGoHome: () => void;
  hidden?: boolean;
}

// Home page nav items
export const HOME_NAV_ITEMS: NavItem[] = [
  { id: "expenses", icon: Wallet, label: "Expenses" },
  { id: "fitness", icon: Dumbbell, label: "Fitness" },
];

export function DynamicBottomNav({
  currentSection,
  activeView,
  navItems,
  onViewChange,
  onGoHome,
  hidden = false,
}: DynamicBottomNavProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isHome = currentSection === "home";

  return (
    <motion.nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      initial={false}
      animate={{
        y: hidden ? 100 : 0,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        background: isDark
          ? "rgba(24, 24, 27, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderTop: isDark
          ? "1px solid rgba(63, 63, 70, 0.5)"
          : "1px solid rgba(228, 228, 231, 0.8)",
        boxShadow: isDark
          ? "0 -4px 24px rgba(0, 0, 0, 0.3)"
          : "0 -4px 24px rgba(0, 0, 0, 0.08)",
      }}
    >
      {/* Top shine effect */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.1) 50%, transparent)"
            : "linear-gradient(90deg, transparent, rgba(255,255,255,0.8) 50%, transparent)",
        }}
      />

      <div className="flex items-center h-14 relative">
        {/* Home button - only shown when not on home page */}
        {!isHome && (
          <motion.button
            initial={{ scale: 0, x: -20 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, x: -20 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={onGoHome}
            className="absolute left-0 z-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            style={{
              width: 40,
              height: 40,
              transform: "translateY(-50%)",
            }}
          >
            {/* Curved background - matching navbar */}
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? "rgba(24, 24, 27, 0.95)"
                  : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderTopRightRadius: "50%",
                borderBottomRightRadius: "50%",
                borderTop: isDark
                  ? "1px solid rgba(63, 63, 70, 0.5)"
                  : "1px solid rgba(228, 228, 231, 0.8)",
                borderRight: isDark
                  ? "1px solid rgba(63, 63, 70, 0.5)"
                  : "1px solid rgba(228, 228, 231, 0.8)",
                borderBottom: isDark
                  ? "1px solid rgba(63, 63, 70, 0.5)"
                  : "1px solid rgba(228, 228, 231, 0.8)",
                boxShadow: isDark
                  ? "2px 0 12px rgba(0, 0, 0, 0.3)"
                  : "2px 0 12px rgba(0, 0, 0, 0.08)",
              }}
            />
            {/* Shine effect */}
            <div
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)",
                borderTopRightRadius: "50%",
                borderBottomRightRadius: "50%",
              }}
            />
            <Home className="h-5 w-5 relative z-10" />
          </motion.button>
        )}

        {/* Nav items container */}
        <div
          className="flex items-center justify-around flex-1 h-full"
          style={{
            marginLeft: isHome ? 0 : 44,
          }}
        >
          {navItems.map(({ id, icon: Icon, label }) => (
            <motion.button
              key={id}
              onClick={() => onViewChange(id)}
              whileTap={{ scale: 0.9 }}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeView === id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {/* Active background glow */}
              {activeView === id && (
                <motion.div
                  layoutId="activeGlow"
                  className="absolute inset-x-4 -top-1 bottom-2 rounded-xl -z-10"
                  style={{
                    background: isDark
                      ? "radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.15) 0%, transparent 70%)"
                      : "radial-gradient(ellipse at center top, rgba(139, 92, 246, 0.1) 0%, transparent 70%)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                animate={{
                  scale: activeView === id ? 1.1 : 1,
                  y: activeView === id ? -2 : 0,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <span className="text-[10px] mt-0.5">{label}</span>
              {activeView === id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                    boxShadow: "0 0 8px rgba(139, 92, 246, 0.5)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.nav>
  );
}

