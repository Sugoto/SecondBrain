import { Loader2, Award } from "lucide-react";
import { useOmscsData } from "@/hooks/useOmscsData";

export function GradesView() {
  const { completedCourses, cumulativeGPA, loading } = useOmscsData();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* GPA Summary Card */}
      <div className="px-3 py-2.5 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Award className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground">
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-mono text-foreground">
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">Completed</p>
            <p className="text-sm font-bold font-mono text-foreground">
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
                className="p-1.5 rounded-md text-center bg-muted"
              >
                <p className="text-[10px] font-mono font-bold text-foreground">
                  {course.final_grade}
                </p>
                <p className="text-[8px] truncate text-muted-foreground">
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
          <h3 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="px-3 py-2 rounded-lg border border-border bg-card"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-xs truncate text-foreground">
                    {course.code}
                  </p>
                  <p className="text-[10px] truncate text-muted-foreground">
                    {course.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">
                    {course.enrolled_semester}
                  </span>
                  <span className="text-sm font-bold font-mono text-foreground">
                    {course.final_grade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedCourses.length === 0 && (
        <p className="text-xs text-center py-8 text-muted-foreground">
          No completed courses yet.
        </p>
      )}
    </div>
  );
}
