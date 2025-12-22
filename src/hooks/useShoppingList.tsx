import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase, type ShoppingItem } from "@/lib/supabase";

const shoppingKeys = {
  all: ["shopping"] as const,
  list: () => [...shoppingKeys.all, "list"] as const,
};

async function fetchShoppingList(): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_list")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shopping list:", error);
    return [];
  }
  return data ?? [];
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

  const {
    data: items = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: shoppingKeys.list(),
    queryFn: fetchShoppingList,
  });

  const addMutation = useMutation({
    mutationFn: addShoppingItem,
    onSuccess: (newItem) => {
      queryClient.setQueryData<ShoppingItem[]>(shoppingKeys.list(), (old) =>
        old ? [newItem, ...old] : [newItem]
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<ShoppingItem, "id" | "created_at">> }) =>
      updateShoppingItem(id, updates),
    onMutate: async ({ id, updates }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: shoppingKeys.list() });
      const previousItems = queryClient.getQueryData<ShoppingItem[]>(shoppingKeys.list());
      
      queryClient.setQueryData<ShoppingItem[]>(shoppingKeys.list(), (old) =>
        old?.map((item) => (item.id === id ? { ...item, ...updates } : item)) ?? []
      );
      
      return { previousItems };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.list(), context.previousItems);
      }
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
      
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(shoppingKeys.list(), context.previousItems);
      }
    },
  });

  // Calculate totals (only checked items)
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

