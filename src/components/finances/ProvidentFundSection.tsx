import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { UserStats } from "@/lib/supabase";
import { useMaskedRupee } from "@/hooks/usePrivacy";

interface ProvidentFundSectionProps {
  userStats: UserStats | null;
  theme: "light" | "dark";
}

export function ProvidentFundSection({ userStats }: ProvidentFundSectionProps) {
  const rupee = useMaskedRupee();
  const [isExpanded, setIsExpanded] = useState(false);
  const ppf = userStats?.ppf ?? 0;
  const epf = userStats?.epf ?? 0;
  const total = ppf + epf;

  if (total === 0) return null;

  const ppfPercent = total > 0 ? (ppf / total) * 100 : 0;
  const epfPercent = total > 0 ? (epf / total) * 100 : 0;

  return (
    <section className="px-6 pt-7 pb-8">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
        Provident Funds
      </p>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left py-2"
      >
        <span className="font-mono tabular-nums text-[22px] tracking-[-0.02em] text-foreground">
          {rupee(total)}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          strokeWidth={1.5}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4">
              <div className="h-[3px] flex w-full bg-outline-variant/30 mb-4 overflow-hidden">
                {ppf > 0 && (
                  <div
                    className="h-full bg-foreground"
                    style={{ width: `${ppfPercent}%` }}
                  />
                )}
                {epf > 0 && (
                  <div
                    className="h-full bg-muted-foreground/50"
                    style={{ width: `${epfPercent}%` }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 divide-x divide-outline-variant/60">
                {ppf > 0 && (
                  <div className="flex flex-col gap-1 pr-3">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      PPF
                    </span>
                    <span className="font-mono tabular-nums text-[14px] text-foreground">
                      {rupee(ppf)}
                    </span>
                  </div>
                )}
                {epf > 0 && (
                  <div className="flex flex-col gap-1 pl-3">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      EPF
                    </span>
                    <span className="font-mono tabular-nums text-[14px] text-foreground">
                      {rupee(epf)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
