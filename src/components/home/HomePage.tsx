import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useUserStats } from "@/hooks/useExpenseData";
import { useMutualFundWatchlist, calculateMFPortfolioTotals } from "@/hooks/useMutualFunds";
import { BountyBoard } from "@/components/home/BountyBoard";
import { NetWorthCard, NetWorthEditDialog } from "@/components/finances/NetWorthCard";
import { calculateNetWorth } from "@/components/finances/utils";

// Ornate corner decoration component
function OrnateCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const rotations = { tl: 0, tr: 90, bl: -90, br: 180 };
  const positions = {
    tl: "top-0 left-0",
    tr: "top-0 right-0",
    bl: "bottom-0 left-0",
    br: "bottom-0 right-0",
  };

  return (
    <div
      className={`absolute ${positions[position]} w-6 h-6 pointer-events-none`}
      style={{ transform: `rotate(${rotations[position]}deg)` }}
    >
      <svg viewBox="0 0 24 24" className="w-full h-full opacity-60">
        <path
          d="M0 0 L8 0 L8 2 L2 2 L2 8 L0 8 Z"
          fill="currentColor"
          className="text-amber-700 dark:text-amber-600"
        />
        <path
          d="M0 0 L4 0 L4 1 L1 1 L1 4 L0 4 Z"
          fill="currentColor"
          className="text-amber-500 dark:text-amber-400"
        />
      </svg>
    </div>
  );
}

function CharacterHeader() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4"
    >
      <div
        className="relative rounded-lg p-4 overflow-hidden"
        style={{
          // Parchment background
          background: isDark
            ? `linear-gradient(145deg, 
                rgba(45, 35, 25, 0.95) 0%, 
                rgba(35, 28, 20, 0.95) 100%)`
            : `linear-gradient(145deg, 
                #f5e6c8 0%, 
                #e8d4b0 100%)`,
          border: isDark
            ? "2px solid #5d4530"
            : "2px solid #c9a66b",
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 20px rgba(0, 0, 0, 0.5)"
            : "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Ornate corners */}
        <OrnateCorner position="tl" />
        <OrnateCorner position="tr" />
        <OrnateCorner position="bl" />
        <OrnateCorner position="br" />

        {/* Subtle paper texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative flex items-center justify-between">
          {/* Wax seal / Shield emblem */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
                  : "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)",
                boxShadow: isDark
                  ? "0 2px 8px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"
                  : "0 2px 8px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
                border: "2px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-lg font-bold font-fantasy tracking-wide"
                style={{
                  color: isDark ? "#e8d4b0" : "#44403c",
                  textShadow: isDark
                    ? "1px 1px 2px rgba(0,0,0,0.5)"
                    : "0 1px 0 rgba(255,255,255,0.5)",
                }}
              >
                Sugoto Basu
              </h1>
              <p
                className="text-[10px] font-fantasy uppercase tracking-widest"
                style={{
                  color: isDark ? "#a89070" : "#8b7355",
                }}
              >
                Adventurer
              </p>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// Decorative divider with crossed swords
function OrnateDivider() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-center gap-2 my-4 opacity-40">
      <div
        className="h-px flex-1 max-w-16"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent, #a89070)"
            : "linear-gradient(90deg, transparent, #8b7355)",
        }}
      />
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ color: isDark ? "#a89070" : "#8b7355" }}
      >
        <path d="M12 2L12 22M7 7L17 17M17 7L7 17" />
      </svg>
      <div
        className="h-px flex-1 max-w-16"
        style={{
          background: isDark
            ? "linear-gradient(90deg, #a89070, transparent)"
            : "linear-gradient(90deg, #8b7355, transparent)",
        }}
      />
    </div>
  );
}

