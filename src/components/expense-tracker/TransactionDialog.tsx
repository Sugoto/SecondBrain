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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXPENSE_CATEGORIES, EXCLUDED_CATEGORIES, formatCurrency } from "./constants";
import { CalendarRange, Loader2 } from "lucide-react";

interface TransactionDialogProps {
  transaction: Transaction | null;
  isNew: boolean;
  saving?: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  onChange: (transaction: Transaction) => void;
}

export function TransactionDialog({
  transaction,
  isNew,
  saving = false,
  onClose,
  onSave,
  onChange,
}: TransactionDialogProps) {
  if (!transaction) return null;

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
    <Dialog open={!!transaction} onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isNew ? "Add Expense" : "Edit Transaction"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="merchant" className="text-sm">
              Merchant
            </Label>
            <Input
              id="merchant"
              className="h-11 text-base"
              value={transaction.merchant || ""}
              onChange={(e) =>
                onChange({ ...transaction, merchant: e.target.value })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              className="h-11 text-base"
              value={transaction.amount}
              onChange={(e) =>
                onChange({
                  ...transaction,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Category</Label>
            <div className="flex flex-wrap gap-1.5">
              {EXPENSE_CATEGORIES.map((cat) => {
                const IconComp = cat.icon;
                const isSelected = transaction.category === cat.name;
                const isExcludedCategory = EXCLUDED_CATEGORIES.includes(cat.name);
                return (
                  <Badge
                    key={cat.name}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all gap-1 ${
                      isSelected ? "" : "hover:bg-accent"
                    } ${saving ? "pointer-events-none opacity-50" : ""}`}
                    onClick={() => {
                      if (saving) return;
                      const newCategory = isSelected ? null : cat.name;
                      onChange({
                        ...transaction,
                        category: newCategory,
                        // Auto-enable excluded_from_budget for excluded categories
                        excluded_from_budget: isExcludedCategory && !isSelected
                          ? true
                          : transaction.excluded_from_budget,
                      });
                    }}
                  >
                    <IconComp className="h-3 w-3" />
                    {cat.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                className="h-11 text-base"
                value={transaction.date}
                onChange={(e) =>
                  onChange({ ...transaction, date: e.target.value })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                className="h-11 text-base"
                value={transaction.time?.slice(0, 5) || ""}
                onChange={(e) => handleTimeChange(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Prorate expense section */}
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" />
            <Label htmlFor="prorate" className="text-sm shrink-0">
              Spread over
            </Label>
            <Input
              id="prorate"
              type="number"
              min="1"
              max="60"
              placeholder="1"
              className="h-8 text-sm w-16 text-center"
              value={transaction.prorate_months ?? ""}
              onChange={(e) => handleProrateChange(e.target.value)}
              onBlur={handleProrateBlur}
              disabled={saving}
            />
            <Label className="text-sm shrink-0">
              {transaction.prorate_months && transaction.prorate_months > 1 ? "months" : "month"}
            </Label>
            {transaction.prorate_months && transaction.prorate_months > 1 && (
              <span className="text-xs text-muted-foreground ml-auto font-mono">
                {formatCurrency(transaction.amount / transaction.prorate_months)}/mo
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-sm">
              Details
            </Label>
            <textarea
              id="details"
              className="w-full min-h-[60px] px-3 py-2 text-base rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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

          <div className="flex items-center justify-between py-3 px-4 bg-muted rounded-lg">
            <div className="flex-1 mr-4">
              <Label htmlFor="excluded" className="font-medium text-sm">
                Exclude from Budget
              </Label>
            </div>
            <Switch
              id="excluded"
              checked={transaction.excluded_from_budget}
              onCheckedChange={(checked) =>
                onChange({ ...transaction, excluded_from_budget: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-11"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={() => onSave(transaction)}
              disabled={saving}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
