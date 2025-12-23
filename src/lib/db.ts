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

// Medication log entry - tracks when a medication was taken
export interface MedicationLog {
  id: string; // Format: "medicationId-YYYY-MM-DD"
  medicationId: string;
  date: string; // YYYY-MM-DD
  takenAt: string; // ISO timestamp
}

const db = new Dexie("SecondBrainCache") as Dexie & {
  transactions: EntityTable<CachedTransaction, "id">;
  userStats: EntityTable<CachedUserStats, "id">;
  meta: EntityTable<CacheMeta, "key">;
  medicationLogs: EntityTable<MedicationLog, "id">;
};

db.version(1).stores({
  transactions: "id, date, category, type, _cachedAt",
  userStats: "id, _cachedAt",
  meta: "key, updatedAt",
});

// Version 2 adds medication logs
db.version(2).stores({
  transactions: "id, date, category, type, _cachedAt",
  userStats: "id, _cachedAt",
  meta: "key, updatedAt",
  medicationLogs: "id, medicationId, date",
});

const CACHE_TTL = 5 * 60 * 1000;
const STALE_TTL = 24 * 60 * 60 * 1000;

/**
 * Get cached transactions
 * @param allowStale - If true, returns data even if older than CACHE_TTL (for instant load)
 */
export async function getCachedTransactions(
  allowStale = false
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
 * @param allowStale - If true, returns data even if older than CACHE_TTL (for instant load)
 */
export async function getCachedUserStats(
  allowStale = false
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
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
  await Promise.all([
    db.transactions.clear(),
    db.userStats.clear(),
    db.meta.clear(),
    db.medicationLogs.clear(),
  ]);
}

/**
 * Get medication logs for a specific date
 */
export async function getMedicationLogsForDate(
  date: string
): Promise<MedicationLog[]> {
  try {
    return await db.medicationLogs.where("date").equals(date).toArray();
  } catch {
    return [];
  }
}

/**
 * Get all medication logs (for history/stats)
 */
export async function getAllMedicationLogs(): Promise<MedicationLog[]> {
  try {
    return await db.medicationLogs.toArray();
  } catch {
    return [];
  }
}

/**
 * Toggle medication for a specific date
 * If already taken, removes the log. If not taken, adds a new log.
 */
export async function toggleMedicationLog(
  medicationId: string,
  date: string
): Promise<boolean> {
  const id = `${medicationId}-${date}`;

  try {
    const existing = await db.medicationLogs.get(id);

    if (existing) {
      await db.medicationLogs.delete(id);
      return false; // Now unmarked
    } else {
      await db.medicationLogs.put({
        id,
        medicationId,
        date,
        takenAt: new Date().toISOString(),
      });
      return true; // Now marked as taken
    }
  } catch (error) {
    console.warn("Failed to toggle medication log:", error);
    throw error;
  }
}

/**
 * Check if a medication was taken on a specific date
 */
export async function wasMedicationTaken(
  medicationId: string,
  date: string
): Promise<boolean> {
  const id = `${medicationId}-${date}`;
  try {
    const log = await db.medicationLogs.get(id);
    return !!log;
  } catch {
    return false;
  }
}

export { db };
