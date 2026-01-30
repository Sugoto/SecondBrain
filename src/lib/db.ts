import Dexie, { type EntityTable } from "dexie";
import type { Transaction, UserStats, ShoppingItem } from "./supabase";

interface CachedTransaction extends Transaction {
  _cachedAt: number;
}

interface CachedUserStats extends UserStats {
  _cachedAt: number;
}

interface CachedShoppingItem extends ShoppingItem {
  _cachedAt: number;
}

interface CacheMeta {
  key: string;
  value: string;
  updatedAt: number;
}

const db = new Dexie("SecondBrainCache") as Dexie & {
  transactions: EntityTable<CachedTransaction, "id">;
  userStats: EntityTable<CachedUserStats, "id">;
  meta: EntityTable<CacheMeta, "key">;
  shoppingList: EntityTable<CachedShoppingItem, "id">;
};

db.version(1).stores({
  transactions: "id, date, category, type, _cachedAt",
  userStats: "id, _cachedAt",
  meta: "key, updatedAt",
});

// Version 2 adds shopping list cache
db.version(2).stores({
  transactions: "id, date, category, type, _cachedAt",
  userStats: "id, _cachedAt",
  meta: "key, updatedAt",
  shoppingList: "id, _cachedAt",
});

const CACHE_TTL = 5 * 60 * 1000;
const STALE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached transactions
 * @param allowStale - If true, returns data even if older than CACHE_TTL (for instant load)
 */
export async function getCachedTransactions(
  allowStale = false,
): Promise<Transaction[] | null> {
  try {
    const cached = await db.transactions.toArray();
    if (cached.length === 0) return null;

    const oldestCache = Math.min(...cached.map((t) => t._cachedAt));
    const age = Date.now() - oldestCache;

    const maxAge = allowStale ? STALE_TTL : CACHE_TTL;
    if (age > maxAge) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return cached.map(({ _cachedAt, ...t }) => t as Transaction);
  } catch {
    return null;
  }
}

/**
 * Store transactions in cache
 */
export async function cacheTransactions(
  transactions: Transaction[],
): Promise<void> {
  try {
    const now = Date.now();
    const cached: CachedTransaction[] = transactions.map((t) => ({
      ...t,
      _cachedAt: now,
    }));

    // Clear old and insert new
    await db.transactions.clear();
    await db.transactions.bulkPut(cached);
  } catch (error) {
    console.warn("Failed to cache transactions:", error);
  }
}

/**
 * Get cached user stats
 * @param allowStale - If true, returns data even if older than CACHE_TTL (for instant load)
 */
export async function getCachedUserStats(
  allowStale = false,
): Promise<UserStats | null> {
  try {
    const cached = await db.userStats.toArray();
    if (cached.length === 0) return null;

    const stats = cached[0];
    const age = Date.now() - stats._cachedAt;

    // Use extended TTL if stale data is allowed
    const maxAge = allowStale ? STALE_TTL : CACHE_TTL;
    if (age > maxAge) {
      return null; // Cache expired
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _cachedAt, ...userStats } = stats;
    return userStats as UserStats;
  } catch {
    return null;
  }
}

/**
 * Store user stats in cache
 */
export async function cacheUserStats(stats: UserStats): Promise<void> {
  try {
    await db.userStats.clear();
    await db.userStats.put({
      ...stats,
      _cachedAt: Date.now(),
    });
  } catch (error) {
    console.warn("Failed to cache user stats:", error);
  }
}

/**
 * Store a simple key-value in cache
 */
export async function setCacheMeta(key: string, value: string): Promise<void> {
  try {
    await db.meta.put({ key, value, updatedAt: Date.now() });
  } catch (error) {
    console.warn("Failed to set cache meta:", error);
  }
}

/**
 * Get a simple key-value from cache
 */
export async function getCacheMeta(key: string): Promise<string | null> {
  try {
    const meta = await db.meta.get(key);
    return meta?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Get cached shopping list
 * @param allowStale - If true, returns data even if older than CACHE_TTL (for instant load)
 */
export async function getCachedShoppingList(
  allowStale = false,
): Promise<ShoppingItem[] | null> {
  try {
    const cached = await db.shoppingList.toArray();
    if (cached.length === 0) return null;

    const oldestCache = Math.min(...cached.map((t) => t._cachedAt));
    const age = Date.now() - oldestCache;

    const maxAge = allowStale ? STALE_TTL : CACHE_TTL;
    if (age > maxAge) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return cached.map(({ _cachedAt, ...item }) => item as ShoppingItem);
  } catch {
    return null;
  }
}

/**
 * Store shopping list in cache
 */
export async function cacheShoppingList(items: ShoppingItem[]): Promise<void> {
  try {
    const now = Date.now();
    const cached: CachedShoppingItem[] = items.map((item) => ({
      ...item,
      _cachedAt: now,
    }));

    // Clear old and insert new
    await db.shoppingList.clear();
    await db.shoppingList.bulkPut(cached);
  } catch (error) {
    console.warn("Failed to cache shopping list:", error);
  }
}

export { db };
