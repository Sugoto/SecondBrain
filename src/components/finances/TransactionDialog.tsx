import type { Transaction } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  EXPENSE_CATEGORIES,
  EXCLUDED_CATEGORIES,
  formatCurrency,
  getTransactionBudgetType,
  CATEGORY_BUDGET_TYPE,
  CATEGORY_PASTEL_COLORS,
} from "./constants";
import {
  Loader2,
  Trash2,
} from "lucide-react";
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

    const precedence: Record<string, number> = {
      "+": 1,
      "-": 1,
      "*": 2,
      "/": 2,
    };
    const output: number[] = [];
    const ops: string[] = [];

    const applyOp = () => {
      const op = ops.pop()!;
      const b = output.pop()!;
      const a = output.pop()!;
      switch (op) {
        case "+":
          output.push(a + b);
          break;
        case "-":
          output.push(a - b);
          break;
        case "*":
          output.push(a * b);
          break;
        case "/":
          output.push(a / b);
          break;
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
        while (
          ops.length &&
          precedence[ops[ops.length - 1]] >= precedence[token]
        ) {
          applyOp();
        }
        ops.push(token);
      }
    }

    while (ops.length) applyOp();

    const result = output[0];
    return isNaN(result) || !isFinite(result)
      ? null
      : Math.round(result * 100) / 100;
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
  const [amountInput, setAmountInput] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (transaction) {
      setAmountInput(
        transaction.amount === 0 ? "" : transaction.amount.toString()
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
    onChange({
      ...transaction,
      time: value ? value + ":00" : null,
    });
  };

  return (
    <Dialog
      open={!!transaction}
      onOpenChange={(open) => !open && !saving && onClose()}
    >
      <DialogContent
        className="max-w-md w-[calc(100%-2rem)] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-border bg-background shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className={`shrink-0 px-5 pt-5 pb-4 border-b border-border bg-muted`}>
          <DialogTitle className="text-lg font-bold text-foreground">
            {transaction.category ||
              (isNew ? "New Expense" : "Edit Transaction")}
          </DialogTitle>
          {transaction.merchant && (
            <p className="text-sm text-muted-foreground font-medium">
              {transaction.merchant}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 px-5 py-4 overflow-y-auto flex-1">
          {/* Category Selection */}
          {(() => {
            const renderCategoryButton = (cat: typeof EXPENSE_CATEGORIES[0]) => {
              const IconComp = cat.icon;
              const isSelected = transaction.category === cat.name;
              const isExcludedCategory = EXCLUDED_CATEGORIES.includes(cat.name);
              const categoryPastelColor = CATEGORY_PASTEL_COLORS[cat.name] || "bg-pastel-blue";

              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    if (saving) return;
                    const newCategory = isSelected ? null : cat.name;
                    const currentIsExcluded = EXCLUDED_CATEGORIES.includes(
                      transaction.category ?? ""
                    );
                    let newExcludedFromBudget =
                      transaction.excluded_from_budget;
                    if (isExcludedCategory && !isSelected) {
                      newExcludedFromBudget = true;
                    } else if (
                      currentIsExcluded &&
                      (isSelected || !isExcludedCategory)
                    ) {
                      newExcludedFromBudget = false;
                    }
                    onChange({
                      ...transaction,
                      category: newCategory,
                      excluded_from_budget: newExcludedFromBudget,
                      budget_type: null,
                    });
                  }}
                  disabled={saving}
                  className={`h-10 rounded-lg flex items-center justify-center border transition-all duration-100 ${saving ? "pointer-events-none opacity-50" : "active:scale-95"
                    } ${isSelected
                      ? `${categoryPastelColor} border-foreground`
                      : "bg-card border-border hover:bg-muted"
                    }`}
                >
                  <IconComp
                    className={`h-4 w-4 ${isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                  />
                </button>
              );
            };

            const effectiveBudgetType = getTransactionBudgetType(
              transaction.category,
              transaction.budget_type
            );
            const isWant = effectiveBudgetType === "want";
            const autoBudgetType = CATEGORY_BUDGET_TYPE[transaction.category ?? ""] ?? "want";

            const topRowCategories = EXPENSE_CATEGORIES.slice(0, 5);
            const bottomRowCategories = EXPENSE_CATEGORIES.slice(5);

            return (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <div className="grid grid-cols-5 gap-1.5">
                    {topRowCategories.map(renderCategoryButton)}
                  </div>
                  <div className="flex justify-center gap-1.5">
                    {bottomRowCategories.map((cat) => {
                      const IconComp = cat.icon;
                      const isSelected = transaction.category === cat.name;
                      const isExcludedCategory = EXCLUDED_CATEGORIES.includes(cat.name);
                      const categoryPastelColor = CATEGORY_PASTEL_COLORS[cat.name] || "bg-pastel-blue";

                      return (
                        <button
                          key={cat.name}
                          onClick={() => {
                            if (saving) return;
                            const newCategory = isSelected ? null : cat.name;
                            const currentIsExcluded = EXCLUDED_CATEGORIES.includes(
                              transaction.category ?? ""
                            );
                            let newExcludedFromBudget =
                              transaction.excluded_from_budget;
                            if (isExcludedCategory && !isSelected) {
                              newExcludedFromBudget = true;
                            } else if (
                              currentIsExcluded &&
                              (isSelected || !isExcludedCategory)
                            ) {
                              newExcludedFromBudget = false;
                            }
                            onChange({
                              ...transaction,
                              category: newCategory,
                              excluded_from_budget: newExcludedFromBudget,
                              budget_type: null,
                            });
                          }}
                          disabled={saving}
                          className={`h-10 w-16 rounded-lg flex items-center justify-center border transition-all duration-100 ${saving ? "pointer-events-none opacity-50" : "active:scale-95"
                            } ${isSelected
                              ? `${categoryPastelColor} border-foreground`
                              : "bg-card border-border hover:bg-muted"
                            }`}
                        >
                          <IconComp
                            className={`h-4 w-4 ${isSelected ? "text-foreground" : "text-muted-foreground"
                              }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Need/Want toggle */}
                <AnimatePresence>
                  {transaction.category && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-center gap-3 py-1">
                        <span
                          className={`text-xs font-medium transition-opacity ${!isWant ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          Need
                        </span>
                        <Switch
                          checked={isWant}
                          onCheckedChange={(checked) => {
                            const newType = checked ? "want" : "need";
                            const newBudgetType = newType === autoBudgetType ? null : newType;
                            onChange({ ...transaction, budget_type: newBudgetType });
                          }}
                          disabled={saving}
                          className="scale-90"
                        />
                        <span
                          className={`text-xs font-medium transition-opacity ${isWant ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          Want
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

          {/* Amount with Calculator */}
          <div className="space-y-2">
            <Label
              htmlFor="amount"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5"
            >
              How much did you spend?
            </Label>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                inputMode="text"
                placeholder="e.g. 100 or 100+50"
                className="h-12 text-xl font-semibold font-mono pr-20 placeholder:font-normal placeholder:text-sm placeholder:text-muted-foreground/50"
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={handleAmountKeyDown}
                onFocus={(e) => {
                  if (!amountInput) {
                    setAmountInput(
                      transaction.amount === 0
                        ? ""
                        : transaction.amount.toString()
                    );
                  }
                  setTimeout(() => e.target.select(), 0);
                }}
                disabled={saving}
              />
              {isExpression && (
                <div
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-mono font-semibold ${evaluatedAmount !== null ? "text-foreground" : "text-destructive"
                    }`}
                >
                  {evaluatedAmount !== null ? `= ₹${evaluatedAmount}` : "?"}
                </div>
              )}
            </div>
            {isExpression && (
              <p className="text-[10px] text-muted-foreground">
                Press Enter or tap outside to calculate
              </p>
            )}
          </div>

          {/* Merchant */}
          <div className="space-y-2">
            <Label
              htmlFor="merchant"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Where did you spend?
            </Label>
            <Input
              id="merchant"
              autoFocus={false}
              placeholder="e.g. Amazon, Swiggy, Uber"
              className="h-10"
              value={transaction.merchant || ""}
              onChange={(e) =>
                onChange({ ...transaction, merchant: e.target.value })
              }
              disabled={saving}
            />
          </div>

          {/* Date & Time row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                className="h-9 text-sm"
                value={transaction.date}
                onChange={(e) =>
                  onChange({ ...transaction, date: e.target.value })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground uppercase">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                className="h-9 text-sm"
                value={transaction.time?.slice(0, 5) || ""}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Prorate row */}
          <div className="flex items-center justify-between">
            <Label htmlFor="prorate" className="text-[10px] text-muted-foreground uppercase">
              Spread over months
            </Label>
            <div className="flex items-center gap-2">
              {transaction.prorate_months &&
                transaction.prorate_months > 1 && (
                  <span className="text-xs font-mono font-semibold text-foreground">
                    {formatCurrency(
                      transaction.amount / transaction.prorate_months
                    )}
                    /mo
                  </span>
                )}
              <Input
                id="prorate"
                type="number"
                min="1"
                max="60"
                placeholder="1"
                className="h-8 text-sm w-14 text-center"
                value={transaction.prorate_months ?? ""}
                onChange={(e) => handleProrateChange(e.target.value)}
                onBlur={handleProrateBlur}
                disabled={saving}
              />
            </div>
          </div>

          {/* Exclude row */}
          <div className="flex items-center justify-between">
            <Label
              htmlFor="excluded"
              className="text-[10px] text-muted-foreground uppercase cursor-pointer"
            >
              Exclude from budget
            </Label>
            <Switch
              id="excluded"
              checked={transaction.excluded_from_budget}
              onCheckedChange={(checked) =>
                onChange({
                  ...transaction,
                  excluded_from_budget: checked,
                })
              }
              disabled={saving}
              className="scale-75"
            />
          </div>

          {/* Delete button */}
          {!isNew && onDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving || deleting}
              className="w-full h-10 rounded-lg flex items-center justify-center gap-2 text-xs font-bold border border-border text-muted-foreground transition-all hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Transaction
            </button>
          )}
        </div>

        {/* Fixed footer buttons */}
        <div className="flex gap-3 p-5 shrink-0 border-t border-border bg-muted">
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="flex-1 h-12 rounded-xl bg-card border border-border text-foreground font-bold text-sm transition-colors hover:bg-muted disabled:opacity-50 flex items-center justify-center"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(transaction)}
            disabled={saving || deleting}
            className="flex-1 h-12 rounded-xl bg-foreground text-background font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-2xl border border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-lg font-bold">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete this transaction
              {transaction.merchant && (
                <span className="font-bold">
                  {" "}
                  from {transaction.merchant}
                </span>
              )}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel 
              disabled={deleting}
              className="rounded-xl border border-border font-bold hover:bg-muted"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(transaction);
                }
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              className="rounded-xl border border-red-600 bg-red-500 text-white font-bold hover:bg-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
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
