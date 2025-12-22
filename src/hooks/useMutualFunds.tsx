import { useQuery, useQueryClient } from "@tanstack/react-query";

// Mutual fund scheme codes for the watchlist
export const WATCHLIST_FUNDS = [
  {
    schemeCode: 122639,
    shortName: "Parag Parikh Flexi Cap",
    fullName: "Parag Parikh Flexi Cap Fund - Direct Plan - Growth",
  },
  {
    schemeCode: 119788,
    shortName: "SBI Gold",
    fullName: "SBI Gold Fund - Direct Plan - Growth",
  },
  {
    schemeCode: 120716,
    shortName: "UTI Nifty 50",
    fullName: "UTI Nifty 50 Index Fund - Direct Plan - Growth",
  },
  {
    schemeCode: 143341,
    shortName: "UTI Nifty Next 50",
    fullName: "UTI Nifty Next 50 Index Fund - Direct Plan - Growth",
  },
] as const;

export type MutualFundData = {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: Array<{
    date: string;
    nav: string;
  }>;
  status: string;
};

export type FundWithStats = {
  schemeCode: number;
  shortName: string;
  fullName: string;
  currentNav: number;
  previousNav: number;
  dailyChange: number;
  dailyChangePercent: number;
  monthChange: number;
  monthChangePercent: number;
  yearChange: number;
  yearChangePercent: number;
  threeYearChange: number;
  threeYearChangePercent: number;
  fiveYearChange: number;
  fiveYearChangePercent: number;
  lastUpdated: string;
  navHistory: Array<{ date: string; nav: number }>;
};

async function fetchMutualFund(schemeCode: number): Promise<MutualFundData> {
  const response = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch fund ${schemeCode}`);
  }
  return response.json();
}

// Fetch NAV for a specific date (for recording investments)
export async function fetchNavForDate(
  schemeCode: number,
  targetDate: string // YYYY-MM-DD
): Promise<number | null> {
  const data = await fetchMutualFund(schemeCode);
  const target = new Date(targetDate);

  for (const entry of data.data) {
    const entryDate = parseNavDate(entry.date);
    if (entryDate <= target) {
      return parseFloat(entry.nav);
    }
  }
  return null;
}

// Parse date from "DD-MM-YYYY" format
function parseNavDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Find NAV closest to target date
function findNavAtDate(
  navData: Array<{ date: string; nav: string }>,
  targetDate: Date
): number | null {
  for (const entry of navData) {
    const entryDate = parseNavDate(entry.date);
    if (entryDate <= targetDate) {
      return parseFloat(entry.nav);
    }
  }
  return null;
}

function calculateFundStats(
  fund: (typeof WATCHLIST_FUNDS)[number],
  data: MutualFundData
): FundWithStats {
  const navData = data.data; // Full history

  const currentNav = parseFloat(navData[0]?.nav || "0");
  const previousNav = parseFloat(navData[1]?.nav || "0");

  const now = new Date();

  // Calculate target dates
  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

  const fiveYearsAgo = new Date(now);
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  // Find NAVs at target dates
  const monthAgoNav = findNavAtDate(navData, oneMonthAgo) || currentNav;
  const yearAgoNav = findNavAtDate(navData, oneYearAgo);
  const threeYearAgoNav = findNavAtDate(navData, threeYearsAgo);
  const fiveYearAgoNav = findNavAtDate(navData, fiveYearsAgo);

  // Calculate changes
  const dailyChange = currentNav - previousNav;
  const dailyChangePercent =
    previousNav > 0 ? (dailyChange / previousNav) * 100 : 0;

  const monthChange = currentNav - monthAgoNav;
  const monthChangePercent =
    monthAgoNav > 0 ? (monthChange / monthAgoNav) * 100 : 0;

  // 1Y - already annualized (it's 1 year)
  const yearChange = yearAgoNav ? currentNav - yearAgoNav : 0;
  const yearChangePercent =
    yearAgoNav && yearAgoNav > 0 ? (yearChange / yearAgoNav) * 100 : 0;

  // 3Y - Calculate CAGR (Compound Annual Growth Rate)
  // CAGR = ((EndValue / StartValue) ^ (1/years)) - 1
  const threeYearChange = threeYearAgoNav ? currentNav - threeYearAgoNav : 0;
  let threeYearChangePercent = 0;
  if (threeYearAgoNav && threeYearAgoNav > 0) {
    const totalReturn = currentNav / threeYearAgoNav;
    const cagr = Math.pow(totalReturn, 1 / 3) - 1;
    threeYearChangePercent = cagr * 100;
  }

  // 5Y - Calculate CAGR
  const fiveYearChange = fiveYearAgoNav ? currentNav - fiveYearAgoNav : 0;
  let fiveYearChangePercent = 0;
  if (fiveYearAgoNav && fiveYearAgoNav > 0) {
    const totalReturn = currentNav / fiveYearAgoNav;
    const cagr = Math.pow(totalReturn, 1 / 5) - 1;
    fiveYearChangePercent = cagr * 100;
  }

  return {
    schemeCode: fund.schemeCode,
    shortName: fund.shortName,
    fullName: fund.fullName,
    currentNav,
    previousNav,
    dailyChange,
    dailyChangePercent,
    monthChange,
    monthChangePercent,
    yearChange,
    yearChangePercent,
    threeYearChange,
    threeYearChangePercent,
    fiveYearChange,
    fiveYearChangePercent,
    lastUpdated: navData[0]?.date || "",
    navHistory: navData
      .slice(0, 30)
      .reverse()
      .map((d) => ({
        date: d.date,
        nav: parseFloat(d.nav),
      })),
  };
}

const mutualFundKeys = {
  all: ["mutualFunds"] as const,
  fund: (schemeCode: number) => [...mutualFundKeys.all, schemeCode] as const,
  watchlist: () => [...mutualFundKeys.all, "watchlist"] as const,
};

export function useMutualFund(schemeCode: number) {
  const fund = WATCHLIST_FUNDS.find((f) => f.schemeCode === schemeCode);

  return useQuery({
    queryKey: mutualFundKeys.fund(schemeCode),
    queryFn: async () => {
      const data = await fetchMutualFund(schemeCode);
      if (!fund) throw new Error("Fund not in watchlist");
      return calculateFundStats(fund, data);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - NAV updates only 3x daily
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function useMutualFundWatchlist() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: mutualFundKeys.watchlist(),
    queryFn: async () => {
      const results = await Promise.allSettled(
        WATCHLIST_FUNDS.map(async (fund) => {
          const data = await fetchMutualFund(fund.schemeCode);
          return calculateFundStats(fund, data);
        })
      );

      return results
        .filter(
          (r): r is PromiseFulfilledResult<FundWithStats> =>
            r.status === "fulfilled"
        )
        .map((r) => r.value);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: mutualFundKeys.watchlist() });
  };

  return {
    funds: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    isRefetching: query.isRefetching,
    refresh,
    lastUpdated: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
  };
}
