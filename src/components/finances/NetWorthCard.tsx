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
  Landmark,
  TrendingUp,
  Shield,
  Building2,
  Banknote,
  PiggyBank,
  Wallet,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { formatCurrency } from "./constants";
import { supabase, type UserStats } from "@/lib/supabase";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { toast } from "sonner";

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
  onEdit: () => void;
}

export function NetWorthCard({
  netWorth,
  theme,
  onEdit,
}: NetWorthCardProps) {
  const isDark = theme === "dark";

  return (
    <div className="sticky top-0 z-30 px-4 md:px-6 pt-3">
      <button
        onClick={onEdit}
        className="relative w-full max-w-6xl mx-auto px-4 py-3 rounded-lg text-left transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden"
        style={{
          // Iron vault door / stone aesthetic
          background: isDark
            ? `linear-gradient(145deg, #27272a 0%, #18181b 50%, #09090b 100%)`
            : `linear-gradient(145deg, #6b7280 0%, #4b5563 50%, #374151 100%)`,
          border: isDark
            ? "2px solid #3f3f46"
            : "2px solid #1f2937",
          boxShadow: isDark
            ? "inset 0 2px 4px rgba(255,255,255,0.08), inset 0 -2px 4px rgba(0,0,0,0.4), 0 6px 20px rgba(0, 0, 0, 0.6)"
            : "inset 0 2px 4px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.25), 0 6px 20px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Stone/metal texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: isDark ? 0.1 : 0.15,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Iron trim at top */}
        <div
          className="absolute inset-x-0 top-0 h-1 pointer-events-none"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent 5%, #52525b 20%, #a1a1aa 50%, #52525b 80%, transparent 95%)"
              : "linear-gradient(90deg, transparent 5%, #4b5563 20%, #9ca3af 50%, #4b5563 80%, transparent 95%)",
          }}
        />

        {/* Centered content */}
        <div className="relative flex flex-col items-center justify-center py-1">
          <p
            className="text-[10px] font-fantasy uppercase tracking-wider font-semibold"
            style={{ color: isDark ? "#a1a1aa" : "#e5e7eb" }}
          >
            Vault Holdings
          </p>
          <p
            className="text-xl font-bold font-mono"
            style={{
              color: isDark ? "#e5e7eb" : "#f9fafb",
              textShadow: isDark
                ? "0 0 12px rgba(161, 161, 170, 0.4)"
                : "0 1px 2px rgba(0,0,0,0.4)",
            }}
          >
            <AnimatedNumber value={netWorth} formatFn={formatCurrency} animateOnMount />
          </p>
        </div>

        {/* Iron bolt/rivet corners */}
        {["top-1.5 left-1.5", "top-1.5 right-1.5", "bottom-1.5 left-1.5", "bottom-1.5 right-1.5"].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-2.5 h-2.5 rounded-full pointer-events-none`}
            style={{
              background: isDark
                ? "radial-gradient(circle at 30% 30%, #71717a 0%, #3f3f46 60%, #27272a 100%)"
                : "radial-gradient(circle at 30% 30%, #d1d5db 0%, #6b7280 60%, #374151 100%)",
              boxShadow: isDark
                ? "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(0,0,0,0.5)"
                : "inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.3)",
              border: isDark ? "1px solid #52525b" : "1px solid #4b5563",
            }}
          />
        ))}
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
