import { useEffect, useMemo, useState } from "react";
import { MONTHS, today } from "@/lib/utils";

interface ScheduleItem {
  title: string;
}

interface ScheduleDay {
  date: string;
  items: ScheduleItem[];
}

const SCHEDULE: ScheduleDay[] = [
  {
    date: "Mon May 25, 2026",
    items: [{ title: "Start-of-Course Survey" }, { title: "Syllabus Comprehension Quiz" }],
  },
  {
    date: "Mon Jun 1, 2026",
    items: [
      { title: "ARC-AGI Milestone A" },
      { title: "ARC-AGI Milestone A (Performance)" },
      { title: "Peer Review: ARC-AGI Milestone A" },
    ],
  },
  {
    date: "Mon Jun 8, 2026",
    items: [
      { title: "Lab 1: Jill Watson" },
      { title: "Tic-Tac-Toe" },
      { title: "Peer Review: Lab 1: Jill Watson" },
    ],
  },
  {
    date: "Mon Jun 15, 2026",
    items: [
      { title: "ARC-AGI Milestone B" },
      { title: "ARC-AGI Milestone B (Performance)" },
      { title: "Quarter-Course Survey" },
      { title: "Peer Review: ARC-AGI Milestone B" },
    ],
  },
  {
    date: "Mon Jun 22, 2026",
    items: [{ title: "Lab 2: SAMI" }, { title: "Peer Review: Lab 2: SAMI" }],
  },
  {
    date: "Mon Jun 29, 2026",
    items: [
      { title: "ARC-AGI Milestone C" },
      { title: "ARC-AGI Milestone C (Performance)" },
      { title: "Exam 1" },
      { title: "Peer Review: ARC-AGI Milestone C" },
    ],
  },
  {
    date: "Thu Jul 2, 2026",
    items: [{ title: "Connect Four Basic" }],
  },
  {
    date: "Mon Jul 6, 2026",
    items: [{ title: "Lab 3: VERA" }, { title: "Peer Review: Lab 3: VERA" }],
  },
  {
    date: "Mon Jul 13, 2026",
    items: [
      { title: "ARC-AGI Milestone D" },
      { title: "ARC-AGI Milestone D (Performance)" },
      { title: "Connect Four Extended" },
      { title: "Mid-Course Survey" },
      { title: "Peer Review: ARC-AGI Milestone D" },
    ],
  },
  {
    date: "Mon Jul 20, 2026",
    items: [{ title: "Lab 4: Ivy" }, { title: "Peer Review: Lab 4: Ivy" }],
  },
  {
    date: "Mon Jul 27, 2026",
    items: [
      { title: "Connect Four Multiplayer" },
      { title: "Final ARC-AGI Project" },
      { title: "Final ARC-AGI Project (Performance)" },
      { title: "Peer Review: Final ARC-AGI Project" },
    ],
  },
  {
    date: "Mon Aug 3, 2026",
    items: [
      { title: "Connect Four Hidden Multiplayer" },
      { title: "Exam 2" },
      { title: "Lab 5: A4L" },
      { title: "Peer Review: Lab 5: A4L" },
    ],
  },
  {
    date: "Sat Aug 8, 2026",
    items: [{ title: "End-of-Course Survey" }],
  },
];

const UNDATED_ITEMS: ScheduleItem[] = [
  { title: "Class Participation" },
  { title: "Exam 1 Notes Upload" },
  { title: "Exam 2 Notes Upload" },
  { title: "Honorlock Onboarding Exam" },
];

const STORAGE_KEY = "omscs-semester-done";

function parseDate(s: string) {
  const match = s.match(/^\w+ (\w+) (\d+), (\d+)$/);
  if (!match) return Temporal.PlainDate.from({ year: 1970, month: 1, day: 1 });
  const [, month, day, year] = match;
  return Temporal.PlainDate.from({
    year: Number(year),
    month: MONTHS.indexOf(month) + 1,
    day: Number(day),
  });
}

function loadDone(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function SemesterView() {
  const [done, setDone] = useState<Set<string>>(loadDone);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(done)));
  }, [done]);

  const toggle = (key: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const activeDate = useMemo(() => {
    const upcoming = SCHEDULE.find(
      (d) => Temporal.PlainDate.compare(parseDate(d.date), today()) >= 0,
    );
    return upcoming?.date ?? null;
  }, []);

  return (
    <div>
      {SCHEDULE.map((day, dayIdx) => {
        const isActive = day.date === activeDate;
        return (
          <section
            key={day.date}
            className={`px-6 pt-6 pb-6 transition-opacity ${
              dayIdx === 0 ? "" : "border-t border-foreground/30"
            } ${isActive ? "" : "opacity-40"}`}
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
              {day.date}
            </p>
            <div>
              {day.items.map((item, i) => {
                const key = `${day.date}-${i}`;
                return (
                  <ScheduleRow
                    key={key}
                    title={item.title}
                    isDone={done.has(key)}
                    isLast={i === day.items.length - 1}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="px-6 pt-6 pb-10 border-t border-foreground/30 opacity-40">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
          No due date
        </p>
        <div>
          {UNDATED_ITEMS.map((item, i) => {
            const key = `undated-${i}`;
            return (
              <ScheduleRow
                key={key}
                title={item.title}
                isDone={done.has(key)}
                isLast={i === UNDATED_ITEMS.length - 1}
                onToggle={() => toggle(key)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ScheduleRow({
  title,
  isDone,
  isLast,
  onToggle,
}: {
  title: string;
  isDone: boolean;
  isLast: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left flex items-baseline gap-3 py-2 transition-colors active:bg-surface-container-low/40 ${
        isLast ? "" : "border-b border-foreground/15"
      }`}
    >
      <p
        className={`flex-1 text-[13px] transition-colors ${
          isDone ? "line-through text-muted-foreground/60" : "text-foreground"
        }`}
      >
        {title}
      </p>
    </button>
  );
}
