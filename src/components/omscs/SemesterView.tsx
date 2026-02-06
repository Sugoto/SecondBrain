import { useState, useMemo, useEffect } from "react";
import { ChevronUp, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Assignment data
interface Assignment {
  code: string;
  name: string;
  startDate: string;
  endDate: string;
}

const ASSIGNMENTS: Assignment[] = [
  { code: "CS 6035", name: "Man in the Middle (Parts 1 & 2)", startDate: "Jan 16", endDate: "Jan 25" },
  { code: "CS 6310", name: "Quiz #1: Honor Code & Plagiarism", startDate: "Jan 12", endDate: "Jan 26" },
  { code: "CS 6035", name: "Machine Learning in Cybersecurity", startDate: "Jan 23", endDate: "Feb 8" },
  { code: "CS 6310", name: "Assignment #1: Project Analysis & Design", startDate: "Jan 26", endDate: "Feb 16" },
  { code: "CS 6310", name: "Self- & Team-Feedback for A1", startDate: "Feb 13", endDate: "Feb 20" },
  { code: "CS 6035", name: "Binary Exploitation", startDate: "Feb 8", endDate: "Feb 22" },
  { code: "CS 6310", name: "Assignment #2: Design Peer Review", startDate: "Feb 18", endDate: "Mar 2" },
  { code: "CS 6035", name: "Cryptography", startDate: "Feb 21", endDate: "Mar 8" },
  { code: "CS 6310", name: "Quizzes 2, 3, 4 (SWEBOK, UML, Arch)", startDate: "Jan 26", endDate: "Mar 9" },
  { code: "CS 6035", name: "API Security", startDate: "Mar 6", endDate: "Mar 15" },
  { code: "CS 6035", name: "Web Security", startDate: "Mar 14", endDate: "Mar 22" },
  { code: "CS 6310", name: "Exam #1 [Mandatory]", startDate: "Mar 9", endDate: "Mar 23" },
  { code: "CS 6035", name: "Log4Shell", startDate: "Mar 22", endDate: "Apr 5" },
  { code: "CS 6035", name: "Database Security", startDate: "Apr 4", endDate: "Apr 19" },
  { code: "CS 6310", name: "Exam #2 [Optional]", startDate: "Apr 6", endDate: "Apr 20" },
  { code: "CS 6310", name: "Quizzes 5, 6, 7 (Patterns, Principles, Foundations)", startDate: "Mar 9", endDate: "Apr 20" },
  { code: "CS 6310", name: "Practice Quizzes (P1L1 - P4L6)", startDate: "Jan 12", endDate: "Apr 20" },
  { code: "CS 6035", name: "Malware Analysis (Phase I & II)", startDate: "Apr 18", endDate: "Apr 26" },
  { code: "CS 6310", name: "Assignment #3: Iterative Implementation", startDate: "Mar 16", endDate: "Apr 27" },
  { code: "CS 6310", name: "Self- & Team-Feedback for A3", startDate: "Apr 24", endDate: "May 1" },
  { code: "CS 6310", name: "Supporting Your Team's Project Efforts", startDate: "May 4", endDate: "May 4" },
];

type SortKey = "name" | "startDate" | "endDate";
type SortDirection = "asc" | "desc";

// Parse date for sorting
function parseDate(dateStr: string): Date {
  const [month, day] = dateStr.split(" ");
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  return new Date(2026, monthMap[month], parseInt(day));
}

type DateStatus = "past" | "active" | "future";

// Get status of assignment relative to today
function getDateStatus(startDate: string, endDate: string): DateStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (end < today) return "past";
  if (start > today) return "future";
  return "active";
}

const STORAGE_KEY = "semester-completed-assignments";

export function SemesterView() {
  const [sortKey, setSortKey] = useState<SortKey>("endDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Load completed assignments from localStorage
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    try {
      return new Set(JSON.parse(stored));
    } catch {
      return new Set();
    }
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedAssignments)));
  }, [completedAssignments]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const toggleCompleted = (id: string) => {
    setCompletedAssignments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sortedAssignments = useMemo(() => {
    return [...ASSIGNMENTS].sort((a, b) => {
      let comparison = 0;

      switch (sortKey) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "startDate":
          comparison = parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime();
          break;
        case "endDate":
          comparison = parseDate(a.endDate).getTime() - parseDate(b.endDate).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [sortKey, sortDirection]);

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ChevronUp className="h-2.5 w-2.5 opacity-30 text-muted-foreground" />;
    }
    return sortDirection === "asc"
      ? <ChevronUp className="h-2.5 w-2.5 text-foreground" />
      : <ChevronDown className="h-2.5 w-2.5 text-foreground" />;
  };

  const getRowId = (assignment: Assignment) => `${assignment.code}-${assignment.name}`;

  return (
    <div className="p-3 space-y-3">
      {/* Timetable - Neo-brutalism (compact) */}
      <div className="rounded-lg overflow-hidden border-[1.5px] border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_44px_44px] gap-1.5 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wider items-center border-b-[1.5px] border-black dark:border-white bg-pastel-blue">
          <button
            onClick={() => handleSort("name")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left text-black dark:text-white"
          >
            <span>Course</span>
            <SortIcon columnKey="name" />
          </button>
          <button
            onClick={() => handleSort("startDate")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left text-black dark:text-white"
          >
            <span>Start</span>
            <SortIcon columnKey="startDate" />
          </button>
          <button
            onClick={() => handleSort("endDate")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left text-black dark:text-white"
          >
            <span>End</span>
            <SortIcon columnKey="endDate" />
          </button>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-black/10 dark:divide-white/10">
          {sortedAssignments.map((assignment) => {
            const rowId = getRowId(assignment);
            const isCompleted = completedAssignments.has(rowId);
            const dateStatus = getDateStatus(assignment.startDate, assignment.endDate);
            const isActive = dateStatus === "active";
            const isDimmed = dateStatus !== "active";

            return (
              <div
                key={rowId}
                onClick={() => toggleCompleted(rowId)}
                className={cn(
                  "grid grid-cols-[1fr_44px_44px] gap-1.5 px-2.5 py-1.5 text-[10px] transition-colors items-center cursor-pointer",
                  "hover:bg-pastel-yellow/50 active:bg-pastel-yellow",
                  isActive && !isCompleted && "bg-pastel-green/30",
                  isDimmed && "opacity-50"
                )}
              >
                {/* Assignment Name with checkbox */}
                <div className="min-w-0 flex items-center gap-2">
                  <div
                    className={cn(
                      "h-4 w-4 rounded flex items-center justify-center shrink-0 transition-colors border-[1.5px]",
                      isCompleted
                        ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                        : "border-black/30 dark:border-white/30 bg-white dark:bg-white/10"
                    )}
                  >
                    {isCompleted && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <span
                    className={cn(
                      "truncate font-bold",
                      isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                    )}
                    title={assignment.name}
                  >
                    {assignment.name}
                  </span>
                </div>

                {/* Start Date */}
                <span className={cn(
                  "text-[9px] font-mono font-medium",
                  isCompleted ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {assignment.startDate}
                </span>

                {/* End Date */}
                <span className={cn(
                  "text-[9px] font-mono font-medium",
                  isCompleted ? "text-muted-foreground" : "text-muted-foreground"
                )}>
                  {assignment.endDate}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
