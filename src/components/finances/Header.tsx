import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/shared/PageHeader";
import { DateFilter } from "./DateFilter";
import type { TimeFilter, ChartMode, ActiveView, DateRange } from "./types";

interface HeaderProps {
  error: string | null;
  activeView: ActiveView;
  timeFilter: TimeFilter;
  chartMode: ChartMode;
  customDateRange: DateRange;
  onAddExpense: () => void;
  onTimeFilterChange: (filter: TimeFilter) => void;
  onChartModeChange: (mode: ChartMode) => void;
  onCustomDateRangeChange: (range: DateRange) => void;
}

export function Header({
  error,
  activeView,
  timeFilter,
  chartMode,
  customDateRange,
  onAddExpense,
  onTimeFilterChange,
  onChartModeChange,
  onCustomDateRangeChange,
}: HeaderProps) {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertTitle className="text-sm">Error</AlertTitle>
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <PageHeader
        title="Finances"
        icon={Wallet}
        iconGradient="linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)"
        iconShadow="0 4px 12px rgba(139, 92, 246, 0.3)"
        accentColor="#8b5cf6"
      >
        <DateFilter
          activeView={activeView}
          timeFilter={timeFilter}
          chartMode={chartMode}
          customDateRange={customDateRange}
          onTimeFilterChange={onTimeFilterChange}
          onChartModeChange={onChartModeChange}
          onCustomDateRangeChange={onCustomDateRangeChange}
        />

        {/* Desktop Add Button */}
        <Button
          size="sm"
          className="h-8 text-xs hidden md:flex"
          onClick={onAddExpense}
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Expense
        </Button>
      </PageHeader>
    </div>
  );
}
