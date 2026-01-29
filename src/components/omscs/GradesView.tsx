import { Loader2, Award } from "lucide-react";
import { useOmscsData } from "@/hooks/useOmscsData";

// Unified OMSCS color palette - matches OmscsTracker
const COLORS = {
  bgCard: "#263241",
  bgCardHover: "#2d3a4a",
  bgAccent: "rgba(6, 182, 212, 0.12)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  accent: "#06b6d4",
  border: "rgba(100, 116, 139, 0.25)",
};

export function GradesView() {
  const { completedCourses, cumulativeGPA, loading } = useOmscsData();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: COLORS.accent }} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* GPA Summary Card */}
      <div
        className="px-3 py-2.5 overflow-hidden relative rounded-lg"
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(6, 182, 212, 0.1) 100%)",
              }}
            >
              <Award className="h-4 w-4" style={{ color: COLORS.accent }} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium" style={{ color: COLORS.textSecondary }}>
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono" style={{ color: COLORS.accent }}>
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-[10px]" style={{ color: COLORS.textMuted }}>/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px]" style={{ color: COLORS.textSecondary }}>Completed</p>
            <p className="text-sm font-bold font-mono" style={{ color: COLORS.textPrimary }}>
              {completedCourses.length}/10
            </p>
          </div>
        </div>

        {/* Completed Courses Grid */}
        {completedCourses.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="p-1.5 rounded-md text-center"
                style={{ background: COLORS.bgAccent }}
              >
                <p className="text-[10px] font-mono font-bold" style={{ color: COLORS.accent }}>
                  {course.final_grade}
                </p>
                <p className="text-[8px] truncate" style={{ color: COLORS.textMuted }}>
                  {course.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Completed Courses List */}
      {completedCourses.length > 0 && (
        <div className="space-y-2">
          <h3
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: COLORS.textSecondary }}
          >
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="px-3 py-2 rounded-lg"
              style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate" style={{ color: COLORS.textPrimary }}>
                    {course.code}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: COLORS.textSecondary }}>
                    {course.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>
                    {course.enrolled_semester}
                  </span>
                  <span className="text-sm font-bold font-mono" style={{ color: COLORS.accent }}>
                    {course.final_grade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedCourses.length === 0 && (
        <p className="text-xs text-center py-8" style={{ color: COLORS.textSecondary }}>
          No completed courses yet.
        </p>
      )}
    </div>
  );
}
