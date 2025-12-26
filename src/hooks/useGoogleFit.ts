import { useState, useCallback, useRef } from "react";
import type { ActivityLevel, ActivityLog, StepLog } from "@/lib/supabase";

const GOOGLE_FIT_CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/fitness.activity.read";

const STEP_THRESHOLDS = {
  sedentary: 2000,
  light: 5000,
  moderate: 10000,
} as const;

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

/**
 * Map step count to activity level
 */
export function stepsToActivityLevel(steps: number): ActivityLevel {
  if (steps >= STEP_THRESHOLDS.moderate) return "heavy";
  if (steps >= STEP_THRESHOLDS.light) return "moderate";
  if (steps >= STEP_THRESHOLDS.sedentary) return "light";
  return "sedentary";
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function endOfDay(date: Date): number {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

interface StepData {
  date: string;
  steps: number;
  activityLevel: ActivityLevel;
}

interface SyncResult {
  activityLog: ActivityLog;
  stepLog: StepLog;
}

interface UseGoogleFitReturn {
  isLoading: boolean;
  error: string | null;
  stepData: StepData[];
  syncSteps: (days?: number) => Promise<SyncResult | null>;
  isConfigured: boolean;
}

export function useGoogleFit(): UseGoogleFitReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepData, setStepData] = useState<StepData[]>([]);
  const tokenClientRef = useRef<ReturnType<typeof initTokenClient> | null>(
    null
  );

  const isConfigured = !!GOOGLE_FIT_CLIENT_ID;

  // Initialize token client once
  const initTokenClient = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      return null;
    }
    return window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_FIT_CLIENT_ID,
      scope: SCOPES,
      callback: () => {}, // Will be overridden per request
    });
  }, []);

  const getAccessToken = useCallback(
    (forceConsent = false): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!GOOGLE_FIT_CLIENT_ID) {
          reject(new Error("Google Fit Client ID not configured"));
          return;
        }

        // Check if we have a valid cached token
        if (!forceConsent && cachedAccessToken && Date.now() < tokenExpiresAt) {
          resolve(cachedAccessToken);
          return;
        }

        if (!window.google?.accounts?.oauth2) {
          reject(new Error("Google Identity Services not loaded"));
          return;
        }

        // Create or reuse token client
        if (!tokenClientRef.current) {
          tokenClientRef.current = initTokenClient();
        }

        if (!tokenClientRef.current) {
          reject(new Error("Failed to initialize token client"));
          return;
        }

        // Override callback for this request
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_FIT_CLIENT_ID,
          scope: SCOPES,
          callback: (response: {
            access_token?: string;
            error?: string;
            expires_in?: number;
          }) => {
            if (response.error) {
              reject(new Error(response.error));
            } else if (response.access_token) {
              // Cache the token (expires_in is in seconds, default to 55 minutes)
              cachedAccessToken = response.access_token;
              const expiresIn = (response.expires_in ?? 3300) * 1000;
              tokenExpiresAt = Date.now() + expiresIn - 60000; // 1 minute buffer
              resolve(response.access_token);
            } else {
              reject(new Error("No access token received"));
            }
          },
        });

        // First time: show consent. After that: silent or minimal prompt
        const hasConsentedBefore =
          cachedAccessToken !== null || localStorage.getItem("gfit_consented");
        tokenClient.requestAccessToken({
          prompt: forceConsent || !hasConsentedBefore ? "consent" : "",
        });
      });
    },
    [initTokenClient]
  );

  const fetchStepData = useCallback(
    async (accessToken: string, days: number): Promise<StepData[]> => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days + 1);

      const response = await fetch(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aggregateBy: [
              {
                dataTypeName: "com.google.step_count.delta",
                dataSourceId:
                  "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
              },
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: startOfDay(startDate),
            endTimeMillis: endOfDay(now),
          }),
        }
      );

      if (!response.ok) {
        // If unauthorized, clear cached token
        if (response.status === 401) {
          cachedAccessToken = null;
          tokenExpiresAt = 0;
        }
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to fetch step data"
        );
      }

      const data = await response.json();
      const results: StepData[] = [];

      for (const bucket of data.bucket || []) {
        const bucketDate = new Date(parseInt(bucket.startTimeMillis));
        const dateKey = formatDateKey(bucketDate);

        let steps = 0;
        for (const dataset of bucket.dataset || []) {
          for (const point of dataset.point || []) {
            for (const value of point.value || []) {
              if (value.intVal) {
                steps += value.intVal;
              }
            }
          }
        }

        results.push({
          date: dateKey,
          steps,
          activityLevel: stepsToActivityLevel(steps),
        });
      }

      return results;
    },
    []
  );

  const syncSteps = useCallback(
    async (days: number = 30): Promise<SyncResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        let accessToken = await getAccessToken();
        let data: StepData[];

        try {
          data = await fetchStepData(accessToken, days);
        } catch {
          // Token might be expired, try refreshing
          cachedAccessToken = null;
          accessToken = await getAccessToken(true);
          data = await fetchStepData(accessToken, days);
        }

        // Mark that user has consented
        localStorage.setItem("gfit_consented", "true");

        setStepData(data);

        const activityLog: ActivityLog = {};
        const stepLog: StepLog = {};

        for (const item of data) {
          activityLog[item.date] = item.activityLevel;
          stepLog[item.date] = item.steps;
        }

        return { activityLog, stepLog };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [getAccessToken, fetchStepData]
  );

  return {
    isLoading,
    error,
    stepData,
    syncSteps,
    isConfigured,
  };
}

// Type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              expires_in?: number;
            }) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}
