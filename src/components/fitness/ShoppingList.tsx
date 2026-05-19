import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Check,
  Loader2,
  Pencil,
  ArrowUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShoppingList } from "@/hooks/useShoppingList";
import type { ShoppingItem } from "@/lib/supabase";

const EYEBROW = "text-[10px] uppercase tracking-[0.22em] text-muted-foreground";

interface ItemFormProps {
  open: boolean;
  title: string;
  initialValues?: {
    name: string;
    calories: number;
    protein: number;
    cost: number;
    weight_grams: number;
    serving_grams: number;
  };
  onSubmit: (values: {
    name: string;
    calories: number;
    protein: number;
    cost: number;
    weight_grams: number;
    serving_grams: number;
  }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/60">
      <label className="text-[13px] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function MonoInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="font-mono tabular-nums text-right text-[14px] text-foreground bg-transparent outline-none w-32 placeholder:text-muted-foreground/40"
    />
  );
}

function ItemForm({
  open,
  title,
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
  submitLabel,
}: ItemFormProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [cost, setCost] = useState("");
  const [weightGrams, setWeightGrams] = useState("100");
  const [servingGrams, setServingGrams] = useState("100");

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name ?? "");
    setCalories(initialValues?.calories?.toString() ?? "");
    setProtein(initialValues?.protein?.toString() ?? "");
    setCost(initialValues?.cost?.toString() ?? "");
    setWeightGrams(initialValues?.weight_grams?.toString() ?? "100");
    setServingGrams(initialValues?.serving_grams?.toString() ?? "100");
  }, [open, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      cost: parseFloat(cost) || 0,
      weight_grams: parseFloat(weightGrams) || 100,
      serving_grams: parseFloat(servingGrams) || 100,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onCancel()}>
      <DialogContent
        className="max-w-md w-[calc(100%-1.5rem)] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-outline-variant bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <p className={EYEBROW}>{title}</p>
          <DialogTitle className="sr-only">{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 pt-4 pb-4 overflow-y-auto flex-1">
            <div className="mb-4">
              <p className={`${EYEBROW} mb-2`}>Name</p>
              <input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 text-[15px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/40"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <FieldRow label="Calories / 100g">
              <MonoInput
                type="number"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                disabled={isSubmitting}
              />
            </FieldRow>
            <FieldRow label="Protein / 100g">
              <MonoInput
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                disabled={isSubmitting}
              />
            </FieldRow>
            <FieldRow label="Pack weight (g)">
              <MonoInput
                type="number"
                placeholder="100"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                disabled={isSubmitting}
              />
            </FieldRow>
            <FieldRow label="Daily serving (g)">
              <MonoInput
                type="number"
                placeholder="100"
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
                disabled={isSubmitting}
              />
            </FieldRow>
            <FieldRow label="Cost (₹)">
              <MonoInput
                type="number"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                disabled={isSubmitting}
              />
            </FieldRow>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-10 mt-4 text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                Delete item
              </button>
            )}
          </div>

          <div className="flex gap-2 px-6 pb-6 pt-3 shrink-0 border-t border-outline-variant">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-lg border border-outline-variant text-[11px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-[11px] uppercase tracking-[0.2em] transition-opacity active:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DisplayMode = "raw" | "per100g" | "perServe";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
  displayMode: DisplayMode;
}

function calcPer100g(value: number, weightGrams: number): number {
  if (weightGrams <= 0) return 0;
  return (value / weightGrams) * 100;
}

