import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { useTimeEvents } from "@/hooks/useTimeEvents";
import { EVENT_CATEGORIES } from "@/lib/supabase";

export function TrendsView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { events } = useTimeEvents();

  // Calculate category distribution for last 7 days
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const recentEvents = events.filter((e) => e.date >= weekAgoStr);
    const categoryCount: Record<string, number> = {};

    recentEvents.forEach((e) => {
      categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
    });

    const total = recentEvents.length;

    return EVENT_CATEGORIES.map((cat) => ({
      ...cat,
      count: categoryCount[cat.id] || 0,
      percent: total > 0 ? ((categoryCount[cat.id] || 0) / total) * 100 : 0,
    })).filter((c) => c.count > 0);
  }, [events]);

  const totalEvents = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-4"
        style={{
          background: isDark
            ? "rgba(255, 255, 255, 0.03)"
            : "rgba(0, 0, 0, 0.02)",
          border: isDark
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Last 7 Days
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="text-3xl font-bold font-mono"
            style={{ color: "#14b8a6" }}
          >
            {totalEvents}
          </span>
          <span className="text-sm text-muted-foreground">events tracked</span>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      {stats.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: isDark
              ? "1px solid rgba(255, 255, 255, 0.08)"
              : "1px solid rgba(0, 0, 0, 0.06)",
          }}
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            By Category
          </p>

          {stats.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">
                  {stat.label}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {stat.count} ({stat.percent.toFixed(0)}%)
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.percent}%` }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                  className="h-full rounded-full"
                  style={{ background: stat.color }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 text-center"
          style={{
            background: isDark
              ? "rgba(255, 255, 255, 0.03)"
              : "rgba(0, 0, 0, 0.02)",
            border: `1px dashed ${
              isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"
            }`,
          }}
        >
          <p className="text-sm text-muted-foreground">No events this week</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add events to see your time distribution
          </p>
        </motion.div>
      )}
    </div>
  );
}

