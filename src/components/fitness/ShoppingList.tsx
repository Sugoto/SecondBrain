import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Flame,
  Beef,
  IndianRupee,
  Check,
  X,
  Loader2,
  Pencil,
  Scale,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShoppingList } from "@/hooks/useShoppingList";
import type { ShoppingItem } from "@/lib/supabase";

interface ItemFormProps {
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
  initialValues,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting,
  submitLabel,
}: ItemFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [calories, setCalories] = useState(
    initialValues?.calories?.toString() ?? ""
  );
  const [protein, setProtein] = useState(
    initialValues?.protein?.toString() ?? ""
  );
  const [cost, setCost] = useState(initialValues?.cost?.toString() ?? "");
  const [weightGrams, setWeightGrams] = useState(
    initialValues?.weight_grams?.toString() ?? "100"
  );
  const [servingGrams, setServingGrams] = useState(
    initialValues?.serving_grams?.toString() ?? "100"
  );

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
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <div className="p-3 rounded-lg border border-border bg-card space-y-3">
        {/* Item name */}
        <Input
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-sm"
          autoFocus
          disabled={isSubmitting}
        />

        {/* Nutritional inputs - calories & protein are per 100g */}
        <div className="space-y-2">
          {/* Row 1: Calories, Protein, Raw Weight, Serve */}
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Cal <span className="text-[8px] opacity-60">/100g</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="h-8 text-sm font-mono"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Beef className="h-3 w-3" />
                Pro <span className="text-[8px] opacity-60">/100g</span>
              </label>
              <Input
                type="number"
                placeholder="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                className="h-8 text-sm font-mono"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Weight
              </label>
              <Input
                type="number"
                placeholder="100"
                value={weightGrams}
                onChange={(e) => setWeightGrams(e.target.value)}
                className="h-8 text-sm font-mono"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Scale className="h-3 w-3" />
                Serve
              </label>
              <Input
                type="number"
                placeholder="100"
                value={servingGrams}
                onChange={(e) => setServingGrams(e.target.value)}
                className="h-8 text-sm font-mono"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 2: Cost (full width) */}
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />
              Cost
            </label>
            <Input
              type="number"
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-8 text-sm font-mono"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 h-8"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Cancel
          </Button>
          <button
            type="submit"
            disabled={!name.trim() || isSubmitting}
            className="flex-1 h-8 rounded-md bg-foreground text-background text-sm font-medium transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
            ) : (
              submitLabel
            )}
          </button>
        </div>

        {/* Delete button (only in edit mode) */}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isSubmitting}
            className="w-full h-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete Item
          </Button>
        )}
      </div>
    </motion.form>
  );
}

type DisplayMode = "raw" | "per100g" | "perServe";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
  displayMode: DisplayMode;
}

// Helper function to calculate per-100g values
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
  // Input values are per 100g, extrapolate based on display mode
  const weight = item.weight_grams || 100;
  const serving = item.serving_grams || 100;
  const costPer100g = calcPer100g(item.cost, weight);

  // Extrapolate per-100g values to actual weight for raw mode
  const caloriesRaw = (item.calories / 100) * weight;
  const proteinRaw = (item.protein / 100) * weight;

  // Extrapolate per-100g values to serving size
  const caloriesPerServe = (item.calories / 100) * serving;
  const proteinPerServe = (item.protein / 100) * serving;
  const costPerServe = (costPer100g / 100) * serving;

  // Display values based on mode
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

  // Cost per gram of protein (use cost per 100g since protein is per 100g)
  const costPerProtein = item.protein > 0 ? costPer100g / item.protein : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg border border-border bg-card transition-all ${item.checked ? "opacity-60" : ""
        }`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${item.checked
          ? "bg-foreground border-foreground"
          : "border-muted-foreground/30 hover:border-foreground"
          }`}
      >
        {item.checked && <Check className="h-3 w-3 text-background" />}
      </button>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.name}</p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span
            className="flex items-center gap-0.5"
            title={`${item.calories} kcal for ${weight}g`}
          >
            <Flame className="h-2.5 w-2.5" />
            {displayCalories}
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`${item.protein}g for ${weight}g`}
          >
            <Beef className="h-2.5 w-2.5" />
            {displayProtein}g
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`₹${item.cost} for ${weight}g`}
          >
            <IndianRupee className="h-2.5 w-2.5" />₹{displayCost}
          </span>
          <span
            className="flex items-center gap-0.5"
            title={`₹${costPerProtein.toFixed(2)} per gram of protein`}
          >
            <span className="font-medium">₹/g</span>
            {costPerProtein.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Edit button */}
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
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
  | "costPerProtein_desc";

