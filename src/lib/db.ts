import Dexie, { type EntityTable } from "dexie";
import type { Transaction, UserStats } from "./supabase";

interface CachedTransaction extends Transaction {
  _cachedAt: number;
}

interface CachedUserStats extends UserStats {
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
};

db.version(1).stores({
  transactions: "id, date, category, type, _cachedAt",
  userStats: "id, _cachedAt",
  meta: "key, updatedAt",
});

const CACHE_TTL = 5 * 60 * 1000;


export async function getCachedTransactions(): Promise<Transaction[] | null> {
  try {
    const cached = await db.transactions.toArray();
    if (cached.length === 0) return null;

    const oldestCache = Math.min(...cached.map((t) => t._cachedAt));
    if (Date.now() - oldestCache > CACHE_TTL) {
      return null;
    }

    // Remove internal fields and return
    return cached.map(({ _cachedAt, ...t }) => t as Transaction);
  } catch {
    return null;
  }
}

/**
 * Store transactions in cache
 */
export async function cacheTransactions(
  transactions: Transaction[]
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
 */
export async function getCachedUserStats(): Promise<UserStats | null> {
  try {
    const cached = await db.userStats.toArray();
    if (cached.length === 0) return null;

    const stats = cached[0];
    if (Date.now() - stats._cachedAt > CACHE_TTL) {
      return null; // Cache expired
    }

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
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
  await Promise.all([
    db.transactions.clear(),
    db.userStats.clear(),
    db.meta.clear(),
  ]);
}

export { db };
