import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Wallet,
  Landmark,
  TrendingUp,
  Shield,
  Building2,
  Banknote,
  PiggyBank,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "./constants";
import { supabase, type UserStats } from "@/lib/supabase";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { toast } from "sonner";

// Type for goal progress data
type GoalProgress = {
  monthlySavings: number;
  timeToGoal: {
    months: number;
    years: number;
    remainingMonths: number;
    targetDate: Date;
  } | null;
};

// Target net worth: 1 Crore (₹1,00,00,000)
const TARGET_NET_WORTH = 10000000;

// Asset categories with their display info
const ASSET_CATEGORIES = [
  {
    key: "bank_savings" as const,
    label: "Bank Savings",
    icon: Landmark,
    color: "emerald",
  },
  {
    key: "fixed_deposits" as const,
    label: "Fixed Deposits",
    icon: Building2,
    color: "blue",
  },
  {
    key: "mutual_funds" as const,
    label: "Mutual Funds",
    icon: TrendingUp,
    color: "violet",
  },
  { key: "ppf" as const, label: "PPF", icon: Shield, color: "amber" },
  { key: "epf" as const, label: "EPF", icon: PiggyBank, color: "rose" },
] as const;

type AssetKey = (typeof ASSET_CATEGORIES)[number]["key"];

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-900/30",
    text: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-600 dark:text-rose-400",
  },
};

interface NetWorthCardProps {
  netWorth: number;
  theme: "light" | "dark";
  loading: boolean;
  onEdit: () => void;
  goalProgress?: GoalProgress;
}

// Format duration as years and months
function formatDuration(years: number, months: number): string {
  if (years === 0 && months === 0) return "Done!";
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

export function NetWorthCard({
  netWorth,
  theme,
  loading,
  onEdit,
  goalProgress,
}: NetWorthCardProps) {
  const percentToTarget = Math.min(100, (netWorth / TARGET_NET_WORTH) * 100);

  // Color scheme based on progress
  const getProgressGradient = () => {
    if (percentToTarget >= 90) {
      return "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)";
    } else if (percentToTarget >= 50) {
      return "linear-gradient(90deg, #7c3aed 0%, #a78bfa 100%)";
    } else {
      return "linear-gradient(90deg, #14b8a6 0%, #5eead4 100%)";
    }
  };

  const hasGoalData = goalProgress?.timeToGoal != null;
  const goalReached = hasGoalData && goalProgress.timeToGoal!.months === 0;

  return (
    <div className="sticky top-0 z-30 px-4 md:px-6 pt-3">
      <button
        onClick={onEdit}
        className="w-full max-w-6xl mx-auto px-3 py-2.5 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
        style={{
          backgroundColor:
            theme === "dark"
              ? "rgba(24, 24, 27, 0.7)"
              : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow:
            theme === "dark"
              ? "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)"
              : "0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)",
          border:
            theme === "dark"
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Top row: Net worth + projected date */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background:
                  theme === "dark"
                    ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)"
                    : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)",
              }}
            >
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">
                Net Worth
              </p>
              {loading ? (
                <div className="h-5 w-24 bg-muted/50 rounded animate-pulse" />
              ) : (
                <p
                  className="text-sm font-bold font-mono text-income truncate"
                  style={{
                    textShadow:
                      theme === "dark"
                        ? "0 0 12px rgba(139, 92, 246, 0.4)"
                        : "none",
                  }}
                >
                  <AnimatedNumber value={netWorth} formatFn={formatCurrency} />
                </p>
              )}
            </div>
          </div>
          
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>

        {/* Progress bar with goal info inside */}
        <div className="relative h-3.5 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentToTarget}%` }}
            transition={{
              duration: 1,
              ease: [0.25, 0.46, 0.45, 0.94],
              delay: 0.2,
            }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: getProgressGradient() }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 50%)",
              }}
            />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-foreground/70"
          >
            {goalReached ? (
              <span className="flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-500" />
                <span className="text-amber-500">₹1Cr reached!</span>
              </span>
            ) : hasGoalData ? (
              <span>₹1Cr in {formatDuration(goalProgress.timeToGoal!.years, goalProgress.timeToGoal!.remainingMonths)}</span>
            ) : (
              <span>{percentToTarget.toFixed(1)}%</span>
            )}
          </motion.span>
        </div>
      </button>
    </div>
  );
}

interface NetWorthEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userStats: UserStats | null;
  onUpdate: (updated: UserStats) => void;
}

export function NetWorthEditDialog({
  open,
  onOpenChange,
  userStats,
  onUpdate,
}: NetWorthEditDialogProps) {
  const { theme } = useTheme();
  const [values, setValues] = useState<Record<AssetKey, string>>({
    bank_savings: "0",
    fixed_deposits: "0",
    mutual_funds: "0",
    ppf: "0",
    epf: "0",
  });
  const [monthlyIncome, setMonthlyIncome] = useState<string>("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && userStats) {
      setValues({
        bank_savings: (userStats.bank_savings || 0).toString(),
        fixed_deposits: (userStats.fixed_deposits || 0).toString(),
        mutual_funds: (userStats.mutual_funds || 0).toString(),
        ppf: (userStats.ppf || 0).toString(),
        epf: (userStats.epf || 0).toString(),
      });
      setMonthlyIncome((userStats.monthly_income || 0).toString());
    }
  }, [open, userStats]);

  async function handleSave() {
    if (!userStats?.id) {
      toast.error("No user stats found");
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        bank_savings: parseFloat(values.bank_savings) || 0,
        fixed_deposits: parseFloat(values.fixed_deposits) || 0,
        mutual_funds: parseFloat(values.mutual_funds) || 0,
        ppf: parseFloat(values.ppf) || 0,
        epf: parseFloat(values.epf) || 0,
        monthly_income: parseFloat(monthlyIncome) || null,
      };

      const { error } = await supabase
        .from("user_stats")
        .update(updateData)
        .eq("id", userStats.id);
      if (error) throw error;

      onUpdate({ ...userStats, ...updateData });
      onOpenChange(false);
      toast.success("Assets updated");
    } catch (err) {
      console.error("Failed to update:", err);
      toast.error("Failed to update assets");
    } finally {
      setSaving(false);
    }
  }

  function handleAddSalary() {
    const income = parseFloat(monthlyIncome) || 0;
    if (income > 0) {
      const currentSavings = parseFloat(values.bank_savings) || 0;
      setValues((prev) => ({
        ...prev,
        bank_savings: (currentSavings + income).toString(),
      }));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm max-h-[85vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-primary" />
            Edit Assets
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Asset Fields */}
          <div className="space-y-2">
            {ASSET_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const colors = COLOR_CLASSES[cat.color] || COLOR_CLASSES.emerald;
              return (
                <div key={cat.key} className="flex items-center gap-2">
                  <div
                    className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 mt-7 ${colors.bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      {cat.label}
                    </label>
                    <Input
                      type="number"
                      value={values[cat.key]}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [cat.key]: e.target.value,
                        }))
                      }
                      className="font-mono h-8 text-xs"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div
            className="h-px"
            style={{
              background:
                theme === "dark"
                  ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
                  : "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
            }}
          />

          {/* Monthly Income Section */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-green-100 dark:bg-green-900/30">
              <Banknote className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <label className="text-[10px] font-medium text-muted-foreground">
                Monthly Income
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="font-mono h-8 text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={handleAddSalary}
                  disabled={!monthlyIncome || parseFloat(monthlyIncome) <= 0}
                >
                  Add Salary
                </Button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-8 text-xs"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
