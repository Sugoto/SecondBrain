import type { Transaction } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  EXPENSE_CATEGORIES,
  EXCLUDED_CATEGORIES,
  getTransactionBudgetType,
  CATEGORY_BUDGET_TYPE,
  CATEGORY_PASTEL_COLORS,
} from "./constants";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { Loader2, Trash2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
      if (typeof token === "number") {
        output.push(token);
      } else if (token === "(") {
        ops.push(token);
      } else if (token === ")") {
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
      // Auto-open advanced section if it has values
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
        className="max-w-md w-[calc(100%-1.5rem)] rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 bg-surface-container-high shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-5 pt-5 pb-2">
          <DialogTitle className="text-title-l text-foreground">
            {transaction.category || (isNew ? "New expense" : "Edit expense")}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-3 overflow-y-auto flex-1 space-y-4">
          {/* Hero amount input */}
          <div className="space-y-1.5">
            <label className="text-label-m text-muted-foreground">Amount</label>
            <div className="flex items-baseline gap-2 bg-surface-container rounded-xl px-4 py-3">
              <span className="font-mono text-title-l text-muted-foreground">₹</span>
              <Input
                id="amount"
                type="text"
                inputMode="text"
                placeholder="0"
                className="flex-1 font-mono text-title-l text-foreground bg-transparent border-0 px-0 h-auto py-0 placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-0"
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={handleAmountKeyDown}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                disabled={saving}
              />
              {isExpression && (
                <span
                  className={`font-mono text-label-m ${
                    evaluatedAmount !== null ? "text-foreground" : "text-destructive"
                  }`}
                >
                  {evaluatedAmount !== null ? `= ${evaluatedAmount}` : "?"}
                </span>
              )}
            </div>
          </div>

          {/* Category strip */}
          <div className="space-y-1.5">
            <label className="text-label-m text-muted-foreground">Category</label>
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${EXPENSE_CATEGORIES.length}, minmax(0, 1fr))` }}
            >
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = transaction.category === cat.name;
                const pastel = CATEGORY_PASTEL_COLORS[cat.name] || "bg-pastel-blue";
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    disabled={saving}
                    aria-label={cat.name}
                    aria-pressed={isSelected}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${pastel} ${
                      isSelected
                        ? "ring-2 ring-primary text-foreground"
                        : "text-foreground/70"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Need/Want segmented pill — shown only when category selected */}
          <AnimatePresence initial={false}>
            {transaction.category && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-label-m text-muted-foreground">Budget type</label>
                  <div className="flex bg-surface-container rounded-full p-0.5">
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
                          className={`flex-1 rounded-full py-1.5 text-label-m capitalize transition-colors ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Merchant */}
          <div className="space-y-1.5">
            <label className="text-label-m text-muted-foreground">Merchant</label>
            <Input
              placeholder="Amazon, Swiggy, Uber…"
              className="h-11 text-body-m bg-surface-container border-0 rounded-xl px-4 focus-visible:ring-1 focus-visible:ring-primary"
              value={transaction.merchant || ""}
              onChange={(e) => onChange({ ...transaction, merchant: e.target.value })}
              disabled={saving}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-label-m text-muted-foreground">Date</label>
              <Input
                type="date"
                className="h-11 text-body-m bg-surface-container border-0 rounded-xl px-3 focus-visible:ring-1 focus-visible:ring-primary"
                value={transaction.date}
                onChange={(e) => onChange({ ...transaction, date: e.target.value })}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-m text-muted-foreground">Time</label>
              <Input
                type="time"
                className="h-11 text-body-m bg-surface-container border-0 rounded-xl px-3 focus-visible:ring-1 focus-visible:ring-primary"
                value={transaction.time?.slice(0, 5) || ""}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Advanced — progressive disclosure */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((s) => !s)}
              className="w-full flex items-center justify-between py-2 text-label-l text-foreground"
            >
              <span>More options</span>
              <motion.span
                animate={{ rotate: showAdvanced ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.span>
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
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-body-m text-foreground">Spread over months</p>
                        {transaction.prorate_months && transaction.prorate_months > 1 && (
                          <p className="text-label-s text-muted-foreground font-mono">
                            {formatCurrency(transaction.amount / transaction.prorate_months)}/mo
                          </p>
                        )}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        placeholder="1"
                        className="h-9 w-16 text-center text-body-m font-mono bg-surface-container border-0 rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                        value={transaction.prorate_months ?? ""}
                        onChange={(e) => handleProrateChange(e.target.value)}
                        onBlur={handleProrateBlur}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-body-m text-foreground">Exclude from budget</p>
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
                        className="w-full flex items-center gap-2 py-2 text-label-l text-destructive active:opacity-70 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete transaction
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 px-5 pb-5 pt-2 shrink-0">
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="flex-1 h-11 rounded-full text-label-l text-primary disabled:opacity-50 active:scale-[0.98] transition-transform"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(transaction)}
            disabled={saving || deleting}
            className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-label-l disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-3xl border-0 bg-surface-container-high shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-title-l text-foreground">
              Delete this transaction?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-body-m text-muted-foreground">
              {transaction.merchant ? (
                <>
                  Your record from{" "}
                  <span className="text-foreground">{transaction.merchant}</span>{" "}
                  will be removed. This can't be undone.
                </>
              ) : (
                "This record will be removed. This can't be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 mt-4">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-full h-11 px-6 text-label-l text-primary border-0 bg-transparent"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) onDelete(transaction);
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              className="rounded-full h-11 px-6 bg-destructive text-primary-foreground text-label-l border-0"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
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
