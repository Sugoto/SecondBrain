import { useState, useMemo, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { RoughNotation } from "react-rough-notation";

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
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
      return <ChevronUp className="h-2.5 w-2.5 opacity-30" />;
    }
    return sortDirection === "asc" 
      ? <ChevronUp className="h-2.5 w-2.5 text-cyan-400" />
      : <ChevronDown className="h-2.5 w-2.5 text-cyan-400" />;
  };

  const getRowId = (assignment: Assignment) => `${assignment.code}-${assignment.name}`;

  return (
    <div className="p-3 space-y-3">
      {/* Timetable - RPG Scroll Style */}
      <div
        className="rounded-lg overflow-hidden relative"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(18, 28, 32, 0.98) 0%, rgba(12, 20, 24, 0.99) 100%)"
            : "linear-gradient(180deg, rgba(236, 254, 255, 0.98) 0%, rgba(207, 250, 254, 0.99) 100%)",
          border: isDark ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(8, 145, 178, 0.25)",
          boxShadow: isDark
            ? "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.03)"
            : "0 8px 32px rgba(6, 182, 212, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        {/* Table Header */}
        <div
          className="grid grid-cols-[1fr_52px_52px] gap-1.5 px-3 py-2 text-[9px] font-bold uppercase tracking-wider items-center"
          style={{
            background: isDark
              ? "linear-gradient(180deg, rgba(6, 182, 212, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)"
              : "linear-gradient(180deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.06) 100%)",
            borderBottom: isDark ? "1px solid rgba(6, 182, 212, 0.2)" : "1px solid rgba(8, 145, 178, 0.2)",
            color: isDark ? "#67e8f9" : "#0891b2",
          }}
        >
          <button
            onClick={() => handleSort("name")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left"
          >
            <span>Course</span>
            <SortIcon columnKey="name" />
          </button>
          <button
            onClick={() => handleSort("startDate")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left"
          >
            <span>Start</span>
            <SortIcon columnKey="startDate" />
          </button>
          <button
            onClick={() => handleSort("endDate")}
            className="flex items-center gap-0.5 hover:opacity-80 transition-opacity text-left"
          >
            <span>End</span>
            <SortIcon columnKey="endDate" />
          </button>
        </div>

        {/* Table Body */}
        <div>
          {sortedAssignments.map((assignment, idx) => {
            const rowId = getRowId(assignment);
            const isCompleted = completedAssignments.has(rowId);
            const dateStatus = getDateStatus(assignment.startDate, assignment.endDate);
            const isActive = dateStatus === "active";
            const isDimmed = dateStatus !== "active";

            // Calculate row background
            const getRowBackground = () => {
              if (isActive) {
                // Subtle highlight for active rows
                return isDark 
                  ? "rgba(6, 182, 212, 0.08)" 
                  : "rgba(6, 182, 212, 0.06)";
              }
              // Alternating background for inactive rows
              return idx % 2 === 0
                ? "transparent"
                : isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";
            };

            // Get text color based on status
            const getNameColor = () => {
              if (isCompleted) return isDark ? "#64748b" : "#94a3b8";
              if (isDimmed) return isDark ? "#64748b" : "#9ca3af";
              return isDark ? "#e2e8f0" : "#1e293b";
            };

            const getDateColor = () => {
              if (isCompleted) return isDark ? "#475569" : "#cbd5e1";
              if (isDimmed) return isDark ? "#475569" : "#9ca3af";
              return isDark ? "#94a3b8" : "#64748b";
            };

            return (
              <div 
                key={rowId} 
                onClick={() => toggleCompleted(rowId)}
                className="grid grid-cols-[1fr_52px_52px] gap-1.5 px-3 py-2 text-[10px] transition-colors items-center cursor-pointer active:opacity-80"
                style={{ 
                  opacity: isDimmed && !isCompleted ? 0.6 : 1,
                  background: getRowBackground(),
                  borderBottom: isDark ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.05)",
                  borderLeft: isActive && !isCompleted
                    ? isDark ? "2px solid rgba(6, 182, 212, 0.6)" : "2px solid rgba(8, 145, 178, 0.5)"
                    : "2px solid transparent",
                }}
              >
                {/* Assignment Name with strikethrough */}
                <div className="min-w-0">
                  <RoughNotation
                    type="strike-through"
                    show={isCompleted}
                    color="#10b981"
                    strokeWidth={2}
                    iterations={1}
                    animationDuration={400}
                  >
                    <span
                      className="truncate font-medium block"
                      style={{ color: getNameColor() }}
                      title={assignment.name}
                    >
                      {assignment.name}
                    </span>
                  </RoughNotation>
                </div>

                {/* Start Date */}
                <span
                  className="text-[9px] font-mono"
                  style={{ color: getDateColor() }}
                >
                  {assignment.startDate}
                </span>

                {/* End Date */}
                <span
                  className="text-[9px] font-mono"
                  style={{ color: getDateColor() }}
                >
                  {assignment.endDate}
                </span>
              </div>
            );
          })}
        </div>

        {/* Decorative bottom flourish */}
        <div
          className="h-1"
          style={{
            background: isDark
              ? "linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.3) 50%, transparent 100%)"
              : "linear-gradient(90deg, transparent 0%, rgba(8, 145, 178, 0.2) 50%, transparent 100%)",
          }}
        />
      </div>
    </div>
  );
}
