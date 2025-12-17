import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";
import { supabase, type UserStats } from "@/lib/supabase";
import { Footer } from "./Footer";
import { NetWorthCard, NetWorthEditDialog } from "./NetWorthCard";
import { InvestmentCalculator } from "./InvestmentCalculator";
import { calculateNetWorth } from "./utils";

export function InvestmentsView() {
  const { theme } = useTheme();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchUserStats() {
      try {
        const { data, error } = await supabase
          .from("user_stats")
          .select("*")
          .limit(1)
          .single();

        if (error) {
          console.error("Error fetching user stats:", error);
        }
        setUserStats(data);
      } catch (err) {
        console.error("Failed to fetch user stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserStats();
  }, []);

  const netWorth = useMemo(() => calculateNetWorth(userStats), [userStats]);

  return (
    <div className="pb-4">
      <NetWorthCard
        netWorth={netWorth}
        theme={theme}
        loading={loading}
        onEdit={() => setEditDialogOpen(true)}
      />

      <NetWorthEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userStats={userStats}
        onUpdate={setUserStats}
      />

      <div className="max-w-6xl mx-auto p-4 md:p-6 pt-4 space-y-4">
        <InvestmentCalculator theme={theme} />
        <Footer />
      </div>
    </div>
  );
}
