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
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
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
  };
  onSubmit: (values: { name: string; calories: number; protein: number; cost: number }) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

function ItemForm({ initialValues, onSubmit, onCancel, onDelete, isSubmitting, submitLabel }: ItemFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [name, setName] = useState(initialValues?.name ?? "");
  const [calories, setCalories] = useState(initialValues?.calories?.toString() ?? "");
  const [protein, setProtein] = useState(initialValues?.protein?.toString() ?? "");
  const [cost, setCost] = useState(initialValues?.cost?.toString() ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      cost: parseFloat(cost) || 0,
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
      <div
        className="p-3 rounded-xl space-y-3"
        style={{
          background: isDark
            ? "rgba(139, 92, 246, 0.1)"
            : "rgba(139, 92, 246, 0.06)",
          border: isDark
            ? "1px solid rgba(139, 92, 246, 0.2)"
            : "1px solid rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Item name */}
        <Input
          placeholder="Item name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-sm"
          autoFocus
          disabled={isSubmitting}
        />

        {/* Nutritional inputs */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
              <Flame className="h-3 w-3 text-emerald-500" />
              Calories
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
              <Beef className="h-3 w-3 text-amber-500" />
              Protein (g)
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
              <IndianRupee className="h-3 w-3 text-green-500" />
              Cost (₹)
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
          <Button
            type="submit"
            size="sm"
            disabled={!name.trim() || isSubmitting}
            className="flex-1 h-8 bg-violet-500 hover:bg-violet-600 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              submitLabel
            )}
          </Button>
        </div>

        {/* Delete button (only in edit mode) */}
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDelete}
            disabled={isSubmitting}
            className="w-full h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete Item
          </Button>
        )}
      </div>
    </motion.form>
  );
}

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (item: ShoppingItem) => void;
}

function ShoppingItemRow({ item, onToggle, onEdit }: ShoppingItemRowProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
        item.checked ? "opacity-60" : ""
      }`}
      style={{
        background: isDark
          ? "rgba(255, 255, 255, 0.03)"
          : "rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
          item.checked
            ? "bg-violet-500 border-violet-500"
            : "border-muted-foreground/30 hover:border-violet-500"
        }`}
      >
        {item.checked && <Check className="h-3 w-3 text-white" />}
      </button>

      {/* Item details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {item.name}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Flame className="h-2.5 w-2.5 text-emerald-500" />
            {item.calories}
          </span>
          <span className="flex items-center gap-0.5">
            <Beef className="h-2.5 w-2.5 text-amber-500" />
            {item.protein}g
          </span>
          <span className="flex items-center gap-0.5">
            <IndianRupee className="h-2.5 w-2.5 text-green-500" />
            {item.cost}
          </span>
        </div>
      </div>

      {/* Edit button */}
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

export function ShoppingList() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  const {
    items,
    totals,
    addItem,
    toggleChecked,
    updateItem,
    deleteItem,
    isAdding,
    isUpdating,
  } = useShoppingList();

  const handleAddItem = async (values: { name: string; calories: number; protein: number; cost: number }) => {
    await addItem({ ...values, checked: false });
    setShowAddForm(false);
  };

  const handleEditItem = async (values: { name: string; calories: number; protein: number; cost: number }) => {
    if (!editingItem) return;
    await updateItem(editingItem.id, values);
    setEditingItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
    >
      <Card
        className="p-4 overflow-hidden relative"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%)"
            : "linear-gradient(135deg, rgba(139, 92, 246, 0.06) 0%, rgba(124, 58, 237, 0.02) 100%)",
          border: isDark
            ? "1px solid rgba(139, 92, 246, 0.15)"
            : "1px solid rgba(139, 92, 246, 0.12)",
        }}
      >
        {/* Decorative gradient */}
        <div
          className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Shopping List</h3>
                <p className="text-[10px] text-muted-foreground">
                  {items.length} item{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {!showAddForm && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="h-8 w-8 p-0 text-violet-500 hover:text-violet-600 hover:bg-violet-500/10 border-violet-500/30 hover:border-violet-500/50"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Totals summary (only checked items) */}
          <div
            className="grid grid-cols-3 gap-2 p-2 rounded-lg"
            style={{
              background: isDark
                ? "rgba(139, 92, 246, 0.1)"
                : "rgba(139, 92, 246, 0.06)",
            }}
          >
            <div className="text-center">
              <p className="text-xs font-mono font-semibold text-emerald-500">
                {totals.calories.toLocaleString()}
              </p>
              <p className="text-[8px] text-muted-foreground">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-mono font-semibold text-amber-500">
                {totals.protein.toFixed(1)}g
              </p>
              <p className="text-[8px] text-muted-foreground">protein</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-mono font-semibold text-green-500">
                ₹{totals.cost.toLocaleString()}
              </p>
              <p className="text-[8px] text-muted-foreground">total</p>
            </div>
          </div>

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
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {items
                .filter((item) => item.id !== editingItem?.id)
                .map((item) => (
                  <ShoppingItemRow
                    key={item.id}
                    item={item}
                    onToggle={toggleChecked}
                    onEdit={setEditingItem}
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
                <p className="text-[10px] opacity-60">
                  Tap + to add grocery items
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

