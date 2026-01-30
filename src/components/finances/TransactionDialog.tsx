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
import { Button } from "@/components/ui/button";
import {
  EXPENSE_CATEGORIES,
  EXCLUDED_CATEGORIES,
  formatCurrency,
  getTransactionBudgetType,
  CATEGORY_BUDGET_TYPE,
} from "./constants";
import {
  CalendarRange,
  Loader2,
  ChevronDown,
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

// Safe math expression evaluator (no eval)
function evaluateExpression(expr: string): number | null {
  // Remove whitespace and validate characters
  const cleaned = expr.replace(/\s/g, "");
  if (!/^[\d+\-*/.()]+$/.test(cleaned)) return null;

  try {
    // Tokenize
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

    // Simple shunting-yard for +, -, *, /
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
        ops.pop(); // Remove "("
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
  const [showDatetime, setShowDatetime] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Reset state when transaction changes using useEffect (proper pattern)
  useEffect(() => {
    if (transaction) {
      setAmountInput(
        transaction.amount === 0 ? "" : transaction.amount.toString()
      );
      setShowDatetime(false);
      setShowAdvanced(false);
    }
  }, [transaction?.id]); // Only reset when transaction ID changes

  if (!transaction) return null;

  // Check if input contains a math expression
  const isExpression = /[+\-*/]/.test(amountInput);
  const evaluatedAmount = isExpression ? evaluateExpression(amountInput) : null;

  const handleAmountInputChange = (value: string) => {
    setAmountInput(value);
    // If it's just a number, update immediately
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
      // Keep amount as 0 if empty, don't show "0" in input
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
    // Clamp between 1 and 60
    const clamped = Math.min(60, Math.max(1, parsed));
    onChange({ ...transaction, prorate_months: clamped });
  };

  const handleProrateBlur = () => {
    // Normalize to null if 1 or less (no proration needed)
    if (transaction.prorate_months && transaction.prorate_months <= 1) {
      onChange({ ...transaction, prorate_months: null });
    }
  };

  const handleTimeChange = (value: string) => {
    // Handle empty value gracefully
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
        className="max-w-md w-[calc(100%-2rem)] rounded-xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-border bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <DialogHeader className="shrink-0 px-5 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold text-foreground">
            {transaction.category ||
              (isNew ? "New Expense" : "Edit Transaction")}
          </DialogTitle>
          {transaction.merchant && (
            <p className="text-xs text-muted-foreground">
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
                      // Reset budget_type to auto when category changes
                      budget_type: null,
                    });
                  }}
                  disabled={saving}
                  className={`h-9 rounded-md flex items-center justify-center border transition-all duration-100 ${saving ? "pointer-events-none opacity-50" : "active:scale-95"
                    } ${isSelected
                      ? "bg-foreground border-foreground"
                      : "bg-muted border-border hover:bg-accent"
                    }`}
                >
                  <IconComp
                    className={`h-4 w-4 ${isSelected ? "text-background" : "text-muted-foreground"
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

            return (
              <div className="space-y-2">
                {/* Category buttons grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {EXPENSE_CATEGORIES.map(renderCategoryButton)}
                </div>

                {/* Need/Want toggle - fades in when category selected */}
                <AnimatePresence>
                  {transaction.category && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-center gap-3 pt-1">
                        <span
                          className={`text-xs font-medium transition-opacity ${!isWant ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          Need
                        </span>
                        <Switch
                          checked={isWant}
                          onCheckedChange={(checked) => {
                            const newType = checked ? "want" : "need";
                            // If matches auto, clear override
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
              Amount
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
                  // If empty or "0", select all so user can type fresh
                  if (!amountInput) {
                    setAmountInput(
                      transaction.amount === 0
                        ? ""
                        : transaction.amount.toString()
                    );
                  }
                  // Select all text for easy replacement
                  setTimeout(() => e.target.select(), 0);
                }}
                disabled={saving}
              />
              {/* Show evaluated result for expressions */}
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
              Merchant
            </Label>
            <Input
              id="merchant"
              autoFocus={false}
              placeholder="Where did you spend?"
              className="h-10"
              value={transaction.merchant || ""}
              onChange={(e) =>
                onChange({ ...transaction, merchant: e.target.value })
              }
              disabled={saving}
            />
          </div>

          {/* Date, Time & Prorate - Collapsible */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDatetime(!showDatetime)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <CalendarRange className="h-3.5 w-3.5" />
                <span>
                  {new Date(transaction.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                  {transaction.time &&
                    (() => {
                      const [hours, minutes] = transaction.time
                        .split(":")
                        .map(Number);
                      const period = hours >= 12 ? "PM" : "AM";
                      const hour12 = hours % 12 || 12;
                      return ` • ${hour12}:${minutes
                        .toString()
                        .padStart(2, "0")} ${period}`;
                    })()}
                  {transaction.prorate_months &&
                    transaction.prorate_months > 1 &&
                    ` • ${transaction.prorate_months}mo`}
                </span>
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showDatetime ? "rotate-180" : ""
                  }`}
              />
            </button>
            <AnimatePresence>
              {showDatetime && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-3 pb-3">
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

                    {/* Prorate section */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                      <Label htmlFor="prorate" className="text-xs shrink-0">
                        Spread over
                      </Label>
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
                      <Label className="text-xs shrink-0">
                        {transaction.prorate_months &&
                          transaction.prorate_months > 1
                          ? "months"
                          : "month"}
                      </Label>
                      {transaction.prorate_months &&
                        transaction.prorate_months > 1 && (
                          <span className="text-xs ml-auto font-mono font-semibold text-foreground">
                            {formatCurrency(
                              transaction.amount / transaction.prorate_months
                            )}
                            /mo
                          </span>
                        )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced section - collapsible */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <span>Advanced</span>
                {!showAdvanced && (
                  <span className="text-[10px] opacity-60">
                    {[
                      transaction.details && "notes",
                      transaction.excluded_from_budget && "excluded",
                    ]
                      .filter(Boolean)
                      .join(", ") || ""}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""
                  }`}
              />
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-3 px-3 pb-3">
                    {/* Notes */}
                    <div className="space-y-1">
                      <textarea
                        id="details"
                        className="w-full min-h-[50px] px-2 py-2 mt-2 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                        value={transaction.details || ""}
                        onChange={(e) =>
                          onChange({
                            ...transaction,
                            details: e.target.value || null,
                          })
                        }
                        placeholder="Add notes or details..."
                        disabled={saving}
                      />
                    </div>

                    {/* Exclude from budget */}
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="excluded"
                        className="text-xs text-muted-foreground cursor-pointer"
                      >
                        Exclude from monthly budget
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

                    {/* Delete button - only show for existing transactions */}
                    {!isNew && onDelete && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || deleting}
                        className="w-full mt-4 h-10 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Transaction
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Fixed footer buttons */}
        <div className="flex gap-3 p-5 shrink-0 border-t border-border">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={onClose}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
            onClick={() => onSave(transaction)}
            disabled={saving || deleting}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Delete Transaction
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction
              {transaction.merchant && (
                <span className="font-medium">
                  {" "}
                  from {transaction.merchant}
                </span>
              )}
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(transaction);
                }
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
