import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type ShoppingItem } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { getCachedShoppingList, cacheShoppingList } from "@/lib/db";

const shoppingKeys = {
  all: ["shopping"] as const,
  list: () => [...shoppingKeys.all, "list"] as const,
};

let cachedShoppingListPromise: Promise<ShoppingItem[] | null> | null = null;

if (typeof window !== "undefined") {
  cachedShoppingListPromise = getCachedShoppingList(true);
}

async function fetchShoppingList(): Promise<ShoppingItem[]> {
  const cached = await getCachedShoppingList();

  const { data, error } = await supabase
    .from("shopping_list")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shopping list:", error);
    if (cached) return cached;
    return [];
  }

  if (data) {
    cacheShoppingList(data);
  }

  return data ?? cached ?? [];
}

async function addShoppingItem(
  item: Omit<ShoppingItem, "id" | "created_at">
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from("shopping_list")
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function updateShoppingItem(
  id: string,
  updates: Partial<Omit<ShoppingItem, "id" | "created_at">>
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from("shopping_list")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from("shopping_list").delete().eq("id", id);

  if (error) throw error;
}

export function useShoppingList() {
  const queryClient = useQueryClient();

  const [initialData, setInitialData] = useState<ShoppingItem[] | undefined>(
    undefined
  );

  useEffect(() => {
    cachedShoppingListPromise?.then((cached) => {
      if (cached && cached.length > 0) {
        queryClient.setQueryData(shoppingKeys.list(), cached);
        setInitialData(cached);
      }
    });
  }, [queryClient]);

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: shoppingKeys.list(),
    queryFn: fetchShoppingList,
    placeholderData: initialData,
  });

  const loading = isLoading && items.length === 0 && !initialData;

  const persistCache = () => {
    const fresh = queryClient.getQueryData<ShoppingItem[]>(shoppingKeys.list());
    if (fresh) cacheShoppingList(fresh);
  };

  const addMutation = useMutation({
    mutationFn: addShoppingItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData<ShoppingItem[]>(shoppingKeys.list(), (old) =>
        old ? [newItem, ...old] : [newItem]
      );
      persistCache();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<ShoppingItem, "id" | "created_at">> }) =>
      updateShoppingItem(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: shoppingKeys.list() });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(shoppingKeys.list());

      queryClient.setQueryData<ShoppingItem[]>(shoppingKeys.list(), (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...updates } : item)) ?? []
      );

      persistCache();

      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.list(), context.previousItems);
        cacheShoppingList(context.previousItems);
      }
    },
    onSuccess: () => {
      persistCache();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteShoppingItem,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: shoppingKeys.list() });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(shoppingKeys.list());

      queryClient.setQueryData<ShoppingItem[]>(shoppingKeys.list(), (old) =>
        old?.filter((item) => item.id !== id) ?? []
      );
      persistCache();

      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.list(), context.previousItems);
        cacheShoppingList(context.previousItems);
      }
    },
    onSuccess: () => {
      persistCache();
    },
  });

  const totals = items
    .filter((item) => item.checked)
    .reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        cost: acc.cost + item.cost,
      }),
      { calories: 0, protein: 0, cost: 0 }
    );
  
  const checkedCount = items.filter((item) => item.checked).length;

  return {
    items,
    loading,
    error: error ? (error as Error).message : null,
    totals,
    checkedCount,

    addItem: (item: Omit<ShoppingItem, "id" | "created_at">) =>
      addMutation.mutateAsync(item),
    
    toggleChecked: (id: string, checked: boolean) =>
      updateMutation.mutate({ id, updates: { checked } }),
    
    updateItem: (id: string, updates: Partial<Omit<ShoppingItem, "id" | "created_at">>) =>
      updateMutation.mutateAsync({ id, updates }),
    
    deleteItem: (id: string) => deleteMutation.mutate(id),

    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

