import type { Transaction } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  EXPENSE_CATEGORIES,
  EXCLUDED_CATEGORIES,
  getTransactionBudgetType,
  CATEGORY_BUDGET_TYPE,
} from "./constants";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { Loader2, Trash2, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TransactionDialogProps {
  transaction: Transaction | null;
  isNew: boolean;
  saving?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  onChange: (transaction: Transaction) => void;
  onDelete?: (transaction: Transaction) => void;
}

function evaluateExpression(expr: string): number | null {
  const cleaned = expr.replace(/\s/g, "");
  if (!/^[\d+\-*/.()]+$/.test(cleaned)) return null;

  try {
    const tokens: (number | string)[] = [];
    let numBuffer = "";
    for (const char of cleaned) {
      if (/[\d.]/.test(char)) {
        numBuffer += char;
      } else {
        if (numBuffer) {
          tokens.push(parseFloat(numBuffer));
          numBuffer = "";
        }
        tokens.push(char);
      }
    }
    if (numBuffer) tokens.push(parseFloat(numBuffer));

    const precedence: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };
    const output: number[] = [];
    const ops: string[] = [];
    const applyOp = () => {
      const op = ops.pop()!;
      const b = output.pop()!;
      const a = output.pop()!;
      switch (op) {
        case "+": output.push(a + b); break;
        case "-": output.push(a - b); break;
        case "*": output.push(a * b); break;
        case "/": output.push(a / b); break;
      }
    };

    for (const token of tokens) {
      if (typeof token === "number") output.push(token);
      else if (token === "(") ops.push(token);
      else if (token === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") applyOp();
        ops.pop();
      } else if (precedence[token]) {
        while (ops.length && precedence[ops[ops.length - 1]] >= precedence[token]) applyOp();
        ops.push(token);
      }
    }

    while (ops.length) applyOp();

    const result = output[0];
    return isNaN(result) || !isFinite(result) ? null : Math.round(result * 100) / 100;
  } catch {
    return null;
  }
}

const EYEBROW = "text-[10px] uppercase tracking-wider text-muted-foreground";

