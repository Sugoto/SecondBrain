import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  IndianRupee,
  Calendar,
  Percent,
  RefreshCw,
  PiggyBank,
  Target,
} from "lucide-react";
import { formatCurrency } from "./constants";
import { AnimatedNumber } from "@/components/AnimatedNumber";

type CalculatorMode = "sip" | "lumpsum";

interface InvestmentCalculatorProps {
  theme: "light" | "dark";
}

export function InvestmentCalculator({ theme }: InvestmentCalculatorProps) {
  const [mode, setMode] = useState<CalculatorMode>("sip");

  // SIP inputs
  const [sipAmount, setSipAmount] = useState<string>("10000");
  const [sipYears, setSipYears] = useState<string>("10");
  const [sipRate, setSipRate] = useState<string>("12");

  // Lumpsum inputs
  const [lumpsumAmount, setLumpsumAmount] = useState<string>("100000");
  const [lumpsumYears, setLumpsumYears] = useState<string>("10");
  const [lumpsumRate, setLumpsumRate] = useState<string>("12");

  const sipResult = useMemo(() => {
    const P = parseFloat(sipAmount) || 0;
    const n = (parseFloat(sipYears) || 0) * 12;
    const r = (parseFloat(sipRate) || 0) / 100 / 12;

    if (r === 0 || n === 0) {
      return { futureValue: P * n, invested: P * n, returns: 0 };
    }

    const futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    const invested = P * n;
    return {
      futureValue: Math.round(futureValue),
      invested: Math.round(invested),
      returns: Math.round(futureValue - invested),
    };
  }, [sipAmount, sipYears, sipRate]);

  const lumpsumResult = useMemo(() => {
    const P = parseFloat(lumpsumAmount) || 0;
    const n = parseFloat(lumpsumYears) || 0;
    const r = (parseFloat(lumpsumRate) || 0) / 100;

    const futureValue = P * Math.pow(1 + r, n);
    return {
      futureValue: Math.round(futureValue),
      invested: Math.round(P),
      returns: Math.round(futureValue - P),
    };
  }, [lumpsumAmount, lumpsumYears, lumpsumRate]);

  const result = mode === "sip" ? sipResult : lumpsumResult;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="p-0 overflow-hidden">
        {/* Header with mode toggle */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{
                background: theme === "dark"
                  ? "linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.2) 100%)"
                  : "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)",
              }}
            >
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Investment Calculator</h3>
              <p className="text-[10px] text-muted-foreground">Plan your investments</p>
            </div>
          </div>

          {/* Mode Toggle */}
          <div
            className="flex p-0.5 rounded-lg"
            style={{
              backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            }}
          >
            <button
              onClick={() => setMode("sip")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                mode === "sip"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="h-3 w-3" />
                SIP
              </span>
            </button>
            <button
              onClick={() => setMode("lumpsum")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all duration-200 ${
                mode === "lumpsum"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <PiggyBank className="h-3 w-3" />
                Lumpsum
              </span>
            </button>
          </div>
        </div>

        {/* Calculator Inputs */}
        <div className="p-3 space-y-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "sip" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "sip" ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {mode === "sip" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      Monthly Investment
                    </label>
                    <Input
                      type="number"
                      value={sipAmount}
                      onChange={(e) => setSipAmount(e.target.value)}
                      placeholder="10000"
                      className="font-mono h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Years
                      </label>
                      <Input
                        type="number"
                        value={sipYears}
                        onChange={(e) => setSipYears(e.target.value)}
                        placeholder="10"
                        className="font-mono h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        Rate (% p.a.)
                      </label>
                      <Input
                        type="number"
                        value={sipRate}
                        onChange={(e) => setSipRate(e.target.value)}
                        placeholder="12"
                        className="font-mono h-8 text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <IndianRupee className="h-3 w-3 text-muted-foreground" />
                      Investment Amount
                    </label>
                    <Input
                      type="number"
                      value={lumpsumAmount}
                      onChange={(e) => setLumpsumAmount(e.target.value)}
                      placeholder="100000"
                      className="font-mono h-8 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Years
                      </label>
                      <Input
                        type="number"
                        value={lumpsumYears}
                        onChange={(e) => setLumpsumYears(e.target.value)}
                        placeholder="10"
                        className="font-mono h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium flex items-center gap-1.5">
                        <Percent className="h-3 w-3 text-muted-foreground" />
                        Rate (% p.a.)
                      </label>
                      <Input
                        type="number"
                        value={lumpsumRate}
                        onChange={(e) => setLumpsumRate(e.target.value)}
                        placeholder="12"
                        className="font-mono h-8 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Results */}
        <div
          className="p-3 space-y-1.5"
          style={{
            background: theme === "dark"
              ? "linear-gradient(180deg, rgba(139, 92, 246, 0.05) 0%, rgba(99, 102, 241, 0.02) 100%)"
              : "linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(99, 102, 241, 0.03) 100%)",
          }}
        >
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Total Invested</span>
            <span className="font-mono text-xs font-medium">{formatCurrency(result.invested)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">Est. Returns</span>
            <span className="font-mono text-xs font-medium text-emerald-500">+{formatCurrency(result.returns)}</span>
          </div>
          <div
            className="h-px my-1"
            style={{
              background: theme === "dark"
                ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)"
                : "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
            }}
          />
          <div className="flex items-center justify-between py-1">
            <span className="text-xs font-medium flex items-center gap-1.5">
              <Target className="h-3 w-3 text-primary" />
              Future Value
            </span>
            <span
              className="font-mono font-bold text-sm text-income"
              style={{ textShadow: theme === "dark" ? "0 0 12px rgba(139, 92, 246, 0.3)" : "none" }}
            >
              <AnimatedNumber value={result.futureValue} formatFn={formatCurrency} />
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
