import { Loader2, Award } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { useOmscsData } from "@/hooks/useOmscsData";

export function GradesView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { completedCourses, cumulativeGPA, loading } = useOmscsData();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* GPA Summary Card */}
      <Card
        className="px-3 py-2.5 overflow-hidden relative border"
        style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.15) 100%)"
                  : "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)",
              }}
            >
              <Award className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-cyan-500">
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Completed</p>
            <p className="text-sm font-bold font-mono">
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
                style={{
                  background: isDark
                    ? "rgba(6, 182, 212, 0.1)"
                    : "rgba(6, 182, 212, 0.08)",
                }}
              >
                <p className="text-[10px] font-mono font-bold text-cyan-500">
                  {course.final_grade}
                </p>
                <p className="text-[8px] text-muted-foreground truncate">
                  {course.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* All Completed Courses List */}
      {completedCourses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <Card
              key={course.id}
              className="px-3 py-2 border"
              style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate">{course.code}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {course.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {course.enrolled_semester}
                  </span>
                  <span className="text-sm font-bold font-mono text-cyan-500">
                    {course.final_grade}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {completedCourses.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">
          No completed courses yet.
        </p>
      )}
    </div>
  );
}
