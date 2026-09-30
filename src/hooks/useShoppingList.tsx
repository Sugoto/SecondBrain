import { useState } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { shoppingCollection } from "@/lib/collections";
import type { ShoppingItem } from "@/lib/supabase";

type ShoppingInput = Omit<ShoppingItem, "id" | "created_at">;

export function useShoppingList() {
  const { data, isLoading, isError } = useLiveQuery((q) =>
    q.from({ i: shoppingCollection }).orderBy(({ i }) => i.created_at, "desc"),
  );
  const items: ShoppingItem[] = data;
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const totals = items
    .filter((item) => item.checked)
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        cost: acc.cost + item.cost,
      }),
      { calories: 0, protein: 0, cost: 0 },
    );

  const checkedCount = items.filter((item) => item.checked).length;

  const updateItem = async (id: string, updates: Partial<ShoppingInput>) => {
    setIsUpdating(true);
    try {
      await shoppingCollection.update(id, (draft) => {
        Object.assign(draft, updates);
      }).isPersisted.promise;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    items,
    loading: isLoading && items.length === 0,
    error: isError ? (shoppingCollection.utils.lastError as Error).message : null,
    totals,
    checkedCount,

    addItem: async (item: ShoppingInput) => {
      const created: ShoppingItem = {
        ...item,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      setIsAdding(true);
      try {
        await shoppingCollection.insert(created).isPersisted.promise;
      } finally {
        setIsAdding(false);
      }
      return created;
    },

    toggleChecked: (id: string, checked: boolean) => {
      updateItem(id, { checked }).catch(console.error);
    },

    updateItem,

    deleteItem: (id: string) => {
      shoppingCollection.delete(id).isPersisted.promise.catch(console.error);
    },

    isAdding,
    isUpdating,
    isDeleting: false,
  };
}