export function HomePage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { userStats, updateUserStats } = useUserStats();
  const { funds } = useMutualFundWatchlist();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Calculate real-time MF portfolio value
  const mfPortfolioValue = useMemo(() => {
    const investments = userStats?.investments || [];
    if (funds.length === 0 || investments.length === 0) return undefined;
    const totals = calculateMFPortfolioTotals(funds, investments);
    return totals.current;
  }, [funds, userStats?.investments]);

  // Net worth calculation
  const netWorth = useMemo(
    () => calculateNetWorth(userStats, { mutualFundsValue: mfPortfolioValue }),
    [userStats, mfPortfolioValue]
  );

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{
        // Tavern wooden wall background
        background: isDark
          ? `linear-gradient(180deg, #1a1408 0%, #0f0d08 100%)`
          : `linear-gradient(180deg, #a0785c 0%, #8b6544 100%)`,
      }}
    >
      {/* Wooden plank pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.3 : 0.4,
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 80px,
              ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'} 80px,
              ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'} 82px
            )
          `,
        }}
      />

      {/* Horizontal wood grain lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.15 : 0.2,
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 8px,
              ${isDark ? 'rgba(139, 90, 43, 0.3)' : 'rgba(139, 90, 43, 0.2)'} 8px,
              ${isDark ? 'rgba(139, 90, 43, 0.3)' : 'rgba(139, 90, 43, 0.2)'} 9px,
              transparent 9px,
              transparent 25px
            )
          `,
        }}
      />

      {/* Wood texture noise */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: isDark ? 0.08 : 0.12,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette effect - darker for tavern feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(0,0,0,0.7) 100%)`
            : `radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0,0,0,0.25) 100%)`,
        }}
      />

      {/* Candlelit ambiance - warm glow from corners */}
      <div
        className="absolute top-0 left-0 w-48 h-48 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at top left, rgba(251, 146, 60, 0.15) 0%, transparent 60%)"
            : "radial-gradient(circle at top left, rgba(251, 191, 36, 0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(circle at top right, rgba(251, 146, 60, 0.1) 0%, transparent 60%)"
            : "radial-gradient(circle at top right, rgba(251, 191, 36, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Main Content */}
      <main className="relative flex-1 overflow-y-auto px-4 pt-4 pb-20">
        {/* Character Profile Header */}
        <CharacterHeader />

        {/* Net Worth Widget */}
        <div className="-mx-4">
          <NetWorthCard
            netWorth={netWorth}
            theme={theme}
            onEdit={() => setEditDialogOpen(true)}
          />
        </div>

        <OrnateDivider />

        {/* Bounty Board - Daily Quests */}
        <BountyBoard />
      </main>

      {/* Net Worth Edit Dialog */}
      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={updateUserStats}
      />

      {/* Footer - Scroll bottom curl effect */}
      <footer
        className="relative shrink-0 py-4 text-center"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, transparent, rgba(26, 21, 16, 0.8))"
            : "linear-gradient(to bottom, transparent, rgba(232, 212, 176, 0.8))",
        }}
      >
        {/* Scroll curl decoration */}
        <div
          className="absolute inset-x-0 top-0 h-3 pointer-events-none"
          style={{
            background: isDark
              ? `linear-gradient(to bottom, 
                  transparent 0%, 
                  rgba(93, 69, 48, 0.3) 50%, 
                  transparent 100%)`
              : `linear-gradient(to bottom, 
                  transparent 0%, 
                  rgba(201, 166, 107, 0.4) 50%, 
                  transparent 100%)`,
            borderRadius: "0 0 50% 50% / 0 0 100% 100%",
          }}
        />

        <p
          className="text-[10px] font-fantasy tracking-wide"
          style={{
            color: isDark ? "#a89070" : "#8b7355",
          }}
        >
          Forged in {new Date().getFullYear()} by{" "}
          <span
            className="font-semibold"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Sugoto Basu
          </span>
        </p>

        {/* Bottom decorative line */}
        <div
          className="mx-auto mt-2 h-px w-24"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent, #5d4530, transparent)"
              : "linear-gradient(90deg, transparent, #c9a66b, transparent)",
          }}
        />
      </footer>
    </div>
  );
}