export function ShoppingList() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("costPerProtein_asc");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("per100g");

  // Toggle sort for a given metric (cycles: none -> desc -> asc -> none)
  const toggleSort = (
    metric: "calories" | "protein" | "cost" | "costPerProtein"
  ) => {
    const descKey = `${metric}_desc` as SortOption;
    const ascKey = `${metric}_asc` as SortOption;

    if (sortBy === descKey) {
      setSortBy(ascKey);
    } else if (sortBy === ascKey) {
      setSortBy("none");
    } else {
      setSortBy(descKey);
    }
  };

  // Get sort indicator for a metric
  const getSortIndicator = (
    metric: "calories" | "protein" | "cost" | "costPerProtein"
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

  // Calculate totals based on display mode
  // Input values are per 100g - extrapolate based on mode
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

  // Calculate average cost per gram of protein for checked items
  // Always use per-100g cost for this calculation since protein is per 100g
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

  const displayTotals = { ...baseTotals, costPerProtein: avgCostPerProtein };

  // Sort items - calories & protein are always per 100g, only cost needs normalization
  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === "none") return 0;

    const weightA = a.weight_grams || 100;
    const weightB = b.weight_grams || 100;

    // Calories and protein are already per 100g
    const proteinA = a.protein;
    const proteinB = b.protein;
    const caloriesA = a.calories;
    const caloriesB = b.calories;

    // Normalize cost to per 100g
    const costPer100gA = calcPer100g(a.cost, weightA);
    const costPer100gB = calcPer100g(b.cost, weightB);

    // Cost per gram of protein (using normalized cost)
    const costPerProteinA = a.protein > 0 ? costPer100gA / a.protein : Infinity;
    const costPerProteinB = b.protein > 0 ? costPer100gB / b.protein : Infinity;

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Shopping List</h3>

        <div className="flex items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex rounded-md overflow-hidden text-[10px] border border-border">
            <button
              onClick={() => setDisplayMode("raw")}
              className={`px-2 py-1 transition-colors ${displayMode === "raw"
                ? "bg-foreground text-background"
                : "hover:bg-muted"
                }`}
            >
              Raw
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setDisplayMode("per100g")}
              className={`px-2 py-1 transition-colors ${displayMode === "per100g"
                ? "bg-foreground text-background"
                : "hover:bg-muted"
                }`}
            >
              /100g
            </button>
            <div className="w-px bg-border" />
            <button
              onClick={() => setDisplayMode("perServe")}
              className={`px-2 py-1 transition-colors ${displayMode === "perServe"
                ? "bg-foreground text-background"
                : "hover:bg-muted"
                }`}
            >
              /serve
            </button>
          </div>

          {!showAddForm && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddForm(true)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Totals summary (only checked items) - clickable for sorting */}
      <div className="grid grid-cols-4 gap-1.5 rounded-lg">
        <button
          onClick={() => toggleSort("calories")}
          className={`text-center py-1 rounded-md transition-all ${sortBy.startsWith("calories")
            ? "bg-accent"
            : "hover:bg-accent/50"
            }`}
        >
          <p className="text-xs font-mono font-semibold text-foreground">
            {Math.round(displayTotals.calories).toLocaleString()}
          </p>
          <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
            kcal
            {getSortIndicator("calories") ? (
              <span className="text-foreground">
                {getSortIndicator("calories")}
              </span>
            ) : (
              <ArrowUpDown className="h-2 w-2 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("protein")}
          className={`text-center py-1 rounded-md transition-all ${sortBy.startsWith("protein")
            ? "bg-accent"
            : "hover:bg-accent/50"
            }`}
        >
          <p className="text-xs font-mono font-semibold text-foreground">
            {Math.round(displayTotals.protein)}g
          </p>
          <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
            protein
            {getSortIndicator("protein") ? (
              <span className="text-foreground">
                {getSortIndicator("protein")}
              </span>
            ) : (
              <ArrowUpDown className="h-2 w-2 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("cost")}
          className={`text-center py-1 rounded-md transition-all ${sortBy === "cost_asc" || sortBy === "cost_desc"
            ? "bg-accent"
            : "hover:bg-accent/50"
            }`}
        >
          <p className="text-xs font-mono font-semibold text-foreground">
            ₹{Math.round(displayTotals.cost).toLocaleString()}
          </p>
          <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
            cost
            {getSortIndicator("cost") ? (
              <span className="text-foreground">{getSortIndicator("cost")}</span>
            ) : (
              <ArrowUpDown className="h-2 w-2 opacity-40" />
            )}
          </p>
        </button>
        <button
          onClick={() => toggleSort("costPerProtein")}
          className={`text-center py-1 rounded-md transition-all ${sortBy.startsWith("costPerProtein")
            ? "bg-accent"
            : "hover:bg-accent/50"
            }`}
        >
          <p className="text-xs font-mono font-semibold text-foreground">
            ₹{displayTotals.costPerProtein.toFixed(2)}
          </p>
          <p className="text-[8px] text-muted-foreground flex items-center justify-center gap-0.5">
            ₹/g
            {getSortIndicator("costPerProtein") ? (
              <span className="text-foreground">
                {getSortIndicator("costPerProtein")}
              </span>
            ) : (
              <ArrowUpDown className="h-2 w-2 opacity-40" />
            )}
          </p>
        </button>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-border" />

      {/* Add item form */}
      <AnimatePresence>
        {showAddForm && (
          <ItemForm
            onSubmit={handleAddItem}
            onCancel={() => setShowAddForm(false)}
            isSubmitting={isAdding}
            submitLabel="Add"
          />
        )}
      </AnimatePresence>

      {/* Edit item form */}
      <AnimatePresence>
        {editingItem && (
          <ItemForm
            initialValues={{
              name: editingItem.name,
              calories: editingItem.calories,
              protein: editingItem.protein,
              cost: editingItem.cost,
              weight_grams: editingItem.weight_grams || 100,
              serving_grams: editingItem.serving_grams || 100,
            }}
            onSubmit={handleEditItem}
            onCancel={() => setEditingItem(null)}
            onDelete={() => {
              deleteItem(editingItem.id);
              setEditingItem(null);
            }}
            isSubmitting={isUpdating}
            submitLabel="Save"
          />
        )}
      </AnimatePresence>

      {/* Items list */}
      <div className="flex-1 min-h-0 space-y-2.5 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {sortedItems
            .filter((item) => item.id !== editingItem?.id)
            .map((item) => (
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
            className="text-center py-6 text-muted-foreground"
          >
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">No items yet</p>
            <p className="text-[10px] opacity-60">Tap + to add grocery items</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
