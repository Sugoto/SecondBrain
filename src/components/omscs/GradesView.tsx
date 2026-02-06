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
    <div className="p-4 space-y-3">
      {/* GPA Summary Card - Neo-brutalism (compact) */}
      <div className="px-3 py-2 rounded-lg border-[1.5px] border-black dark:border-white bg-pastel-green shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-white dark:bg-white/10 border-[1.5px] border-black dark:border-white flex items-center justify-center shrink-0">
              <Award className="h-3.5 w-3.5 text-black dark:text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-black/70 dark:text-white/70 uppercase">
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-black dark:text-white">
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-[10px] text-black/60 dark:text-white/60">/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-black/70 dark:text-white/70 uppercase">Completed</p>
            <p className="text-lg font-bold font-mono text-black dark:text-white">
              {completedCourses.length}/10
            </p>
          </div>
        </div>

        {/* Completed Courses Grid */}
        {completedCourses.length > 0 && (
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="p-1.5 rounded-md text-center bg-white dark:bg-white/10 border-[1.5px] border-black dark:border-white"
              >
                <p className="text-xs font-mono font-bold text-black dark:text-white">
                  {course.final_grade}
                </p>
                <p className="text-[8px] truncate text-black/60 dark:text-white/60 font-medium">
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
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="px-2.5 py-2 rounded-lg border-[1.5px] border-black dark:border-white bg-card shadow-[1.5px_1.5px_0_#1a1a1a] dark:shadow-[1.5px_1.5px_0_#FFFBF0]"
            >
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-xs truncate text-foreground">
                    {course.code}
                  </p>
                  <p className="text-[10px] truncate text-muted-foreground font-medium">
                    {course.name}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {course.enrolled_semester}
                  </span>
                  <div className="px-1.5 py-0.5 rounded-md bg-pastel-blue border-[1.5px] border-black dark:border-white">
                    <span className="text-xs font-bold font-mono text-black dark:text-white">
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
        <div className="text-center py-6 rounded-lg border-[1.5px] border-dashed border-black/30 dark:border-white/30">
          <p className="text-xs font-medium text-muted-foreground">
            No completed courses yet.
          </p>
        </div>
      )}
    </div>
  );
}
