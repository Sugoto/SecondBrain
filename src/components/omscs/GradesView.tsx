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
    <div className="p-5 space-y-5">
      {/* GPA Summary Card - Neo-brutalism */}
      <div className="px-4 py-3 rounded-xl border-2 border-black dark:border-white bg-pastel-green shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white dark:bg-white/10 border-2 border-black dark:border-white flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-black dark:text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-black/70 dark:text-white/70 uppercase">
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-black dark:text-white">
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-xs text-black/60 dark:text-white/60">/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-black/70 dark:text-white/70 uppercase">Completed</p>
            <p className="text-xl font-bold font-mono text-black dark:text-white">
              {completedCourses.length}/10
            </p>
          </div>
        </div>

        {/* Completed Courses Grid */}
        {completedCourses.length > 0 && (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="p-2 rounded-lg text-center bg-white dark:bg-white/10 border-2 border-black dark:border-white"
              >
                <p className="text-sm font-mono font-bold text-black dark:text-white">
                  {course.final_grade}
                </p>
                <p className="text-[9px] truncate text-black/60 dark:text-white/60 font-medium">
                  {course.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Completed Courses List */}
      {completedCourses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="px-4 py-3 rounded-xl border-2 border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate text-foreground">
                    {course.code}
                  </p>
                  <p className="text-xs truncate text-muted-foreground font-medium">
                    {course.name}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-medium text-muted-foreground">
                    {course.enrolled_semester}
                  </span>
                  <div className="px-2 py-1 rounded-lg bg-pastel-blue border-2 border-black dark:border-white">
                    <span className="text-sm font-bold font-mono text-black dark:text-white">
                      {course.final_grade}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedCourses.length === 0 && (
        <div className="text-center py-8 rounded-xl border-2 border-dashed border-black/30 dark:border-white/30">
          <p className="text-sm font-medium text-muted-foreground">
            No completed courses yet.
          </p>
        </div>
      )}
    </div>
  );
}
