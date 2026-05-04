import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Flame,
  Beef,
  IndianRupee,
  Check,
  Loader2,
  Pencil,
  Scale,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShoppingList } from "@/hooks/useShoppingList";
import type { ShoppingItem } from "@/lib/supabase";

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

  const inputCls =
    "font-mono h-10 text-body-m bg-surface-container border-0 rounded-lg px-3 focus-visible:ring-1 focus-visible:ring-primary";
  const labelCls =
    "text-label-m text-muted-foreground flex items-center gap-1";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onCancel()}>
      <DialogContent
        className="max-w-md w-[calc(100%-1.5rem)] rounded-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-0 bg-surface-container-high shadow-xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-5 pt-5 pb-2">
          <DialogTitle className="text-title-l text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-5 py-3 overflow-y-auto flex-1 space-y-3">
            <div className="space-y-1.5">
              <label className="text-label-m text-muted-foreground">Name</label>
              <Input
                placeholder="Item name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-body-m bg-surface-container border-0 rounded-lg px-3 focus-visible:ring-1 focus-visible:ring-primary"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className={labelCls}>
                  <Flame className="h-3 w-3" /> Calories /100g
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className={inputCls}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Beef className="h-3 w-3" /> Protein /100g
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className={inputCls}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Scale className="h-3 w-3" /> Pack weight
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(e.target.value)}
                  className={inputCls}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>
                  <Scale className="h-3 w-3" /> Daily serving
                </label>
                <Input
                  type="number"
                  placeholder="100"
                  value={servingGrams}
                  onChange={(e) => setServingGrams(e.target.value)}
                  className={inputCls}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>
                <IndianRupee className="h-3 w-3" /> Cost
              </label>
              <Input
                type="number"
                placeholder="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className={inputCls}
                disabled={isSubmitting}
              />
            </div>

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="w-full flex items-center gap-2 py-2 text-label-l text-destructive active:opacity-70 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete item
              </button>
            )}
          </div>

          <div className="flex gap-2 px-5 pb-5 pt-2 shrink-0">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-full text-label-l text-primary disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 h-11 rounded-full bg-primary text-primary-foreground text-label-l disabled:opacity-50 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
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
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-2 p-2 rounded-xl border border-border bg-card transition-colors ${item.checked
        ? "opacity-50 bg-muted"
        : ""
        }`}
    >

      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors shrink-0 border ${item.checked
          ? "bg-foreground border-foreground"
          : "border-border bg-card"
          }`}
      >
        {item.checked && <Check className="h-2.5 w-2.5 text-background" />}
      </button>


      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate text-foreground">{item.name}</p>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-medium">
          <span
            className="flex items-center gap-0.5"
            title={`${item.calories} kcal for ${weight}g`}
          >
            <Flame className="h-2 w-2" />
            {displayCalories}
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`${item.protein}g for ${weight}g`}
          >
            <Beef className="h-2 w-2" />
            {displayProtein}g
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`₹${item.cost} for ${weight}g`}
          >
            <IndianRupee className="h-2 w-2" />₹{displayCost}
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`₹${costPerProtein.toFixed(2)} per gram of protein`}
          >
            <span className="font-bold">₹/g</span>
            {costPerProtein.toFixed(2)}
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`${caloriesPerProtein.toFixed(1)} calories per gram of protein`}
          >
            <span className="font-bold">cal/g</span>
            {caloriesPerProtein.toFixed(1)}
          </span>
        </div>
      </div>


      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-md border border-border bg-muted text-foreground transition-colors"
      >
        <Pencil className="h-2.5 w-2.5" />
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
    metric: "calories" | "protein" | "cost" | "costPerProtein" | "caloriesPerProtein"
  ) => {
    const ascKey = `${metric}_asc` as SortOption;
    const descKey = `${metric}_desc` as SortOption;

    if (sortBy === ascKey) {
      setSortBy(descKey);
    } else if (sortBy === descKey) {
      setSortBy("none");
    } else {
      setSortBy(ascKey);
    }
  };

  const getSortIndicator = (
    metric: "calories" | "protein" | "cost" | "costPerProtein" | "caloriesPerProtein"
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
      { calories: 0, protein: 0, cost: 0 }
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
  const avgCostPerProtein =
    proteinTotal > 0 ? costPer100gTotal / proteinTotal : 0;

  const caloriesTotal = items
    .filter((item) => item.checked)
    .reduce((acc, item) => acc + item.calories, 0);
  const avgCaloriesPerProtein =
    proteinTotal > 0 ? caloriesTotal / proteinTotal : 0;

  const displayTotals = { ...baseTotals, costPerProtein: avgCostPerProtein, caloriesPerProtein: avgCaloriesPerProtein };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "none") return 0;

    const weightA = a.weight_grams || 100;
    const weightB = b.weight_grams || 100;

    const proteinA = a.protein;
    const proteinB = b.protein;
    const caloriesA = a.calories;
    const caloriesB = b.calories;

    const costPer100gA = calcPer100g(a.cost, weightA);
    const costPer100gB = calcPer100g(b.cost, weightB);

    const costPerProteinA = a.protein > 0 ? costPer100gA / a.protein : Infinity;
    const costPerProteinB = b.protein > 0 ? costPer100gB / b.protein : Infinity;

    const caloriesPerProteinA = a.protein > 0 ? a.calories / a.protein : Infinity;
    const caloriesPerProteinB = b.protein > 0 ? b.calories / b.protein : Infinity;

    switch (sortBy) {
      case "protein_asc":
        return proteinA - proteinB;
      case "protein_desc":
        return proteinB - proteinA;
      case "cost_asc":
        return costPer100gA - costPer100gB;
      case "cost_desc":
        return costPer100gB - costPer100gA;
      case "calories_asc":
        return caloriesA - caloriesB;
      case "calories_desc":
        return caloriesB - caloriesA;
      case "costPerProtein_asc":
        return costPerProteinA - costPerProteinB;
      case "costPerProtein_desc":
        return costPerProteinB - costPerProteinA;
      case "caloriesPerProtein_asc":
        return caloriesPerProteinA - caloriesPerProteinB;
      case "caloriesPerProtein_desc":
        return caloriesPerProteinB - caloriesPerProteinA;
      default:
        return 0;
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

  return (
    <div className="flex flex-col h-full gap-3">

      <div className="flex items-center justify-between">
        <h3 className="text-title-s text-foreground">Shopping List</h3>

        <div className="flex items-center gap-1.5">

          <div className="flex rounded-lg overflow-hidden text-[9px] border border-border">
            <button
              onClick={() => setDisplayMode("raw")}
              className={`px-1.5 py-1 font-bold transition-colors ${displayMode === "raw"
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
                }`}
            >
              Raw
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setDisplayMode("per100g")}
              className={`px-1.5 py-1 font-bold transition-colors ${displayMode === "per100g"
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
                }`}
            >
              /100g
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setDisplayMode("perServe")}
              className={`px-1.5 py-1 font-bold transition-colors ${displayMode === "perServe"
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
                }`}
            >
              /daily
            </button>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="h-6 w-6 p-0 flex items-center justify-center rounded-lg border border-border bg-card transition-colors"
            >
              <Plus className="h-3 w-3 text-foreground" />
            </button>
          )}
        </div>
      </div>


      <div className="grid grid-cols-5 gap-1 p-2 rounded-xl bg-muted border border-border">
        <button
          onClick={() => toggleSort("calories")}
          className={`text-center py-1 rounded-md transition-colors border ${sortBy === "calories_asc" || sortBy === "calories_desc"
            ? "bg-card border-border"
            : "border-transparent"
            }`}
        >
          <p className="text-xs font-mono font-bold text-foreground">
            {Math.round(displayTotals.calories).toLocaleString()}
          </p>
          <p className="text-[8px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 uppercase">
            kcal
            {getSortIndicator("calories") ? (
              <span className="text-foreground">
                {getSortIndicator("calories")}
              </span>
            ) : (
              <ArrowUpDown className="h-1.5 w-1.5 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("protein")}
          className={`text-center py-1 rounded-md transition-colors border ${sortBy.startsWith("protein")
            ? "bg-card border-border"
            : "border-transparent"
            }`}
        >
          <p className="text-xs font-mono font-bold text-foreground">
            {Math.round(displayTotals.protein)}g
          </p>
          <p className="text-[8px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 uppercase">
            protein
            {getSortIndicator("protein") ? (
              <span className="text-foreground">
                {getSortIndicator("protein")}
              </span>
            ) : (
              <ArrowUpDown className="h-1.5 w-1.5 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("cost")}
          className={`text-center py-1 rounded-md transition-colors border ${sortBy === "cost_asc" || sortBy === "cost_desc"
            ? "bg-card border-border"
            : "border-transparent"
            }`}
        >
          <p className="text-xs font-mono font-bold text-foreground">
            ₹{Math.round(displayTotals.cost).toLocaleString()}
          </p>
          <p className="text-[8px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 uppercase">
            cost
            {getSortIndicator("cost") ? (
              <span className="text-foreground">{getSortIndicator("cost")}</span>
            ) : (
              <ArrowUpDown className="h-1.5 w-1.5 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("costPerProtein")}
          className={`text-center py-1 rounded-md transition-colors border ${sortBy.startsWith("costPerProtein")
            ? "bg-card border-border"
            : "border-transparent"
            }`}
        >
          <p className="text-xs font-mono font-bold text-foreground">
            ₹{displayTotals.costPerProtein.toFixed(2)}
          </p>
          <p className="text-[8px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 uppercase">
            ₹/g
            {getSortIndicator("costPerProtein") ? (
              <span className="text-foreground">
                {getSortIndicator("costPerProtein")}
              </span>
            ) : (
              <ArrowUpDown className="h-1.5 w-1.5 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("caloriesPerProtein")}
          className={`text-center py-1 rounded-md transition-colors border ${sortBy.startsWith("caloriesPerProtein")
            ? "bg-card border-border"
            : "border-transparent"
            }`}
        >
          <p className="text-xs font-mono font-bold text-foreground">
            {displayTotals.caloriesPerProtein.toFixed(1)}
          </p>
          <p className="text-[8px] text-muted-foreground font-bold flex items-center justify-center gap-0.5 uppercase">
            cal/g
            {getSortIndicator("caloriesPerProtein") ? (
              <span className="text-foreground">
                {getSortIndicator("caloriesPerProtein")}
              </span>
            ) : (
              <ArrowUpDown className="h-1.5 w-1.5 opacity-40" />
            )}
          </p>
        </button>
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


      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-y-auto">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6 rounded-lg border border-dashed border-border"
          >
            <ShoppingCart className="h-8 w-8 mx-auto mb-1.5 text-muted-foreground" />
            <p className="text-xs font-bold text-foreground">No items yet</p>
            <p className="text-[10px] text-muted-foreground">Tap + to add grocery items</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
