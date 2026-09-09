import { useCallback, useMemo, memo, useRef } from "react";
import type { Transaction } from "@/lib/supabase";
import { TransactionCard } from "./TransactionCard";
import { Footer } from "./Footer";
import { formatDayLabel } from "./constants";
import { getMonthlyAmount } from "./utils";
import { useFormatCurrencyCompact } from "@/hooks/usePrivacy";
import { useVirtualizer } from "@tanstack/react-virtual";

const TXN_HEIGHT = 38;
const HEADER_HEIGHT = 34;
/** Air between one day card and the next. */
const CARD_GAP = 10;
const OVERSCAN = 8;

type ListRow =
  | { kind: "header"; key: string; date: string; total: number; count: number; gap: boolean }
  | { kind: "txn"; key: string; txn: Transaction; isLastOfDay: boolean };

/** Flattens the date-sorted transactions into one addressable row list so the
 *  virtualizer keeps working, with a header opening each day card. */
function buildRows(transactions: Transaction[]): ListRow[] {
  const rows: ListRow[] = [];

  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i];
    const prev = transactions[i - 1];
    const next = transactions[i + 1];

    if (!prev || prev.date !== txn.date) {
      let total = 0;
      let count = 0;
      for (let j = i; j < transactions.length; j++) {
        if (transactions[j].date !== txn.date) break;
        total += getMonthlyAmount(transactions[j]);
        count++;
      }
      rows.push({
        kind: "header",
        key: `h-${txn.date}`,
        date: txn.date,
        total,
        count,
        gap: rows.length > 0,
      });
    }

    rows.push({
      kind: "txn",
      key: txn.id,
      txn,
      isLastOfDay: !next || next.date !== txn.date,
    });
  }

  return rows;
}

function rowHeight(row: ListRow): number {
  if (row.kind === "txn") return TXN_HEIGHT;
  return HEADER_HEIGHT + (row.gap ? CARD_GAP : 0);
}

function DayHeader({
  date,
  total,
  count,
  gap,
}: {
  date: string;
  total: number;
  count: number;
  gap: boolean;
}) {
  const fmt = useFormatCurrencyCompact();
  return (
    <div className="flex h-full flex-col justify-end" style={{ paddingTop: gap ? CARD_GAP : 0 }}>
      <div className="flex items-center justify-between gap-3 rounded-t-[14px] border-x border-t border-[var(--ui-edge)] bg-[var(--ui-panel)] px-3 pt-2 pb-1.5">
        {/* leading-5 matches the chip's line box, so the header is the same
            height with or without it and the card gap does not wobble. */}
        <span className="text-[12px] leading-5 font-medium text-[var(--ui-accent)]">
          {formatDayLabel(date)}
        </span>
        {/* One transaction needs no total: the row below already says it. */}
        {count > 1 && (
          <span className="ui-chip ui-chip-quiet ui-num px-2 py-0.5 text-[12px] leading-4">
            {fmt(total)}
          </span>
        )}
      </div>
    </div>
  );
}

interface ExpensesViewProps {
  transactions: Transaction[];
  onTransactionClick: (txn: Transaction) => void;
}

export const ExpensesView = memo(function ExpensesView({
  transactions,
  onTransactionClick,
}: ExpensesViewProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => buildRows(transactions), [transactions]);

  const handleTransactionClick = useCallback(
    (txn: Transaction) => {
      onTransactionClick(txn);
    },
    [onTransactionClick],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => rowHeight(rows[index]),
    overscan: OVERSCAN,
  });

  if (transactions.length === 0) {
    return (
      <div className="ui-type mx-auto max-w-6xl px-4 pt-4">
        <div className="ui-panel px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-[var(--ui-ink)]">Nothing recorded yet</p>
          <p className="mx-auto mt-1.5 max-w-[36ch] text-[13px] text-[var(--ui-ink-softer)]">
            Add a transaction, or widen the date range to see older spending.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="ui-type mx-auto max-w-6xl px-4">
      <div
        ref={parentRef}
        className="scrollbar-hide h-[70dvh] overflow-auto"
        style={{ contain: "strict" }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={row.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {row.kind === "header" ? (
                  <DayHeader date={row.date} total={row.total} count={row.count} gap={row.gap} />
                ) : (
                  <TransactionCard
                    transaction={row.txn}
                    onClick={handleTransactionClick}
                    index={virtualRow.index}
                    isLastOfDay={row.isLastOfDay}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
});
