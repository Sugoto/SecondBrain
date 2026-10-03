import {
  useCallback,
  useLayoutEffect,
  useMemo,
  memo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Transaction } from "@/lib/supabase";
import { TransactionCard } from "./TransactionCard";
import { formatDayLabel } from "./constants";
import { getMonthlyAmount } from "./utils";
import { useFormatCurrencyCompact } from "@/hooks/usePrivacy";
import { useVirtualizer } from "@tanstack/react-virtual";

const TXN_HEIGHT = 36;
const HEADER_HEIGHT = 24;
const DAY_GAP = 24;
const OVERSCAN = 8;

type ListRow =
  | { kind: "header"; key: string; date: string; total: number; count: number; gap: boolean }
  | { kind: "txn"; key: string; txn: Transaction; isLastOfDay: boolean };

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
  return HEADER_HEIGHT + (row.gap ? DAY_GAP : 0);
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
    <div
      className="flex h-full items-end justify-between gap-3 border-b border-[var(--ui-edge)] px-1 pb-1"
      style={{ paddingTop: gap ? DAY_GAP : 0 }}
    >
      <span className="text-[12px] leading-5 font-medium text-[var(--ui-accent)]">
        {formatDayLabel(date)}
      </span>
      {count > 1 && (
        <span className="ui-chip ui-chip-quiet ui-num px-2 py-0.5 text-[12px] leading-4">
          {fmt(total)}
        </span>
      )}
    </div>
  );
}

interface ExpensesViewProps {
  transactions: Transaction[];
  onTransactionClick: (txn: Transaction) => void;
  scrollRef: RefObject<HTMLElement | null>;
}

export const ExpensesView = memo(function ExpensesView({
  transactions,
  onTransactionClick,
  scrollRef,
}: ExpensesViewProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  const rows = useMemo(() => buildRows(transactions), [transactions]);

  const handleTransactionClick = useCallback(
    (txn: Transaction) => {
      onTransactionClick(txn);
    },
    [onTransactionClick],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => rowHeight(rows[index]),
    overscan: OVERSCAN,
    scrollMargin,
  });

  const isEmpty = transactions.length === 0;

  useLayoutEffect(() => {
    const list = listRef.current;
    const scroller = scrollRef.current;
    if (!list || !scroller) return;
    const measure = () => {
      const offset =
        list.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop;
      setScrollMargin(Math.round(offset));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [scrollRef, isEmpty]);

  if (transactions.length === 0) {
    return (
      <div className="ui-type mx-auto max-w-6xl px-4 pt-4">
        <div className="ui-panel px-6 py-14 text-center">
          <p className="text-[15px] font-medium text-[var(--ui-ink)]">Nothing recorded yet</p>
          <p className="mx-auto mt-1.5 max-w-[36ch] text-[13px] text-[var(--ui-ink-softer)]">
            Add a transaction, or widen the date range to see older spending.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-type mx-auto max-w-6xl px-4">
      <div
        ref={listRef}
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
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
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
  );
});
