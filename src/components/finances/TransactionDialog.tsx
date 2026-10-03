import type { Transaction } from "@/lib/supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useFormatCurrency } from "@/hooks/usePrivacy";
import { hapticFeedback, hapticSelection } from "@/hooks/useHaptics";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface TransactionDialogProps {
  transaction: Transaction | null;
  isNew: boolean;
  saving?: boolean;
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

const ROW =
  "flex min-h-11 items-center justify-between gap-3 px-4 first:rounded-t-[10px] last:rounded-b-[10px] focus-within:shadow-[inset_0_0_0_1.5px_var(--ui-accent)]";

const ROW_LABEL = "shrink-0 text-[14px] text-[var(--ui-ink-soft)]";

const ROW_INPUT =
  "ui-num min-w-0 flex-1 bg-transparent text-right text-[14px] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)] disabled:opacity-50";

const EDITABLE_FIELDS = [
  "amount",
  "merchant",
  "date",
  "time",
  "bank_account",
  "card_number",
  "prorate_months",
  "excluded_from_budget",
] as const;

function hasChanges(a: Transaction, b: Transaction) {
  return EDITABLE_FIELDS.some((field) => (a[field] || null) !== (b[field] || null));
}

const QUICK_NAMES = [
  { name: "Groceries", hue: 150 },
  { name: "Snacks", hue: 70 },
  { name: "Travel", hue: 230 },
  { name: "Shopping", hue: 330 },
  { name: "Restaurant", hue: 30 },
];

export function TransactionDialog({
  transaction: openTransaction,
  isNew,
  saving = false,
  onClose,
  onSave,
  onChange,
  onDelete,
}: TransactionDialogProps) {
  const formatCurrency = useFormatCurrency();
  const [amountInput, setAmountInput] = useState<string>("");
  const [initial, setInitial] = useState(openTransaction);
  const [trackedId, setTrackedId] = useState<string | undefined>(openTransaction?.id);
  const [lastTransaction, setLastTransaction] = useState(openTransaction);
  if (openTransaction && openTransaction !== lastTransaction) setLastTransaction(openTransaction);
  const transaction = openTransaction ?? lastTransaction;

  if (transaction && transaction.id !== trackedId) {
    setTrackedId(transaction.id);
    setAmountInput(transaction.amount === 0 ? "" : transaction.amount.toString());
    setInitial(transaction);
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

  const amountEdited = amountInput !== (initial?.amount ? initial.amount.toString() : "");
  const canSave = isNew
    ? transaction.amount > 0 || (isExpression && evaluatedAmount !== null)
    : amountEdited || (initial ? hasChanges(initial, transaction) : false);

  return (
    <Dialog open={!!openTransaction} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent
        sheet
        showCloseButton={false}
        className="ui-type flex flex-col gap-0 overflow-hidden border-[var(--ui-edge)] bg-[var(--ui-panel)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{isNew ? "New expense" : "Edit expense"}</DialogTitle>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div data-sheet-drag className="touch-none pt-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-baseline gap-1">
                <span className="ui-num text-[20px] leading-none text-[var(--ui-ink-softer)]">
                  ₹
                </span>
                <input
                  id="amount"
                  type="text"
                  inputMode="text"
                  aria-label="Amount"
                  placeholder="0"
                  className="ui-num min-w-0 flex-1 bg-transparent text-[34px] leading-tight font-medium tracking-[-0.02em] text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)]"
                  value={amountInput}
                  onChange={(e) => handleAmountInputChange(e.target.value)}
                  onBlur={handleAmountBlur}
                  onKeyDown={handleAmountKeyDown}
                  onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                  disabled={saving}
                />
              </div>
              {!isNew && onDelete && (
                <button
                  type="button"
                  aria-label="Delete expense"
                  onClick={() => {
                    hapticFeedback("heavy");
                    onDelete(transaction);
                  }}
                  disabled={saving}
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ui-ink-softer)] transition-colors hover:bg-[var(--ui-inset)] hover:text-[var(--ui-danger)] focus-visible:outline-2 focus-visible:outline-[var(--ui-danger)] disabled:opacity-50"
                >
                  <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </button>
              )}
            </div>
            {isExpression && (
              <p
                className={`ui-num text-[12px] ${
                  evaluatedAmount !== null ? "text-[var(--ui-ink-soft)]" : "text-[var(--ui-danger)]"
                }`}
              >
                {evaluatedAmount !== null ? `= ${evaluatedAmount}` : "That does not add up"}
              </p>
            )}
            <input
              id="merchant"
              aria-label="Merchant"
              placeholder="Merchant"
              className="mt-0.5 w-full bg-transparent text-[17px] font-medium text-[var(--ui-ink)] outline-none placeholder:text-[var(--ui-ink-softer)] disabled:opacity-50"
              value={transaction.merchant || ""}
              onChange={(e) => onChange({ ...transaction, merchant: e.target.value })}
              disabled={saving}
            />
          </div>

          {isNew && (
            <div role="group" aria-label="Quick names" className="mt-2.5 flex flex-wrap gap-1">
              {QUICK_NAMES.map(({ name, hue }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={transaction.merchant === name}
                  onClick={() => {
                    hapticSelection();
                    onChange({ ...transaction, merchant: name });
                  }}
                  disabled={saving}
                  style={{ "--tag-h": hue } as React.CSSProperties}
                  className="ui-tag h-6 px-2.5 text-[11px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ui-accent)] disabled:opacity-50"
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div className="ui-inset mt-4 divide-y divide-[var(--ui-rule)]">
            <div className={ROW}>
              <label htmlFor="txn-date" className={ROW_LABEL}>
                Date
              </label>
              <div className="flex min-w-0 items-center justify-end gap-2">
                <input
                  id="txn-date"
                  type="date"
                  className={`${ROW_INPUT} flex-none`}
                  value={transaction.date}
                  onChange={(e) => onChange({ ...transaction, date: e.target.value })}
                  disabled={saving}
                />
                <input
                  id="txn-time"
                  type="time"
                  aria-label="Time"
                  className={`${ROW_INPUT} flex-none`}
                  value={transaction.time?.slice(0, 5) || ""}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className={ROW}>
              <label htmlFor="bank-account" className={ROW_LABEL}>
                Paid from
              </label>
              <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                <input
                  id="bank-account"
                  placeholder="Axis …286591"
                  className={ROW_INPUT}
                  value={transaction.bank_account || ""}
                  onChange={(e) =>
                    onChange({ ...transaction, bank_account: e.target.value || null })
                  }
                  disabled={saving}
                />
                <span aria-hidden className="text-[var(--ui-ink-softer)]">
                  ·
                </span>
                <input
                  id="card-number"
                  aria-label="Card"
                  placeholder="Card …6555"
                  className={`${ROW_INPUT} w-24 flex-none`}
                  value={transaction.card_number || ""}
                  onChange={(e) =>
                    onChange({ ...transaction, card_number: e.target.value || null })
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className={ROW}>
              <label htmlFor="prorate" className={ROW_LABEL}>
                Spread over
                {transaction.prorate_months && transaction.prorate_months > 1 && (
                  <span className="ui-num ml-2 text-[12px] text-[var(--ui-ink-softer)]">
                    {formatCurrency(transaction.amount / transaction.prorate_months)}/mo
                  </span>
                )}
              </label>
              <div className="flex items-baseline gap-1.5">
                <input
                  id="prorate"
                  type="number"
                  min="1"
                  max="60"
                  placeholder="1"
                  className={`${ROW_INPUT} w-10 flex-none`}
                  value={transaction.prorate_months ?? ""}
                  onChange={(e) => handleProrateChange(e.target.value)}
                  onBlur={handleProrateBlur}
                  disabled={saving}
                />
                <span className="text-[13px] text-[var(--ui-ink-softer)]">
                  {transaction.prorate_months && transaction.prorate_months > 1
                    ? "months"
                    : "month"}
                </span>
              </div>
            </div>

            <div className={ROW}>
              <label htmlFor="exclude-budget" className={ROW_LABEL}>
                Exclude from budget
              </label>
              <Switch
                id="exclude-budget"
                checked={transaction.excluded_from_budget}
                onCheckedChange={(checked) =>
                  onChange({ ...transaction, excluded_from_budget: checked })
                }
                disabled={saving}
                className="border-[var(--ui-edge)] data-[state=checked]:bg-[var(--ui-accent)] data-[state=unchecked]:bg-[var(--ui-panel)]"
              />
            </div>
          </div>
        </div>

        <div className="shrink-0 px-5 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <button
            onClick={() => {
              hapticFeedback("medium");
              onSave(transaction);
            }}
            disabled={saving || !canSave}
            className="ui-cta flex h-12 w-full items-center justify-center gap-2 rounded-[12px] text-[15px] font-medium transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ui-accent)] active:opacity-90 disabled:opacity-40"
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
    </Dialog>
  );
}