function ShoppingItemRow({
  item,
  onToggle,
  onEdit,
  displayMode,
}: ShoppingItemRowProps) {
  const weight = item.weight_grams || 100;
  const serving = item.serving_grams || 100;
  const costPer100g = calcPer100g(item.cost, weight);

  const caloriesRaw = (item.calories / 100) * weight;
  const proteinRaw = (item.protein / 100) * weight;
  const caloriesPerServe = (item.calories / 100) * serving;
  const proteinPerServe = (item.protein / 100) * serving;
  const costPerServe = (costPer100g / 100) * serving;

  const displayCalories =
    displayMode === "per100g"
      ? item.calories
      : displayMode === "perServe"
        ? Math.round(caloriesPerServe)
        : Math.round(caloriesRaw);
  const displayProtein =
    displayMode === "per100g"
      ? Math.round(item.protein)
      : displayMode === "perServe"
        ? Math.round(proteinPerServe)
        : Math.round(proteinRaw);
  const displayCost =
    displayMode === "per100g"
      ? Math.round(costPer100g)
      : displayMode === "perServe"
        ? Math.round(costPerServe)
        : item.cost;

  const costPerProtein = item.protein > 0 ? costPer100g / item.protein : 0;
  const caloriesPerProtein = item.protein > 0 ? item.calories / item.protein : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
      className={`flex items-center gap-3 py-2.5 border-b border-outline-variant/60 ${
        item.checked ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        aria-label={item.checked ? "Uncheck" : "Check"}
        className={`w-4 h-4 rounded-sm flex items-center justify-center transition-colors shrink-0 border ${
          item.checked
            ? "bg-foreground border-foreground"
            : "border-outline-variant"
        }`}
      >
        {item.checked && <Check className="h-2.5 w-2.5 text-background" strokeWidth={2.5} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-foreground truncate">{item.name}</p>
        <div className="flex items-center gap-3 mt-0.5 font-mono tabular-nums text-[10px] text-muted-foreground/80">
          <span title={`${item.calories} kcal for ${weight}g`}>
            {displayCalories}
            <span className="text-muted-foreground/60"> kcal</span>
          </span>
          <span title={`${item.protein}g for ${weight}g`}>
            {displayProtein}
            <span className="text-muted-foreground/60">g</span>
          </span>
          <span title={`₹${item.cost} for ${weight}g`}>
            ₹{displayCost}
          </span>
          <span title={`${costPerProtein.toFixed(2)} per g protein`}>
            ₹/g {costPerProtein.toFixed(2)}
          </span>
          <span title={`${caloriesPerProtein.toFixed(1)} cal per g protein`}>
            c/p {caloriesPerProtein.toFixed(1)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onEdit(item)}
        aria-label="Edit item"
        className="text-muted-foreground/60 hover:text-foreground transition-colors active:scale-95"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

type SortOption =
  | "none"
  | "protein_asc"
  | "protein_desc"
  | "cost_asc"
  | "cost_desc"
  | "calories_asc"
  | "calories_desc"
  | "costPerProtein_asc"
  | "costPerProtein_desc"
  | "caloriesPerProtein_asc"
  | "caloriesPerProtein_desc";

export function ShoppingList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("costPerProtein_asc");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("per100g");

  const toggleSort = (
    metric: "calories" | "protein" | "cost" | "costPerProtein" | "caloriesPerProtein",
  ) => {
    const ascKey = `${metric}_asc` as SortOption;
    const descKey = `${metric}_desc` as SortOption;
    if (sortBy === ascKey) setSortBy(descKey);
    else if (sortBy === descKey) setSortBy("none");
    else setSortBy(ascKey);
  };

  const getSortIndicator = (
    metric: "calories" | "protein" | "cost" | "costPerProtein" | "caloriesPerProtein",
  ) => {
    if (sortBy === `${metric}_desc`) return "↓";
    if (sortBy === `${metric}_asc`) return "↑";
    return null;
  };

  const {
    items,
    addItem,
    toggleChecked,
    updateItem,
    deleteItem,
    isAdding,
    isUpdating,
  } = useShoppingList();

  const baseTotals = items
    .filter((item) => item.checked)
    .reduce(
      (acc, item) => {
        const weight = item.weight_grams || 100;
        const serving = item.serving_grams || 100;
        const costPer100g = calcPer100g(item.cost, weight);
        let caloriesValue, proteinValue, costValue;
        if (displayMode === "per100g") {
          caloriesValue = item.calories;
          proteinValue = item.protein;
          costValue = costPer100g;
        } else if (displayMode === "perServe") {
          caloriesValue = (item.calories / 100) * serving;
          proteinValue = (item.protein / 100) * serving;
          costValue = (costPer100g / 100) * serving;
        } else {
          caloriesValue = (item.calories / 100) * weight;
          proteinValue = (item.protein / 100) * weight;
          costValue = item.cost;
        }
        return {
          calories: acc.calories + caloriesValue,
          protein: acc.protein + proteinValue,
          cost: acc.cost + costValue,
        };
      },
      { calories: 0, protein: 0, cost: 0 },
    );

  const costPer100gTotal = items
    .filter((item) => item.checked)
    .reduce((acc, item) => {
      const weight = item.weight_grams || 100;
      return acc + calcPer100g(item.cost, weight);
    }, 0);
  const proteinTotal = items
    .filter((item) => item.checked)
    .reduce((acc, item) => acc + item.protein, 0);
  const avgCostPerProtein = proteinTotal > 0 ? costPer100gTotal / proteinTotal : 0;

  const caloriesTotal = items
    .filter((item) => item.checked)
    .reduce((acc, item) => acc + item.calories, 0);
  const avgCaloriesPerProtein = proteinTotal > 0 ? caloriesTotal / proteinTotal : 0;

  const displayTotals = {
    ...baseTotals,
    costPerProtein: avgCostPerProtein,
    caloriesPerProtein: avgCaloriesPerProtein,
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "none") return 0;
    const weightA = a.weight_grams || 100;
    const weightB = b.weight_grams || 100;
    const costPer100gA = calcPer100g(a.cost, weightA);
    const costPer100gB = calcPer100g(b.cost, weightB);
    const costPerProteinA = a.protein > 0 ? costPer100gA / a.protein : Infinity;
    const costPerProteinB = b.protein > 0 ? costPer100gB / b.protein : Infinity;
    const caloriesPerProteinA = a.protein > 0 ? a.calories / a.protein : Infinity;
    const caloriesPerProteinB = b.protein > 0 ? b.calories / b.protein : Infinity;

    switch (sortBy) {
      case "protein_asc": return a.protein - b.protein;
      case "protein_desc": return b.protein - a.protein;
      case "cost_asc": return costPer100gA - costPer100gB;
      case "cost_desc": return costPer100gB - costPer100gA;
      case "calories_asc": return a.calories - b.calories;
      case "calories_desc": return b.calories - a.calories;
      case "costPerProtein_asc": return costPerProteinA - costPerProteinB;
      case "costPerProtein_desc": return costPerProteinB - costPerProteinA;
      case "caloriesPerProtein_asc": return caloriesPerProteinA - caloriesPerProteinB;
      case "caloriesPerProtein_desc": return caloriesPerProteinB - caloriesPerProteinA;
      default: return 0;
    }
  });

  const handleAddItem = async (values: {
    name: string;
    calories: number;
    protein: number;
    cost: number;
    weight_grams: number;
    serving_grams: number;
  }) => {
    await addItem({ ...values, checked: false });
    setShowAddForm(false);
  };

  const handleEditItem = async (values: {
    name: string;
    calories: number;
    protein: number;
    cost: number;
    weight_grams: number;
    serving_grams: number;
  }) => {
    if (!editingItem) return;
    await updateItem(editingItem.id, values);
    setEditingItem(null);
  };

  const sortCells = [
    { key: "calories" as const, label: "kcal", value: Math.round(displayTotals.calories).toLocaleString() },
    { key: "protein" as const, label: "Protein", value: `${Math.round(displayTotals.protein)}g` },
    { key: "cost" as const, label: "Cost", value: `₹${Math.round(displayTotals.cost).toLocaleString()}` },
    { key: "costPerProtein" as const, label: "₹/g", value: `₹${displayTotals.costPerProtein.toFixed(2)}` },
    { key: "caloriesPerProtein" as const, label: "Cal/g", value: displayTotals.caloriesPerProtein.toFixed(1) },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <span className={EYEBROW}>Shopping list</span>

        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 border-y border-outline-variant divide-x divide-outline-variant w-[150px]">
            {(["raw", "per100g", "perServe"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={`h-7 text-[9px] uppercase tracking-[0.16em] transition-colors ${
                  displayMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "raw" ? "Raw" : mode === "per100g" ? "/100g" : "/Day"}
              </button>
            ))}
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              aria-label="Add item"
              className="text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <Plus className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-5 divide-x divide-outline-variant/60 border-y border-outline-variant/60">
        {sortCells.map((cell) => {
          const isSorted =
            sortBy.startsWith(cell.key) && sortBy !== "none";
          return (
            <button
              key={cell.key}
              onClick={() => toggleSort(cell.key)}
              className={`flex flex-col items-start gap-1 px-2 py-2 transition-opacity ${
                isSorted ? "" : ""
              }`}
            >
              <p className="font-mono tabular-nums text-[12px] text-foreground leading-none">
                {cell.value}
              </p>
              <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-0.5">
                {cell.label}
                {getSortIndicator(cell.key) ? (
                  <span className="text-foreground">
                    {getSortIndicator(cell.key)}
                  </span>
                ) : (
                  <ArrowUpDown className="h-2 w-2 opacity-40" />
                )}
              </p>
            </button>
          );
        })}
      </div>

      <ItemForm
        open={showAddForm}
        title="Add item"
        onSubmit={handleAddItem}
        onCancel={() => setShowAddForm(false)}
        isSubmitting={isAdding}
        submitLabel="Add"
      />

      <ItemForm
        open={!!editingItem}
        title="Edit item"
        initialValues={
          editingItem
            ? {
                name: editingItem.name,
                calories: editingItem.calories,
                protein: editingItem.protein,
                cost: editingItem.cost,
                weight_grams: editingItem.weight_grams || 100,
                serving_grams: editingItem.serving_grams || 100,
              }
            : undefined
        }
        onSubmit={handleEditItem}
        onCancel={() => setEditingItem(null)}
        onDelete={
          editingItem
            ? () => {
                deleteItem(editingItem.id);
                setEditingItem(null);
              }
            : undefined
        }
        isSubmitting={isUpdating}
        submitLabel="Save"
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedItems.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={toggleChecked}
              onEdit={setEditingItem}
              displayMode={displayMode}
            />
          ))}
        </AnimatePresence>

        {items.length === 0 && !showAddForm && (
          <div className="text-center py-12">
            <ShoppingCart className="h-6 w-6 mx-auto mb-3 text-muted-foreground/60" strokeWidth={1.5} />
            <p className="text-[13px] text-foreground mb-1">No items yet</p>
            <p className="text-[11px] text-muted-foreground">Tap + to add grocery items</p>
          </div>
        )}
      </div>
    </div>
  );
}
