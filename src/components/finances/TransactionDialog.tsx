import type { Transaction } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { VALUE_RATING_LABELS } from "./constants";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { Loader2, Trash2, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
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

/** Field caption. Quiet and sentence case, so the one accent label at the top
 *  of the dialog stays the only thing pulling the eye. */
const CAPTION = "text-[12px] text-[var(--ui-ink-softer)]";

/** An inset well for a single-line input. */
const WELL =
  "ui-inset h-11 w-full px-3 text-[15px] text-[var(--ui-ink)] outline-none transition-shadow placeholder:text-[var(--ui-ink-softer)] focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)] disabled:opacity-50";

const RATING_STEPS = [1, 2, 3, 4, 5];

/** The editor for value_rating, drawn as the same five ticks TransactionCard
 *  reads back. Each tick is its own 44px tap target. */
function RatingStrip({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label="Worth it" className="grid grid-cols-5 gap-1.5">
      {RATING_STEPS.map((step) => (
        <button
          key={step}
          type="button"
          aria-pressed={value === step}
          aria-label={VALUE_RATING_LABELS[step]}
          onClick={() => onChange(step)}
          disabled={disabled}
          className="group flex h-11 items-center justify-center rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)] disabled:opacity-50"
        >
          <span
            className={`h-[7px] w-full rounded-full transition-colors ${
              step <= value ? "bg-[var(--ui-accent)]" : "bg-[var(--ui-edge)]"
            }`}
          />
        </button>
      ))}
    </div>
  );
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
  const [trackedId, setTrackedId] = useState<string | undefined>(transaction?.id);

  if (transaction && transaction.id !== trackedId) {
    setTrackedId(transaction.id);
    setAmountInput(transaction.amount === 0 ? "" : transaction.amount.toString());
    setShowAdvanced(
      Boolean(transaction.prorate_months) || Boolean(transaction.excluded_from_budget),
    );
  }

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

  const valueRating = transaction.value_rating ?? 3;

  return (
    <Dialog open={!!transaction} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="ui-type flex max-h-[90vh] w-[calc(100%-1.5rem)] max-w-md flex-col sm:max-w-md gap-0 overflow-hidden rounded-[18px] border-[var(--ui-edge)] bg-[var(--ui-panel)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-5 pt-5 pb-0">
          <DialogTitle className="text-[13px] font-medium text-[var(--ui-accent)]">
            {isNew ? "New expense" : "Edit expense"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 pt-4 pb-4">
          <div className="ui-inset px-4 py-5">
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="ui-num text-[26px] leading-none text-[var(--ui-ink-softer)]">₹</span>
              <input
                id="amount"
                type="text"
                inputMode="text"
                placeholder="0"
                className="ui-num w-auto max-w-[65%] flex-none bg-transparent text-center text-[40px] leading-none tracking-[-0.02em] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)]"
                size={amountInput.length || 1}
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                onBlur={handleAmountBlur}
                onKeyDown={handleAmountKeyDown}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                disabled={saving}
              />
            </div>
            {isExpression && (
              <p
                className={`ui-num mt-2 text-center text-[12px] ${
                  evaluatedAmount !== null ? "text-[var(--ui-ink-soft)]" : "text-[var(--ui-danger)]"
                }`}
              >
                {evaluatedAmount !== null ? `= ${evaluatedAmount}` : "That does not add up"}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="merchant" className={CAPTION}>
              Where did it go?
            </label>
            <input
              id="merchant"
              placeholder="Amazon, Swiggy, Uber…"
              className={`${WELL} mt-1.5`}
              value={transaction.merchant || ""}
              onChange={(e) => onChange({ ...transaction, merchant: e.target.value })}
              disabled={saving}
            />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span className={CAPTION}>Worth it?</span>
              <span className="text-[12px] text-[var(--ui-ink)]">
                {VALUE_RATING_LABELS[valueRating]}
              </span>
            </div>
            <div className="mt-0.5">
              <RatingStrip
                value={valueRating}
                onChange={(rating) => onChange({ ...transaction, value_rating: rating })}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="txn-date" className={CAPTION}>
                Date
              </label>
              <input
                id="txn-date"
                type="date"
                className={`${WELL} ui-num mt-1.5 text-[14px]`}
                value={transaction.date}
                onChange={(e) => onChange({ ...transaction, date: e.target.value })}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="txn-time" className={CAPTION}>
                Time
              </label>
              <input
                id="txn-time"
                type="time"
                className={`${WELL} ui-num mt-1.5 text-[14px]`}
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
              aria-expanded={showAdvanced}
              className="flex h-11 w-full items-center justify-between rounded-[8px] text-[var(--ui-ink-soft)] transition-colors hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)]"
            >
              <span className="text-[13px]">More options</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                strokeWidth={1.75}
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
                  <div className="pt-1">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--ui-rule)] py-3">
                      <div className="min-w-0 flex-1">
                        <label htmlFor="prorate" className="text-[13px] text-[var(--ui-ink)]">
                          Spread over months
                        </label>
                        {transaction.prorate_months && transaction.prorate_months > 1 && (
                          <p className="ui-num text-[11px] text-[var(--ui-ink-softer)]">
                            {formatCurrency(transaction.amount / transaction.prorate_months)}/mo
                          </p>
                        )}
                      </div>
                      <input
                        id="prorate"
                        type="number"
                        min="1"
                        max="60"
                        placeholder="1"
                        className="ui-inset ui-num h-9 w-16 text-center text-[14px] text-[var(--ui-ink)] outline-none transition-shadow placeholder:text-[var(--ui-ink-softer)] focus:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]"
                        value={transaction.prorate_months ?? ""}
                        onChange={(e) => handleProrateChange(e.target.value)}
                        onBlur={handleProrateBlur}
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 py-3">
                      <p className="text-[13px] text-[var(--ui-ink)]">Exclude from budget</p>
                      <Switch
                        checked={transaction.excluded_from_budget}
                        onCheckedChange={(checked) =>
                          onChange({ ...transaction, excluded_from_budget: checked })
                        }
                        disabled={saving}
                        className="border-[var(--ui-edge)] data-[state=checked]:bg-[var(--ui-accent)] data-[state=unchecked]:bg-[var(--ui-inset)]"
                      />
                    </div>

                    {!isNew && onDelete && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={saving || deleting}
                        className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] text-[13px] text-[var(--ui-ink-soft)] transition-colors hover:bg-[var(--ui-inset)] hover:text-[var(--ui-danger)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-danger)] disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        Delete this expense
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-[var(--ui-edge)] px-5 pt-3 pb-5">
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="h-11 flex-1 rounded-[10px] border border-[var(--ui-edge)] text-[14px] text-[var(--ui-ink-soft)] transition-colors hover:bg-[var(--ui-inset)] hover:text-[var(--ui-ink)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(transaction)}
            disabled={saving || deleting}
            className="ui-cta flex h-11 flex-[1.4] items-center justify-center gap-2 rounded-[10px] text-[14px] font-medium transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)] active:opacity-90 disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving
              </>
            ) : isNew ? (
              "Add expense"
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="ui-type max-w-sm gap-0 sm:max-w-sm rounded-[18px] border-[var(--ui-edge)] bg-[var(--ui-panel)] p-5">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[19px] font-semibold tracking-[-0.01em] text-[var(--ui-ink)]">
              Delete this expense?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-1 text-[13px] text-[var(--ui-ink-soft)]">
              {transaction.merchant ? (
                <>
                  Your record from{" "}
                  <span className="text-[var(--ui-ink)]">{transaction.merchant}</span> will be
                  removed permanently.
                </>
              ) : (
                "This record will be removed permanently."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="h-11 rounded-[10px] border-[var(--ui-edge)] bg-transparent px-5 text-[14px] text-[var(--ui-ink-soft)] transition-colors hover:bg-[var(--ui-inset)] hover:text-[var(--ui-ink)]"
            >
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) onDelete(transaction);
                setShowDeleteConfirm(false);
              }}
              disabled={deleting}
              className="h-11 rounded-[10px] border-0 bg-[var(--ui-danger)] px-5 text-[14px] font-medium text-[var(--ui-danger-ink)] hover:bg-[var(--ui-danger)] hover:opacity-90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