export function TransactionDialog({
  transaction,
  isNew,
  saving = false,
  deleting = false,
  onClose,
  onSave,
  onChange,
  onDelete,
}: TransactionDialogProps) {
  const formatCurrency = useFormatCurrency();
  const [amountInput, setAmountInput] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmountInput(transaction.amount === 0 ? "" : transaction.amount.toString());
      setShowAdvanced(
        Boolean(transaction.prorate_months) ||
          Boolean(transaction.excluded_from_budget && !EXCLUDED_CATEGORIES.includes(transaction.category ?? ""))
      );
    }
  }, [transaction?.id]);

  if (!transaction) return null;

  const isExpression = /[+\-*/]/.test(amountInput);
  const evaluatedAmount = isExpression ? evaluateExpression(amountInput) : null;

  const handleAmountInputChange = (value: string) => {
    setAmountInput(value);
    const num = parseFloat(value);
    if (!isNaN(num) && !isExpression) {
      onChange({ ...transaction, amount: num });
    }
  };

  const handleAmountBlur = () => {
    if (isExpression && evaluatedAmount !== null) {
      onChange({ ...transaction, amount: evaluatedAmount });
      setAmountInput(evaluatedAmount.toString());
    } else if (amountInput === "") {
      onChange({ ...transaction, amount: 0 });
    }
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isExpression && evaluatedAmount !== null) {
      onChange({ ...transaction, amount: evaluatedAmount });
      setAmountInput(evaluatedAmount.toString());
    }
  };

  const handleProrateChange = (value: string) => {
    if (!value) {
      onChange({ ...transaction, prorate_months: null });
      return;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.min(60, Math.max(1, parsed));
    onChange({ ...transaction, prorate_months: clamped });
  };

  const handleProrateBlur = () => {
    if (transaction.prorate_months && transaction.prorate_months <= 1) {
      onChange({ ...transaction, prorate_months: null });
    }
  };

  const handleTimeChange = (value: string) => {
    onChange({ ...transaction, time: value ? value + ":00" : null });
  };

  const handleCategoryClick = (cat: typeof EXPENSE_CATEGORIES[0]) => {
    if (saving) return;
    const isSelected = transaction.category === cat.name;
    const isExcludedCategory = EXCLUDED_CATEGORIES.includes(cat.name);
    const newCategory = isSelected ? null : cat.name;
    const currentIsExcluded = EXCLUDED_CATEGORIES.includes(transaction.category ?? "");
    let newExcludedFromBudget = transaction.excluded_from_budget;
    if (isExcludedCategory && !isSelected) newExcludedFromBudget = true;
    else if (currentIsExcluded && (isSelected || !isExcludedCategory)) newExcludedFromBudget = false;
    onChange({
      ...transaction,
      category: newCategory,
      excluded_from_budget: newExcludedFromBudget,
      budget_type: null,
    });
  };

  const effectiveBudgetType = getTransactionBudgetType(transaction.category, transaction.budget_type);
  const autoBudgetType = CATEGORY_BUDGET_TYPE[transaction.category ?? ""] ?? "want";

  return (
    <Dialog
      open={!!transaction}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent
        className="max-w-md w-[calc(100%-1.5rem)] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-outline-variant bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <p className={EYEBROW}>
            {isNew ? "New expense" : "Edit expense"}
          </p>
          <DialogTitle className="sr-only">
            {transaction.category || (isNew ? "New expense" : "Edit expense")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-3 overflow-y-auto flex-1 space-y-7">
          <div>
            <div className="flex items-baseline gap-2 border-b border-outline-variant/60 pb-3">
              <span className="font-mono text-muted-foreground text-[28px] leading-none">₹</span>
              <input
                id="amount"
                type="text"
                inputMode="text"
                placeholder="0"
                className="flex-1 font-mono tabular-nums text-[40px] leading-none tracking-[-0.03em] text-foreground bg-transparent outline-none placeholder:text-muted-foreground/40"
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={handleAmountKeyDown}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                disabled={saving}
              />
              {isExpression && (
                <span
                  className={`font-mono text-[12px] ${
                    evaluatedAmount !== null ? "text-muted-foreground" : "text-destructive"
                  }`}
                >
                  {evaluatedAmount !== null ? `= ${evaluatedAmount}` : "?"}
                </span>
              )}
            </div>
          </div>

          <div>
            <p className={`${EYEBROW} mb-3`}>Category</p>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${EXPENSE_CATEGORIES.length}, minmax(0, 1fr))` }}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = transaction.category === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    disabled={saving}
                    aria-label={cat.name}
                    aria-pressed={isSelected}
                    className={`h-9 border rounded-md flex items-center justify-center transition-colors active:scale-95 ${
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "border-outline-variant text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence initial={false}>
            {transaction.category && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className={`${EYEBROW} mb-3`}>Budget type</p>
                <div className="grid grid-cols-2 border-y border-outline-variant divide-x divide-outline-variant">
                  {(["need", "want"] as const).map((type) => {
                    const isActive = effectiveBudgetType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          const newBudgetType = type === autoBudgetType ? null : type;
                          onChange({ ...transaction, budget_type: newBudgetType });
                        }}
                        disabled={saving}
                        className={`h-9 text-[10px] uppercase tracking-wider transition-colors ${
                          isActive
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <p className={`${EYEBROW} mb-2`}>Merchant</p>
            <input
              placeholder="Amazon, Swiggy, Uber…"
              className="w-full h-10 text-[15px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/40"
              value={transaction.merchant || ""}
              onChange={(e) => onChange({ ...transaction, merchant: e.target.value })}
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className={`${EYEBROW} mb-2`}>Date</p>
              <input
                type="date"
                className="w-full h-10 text-[14px] font-mono text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none"
                value={transaction.date}
                onChange={(e) => onChange({ ...transaction, date: e.target.value })}
                disabled={saving}
              />
            </div>
            <div>
              <p className={`${EYEBROW} mb-2`}>Time</p>
              <input
                type="time"
                className="w-full h-10 text-[14px] font-mono text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none"
                value={transaction.time?.slice(0, 5) || ""}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              <span className="text-[10px] uppercase">
                More options
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showAdvanced ? "rotate-180" : ""
                }`}
                strokeWidth={1.5}
              />
            </button>

            <AnimatePresence initial={false}>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 space-y-4">
                    <div className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant/60">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground">Spread over months</p>
                        {transaction.prorate_months && transaction.prorate_months > 1 && (
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {formatCurrency(transaction.amount / transaction.prorate_months)}/mo
                          </p>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="1"
                        className="h-8 w-14 text-center font-mono text-[14px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none"
                        value={transaction.prorate_months ?? ""}
                        onChange={(e) => handleProrateChange(e.target.value)}
                        onBlur={handleProrateBlur}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 py-2 border-b border-outline-variant/60">
                      <p className="text-[13px] text-foreground">Exclude from budget</p>
                      <Switch
                        checked={transaction.excluded_from_budget}
                        onCheckedChange={(checked) =>
                          onChange({ ...transaction, excluded_from_budget: checked })
                        }
                        disabled={saving}
                      />
                    </div>

                    {!isNew && onDelete && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || deleting}
                        className="w-full flex items-center justify-center gap-2 h-10 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                        Delete transaction
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-3 shrink-0 border-t border-outline-variant">
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="flex-1 h-11 rounded-lg border border-outline-variant text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(transaction)}
            disabled={saving || deleting}
            className="flex-1 h-11 rounded-lg bg-foreground text-background text-[11px] uppercase tracking-wider transition-opacity active:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-2xl border border-outline-variant bg-background p-6">
          <AlertDialogHeader>
            <p className={`${EYEBROW} mb-3`}>Confirm</p>
            <AlertDialogTitle className="text-[20px] font-heading tracking-[-0.02em] text-foreground">
              Delete this transaction?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-muted-foreground pt-1">
              {transaction.merchant ? (
                <>
                  Your record from <span className="text-foreground">{transaction.merchant}</span> will be removed permanently.
                </>
              ) : (
                "This record will be removed permanently."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-5">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-lg h-11 px-5 border border-outline-variant bg-transparent text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) onDelete(transaction);
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              className="rounded-lg h-11 px-5 bg-destructive text-background text-[11px] uppercase tracking-wider border-0"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Deleting
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
