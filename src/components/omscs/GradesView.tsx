import { Award } from "lucide-react";
import { useOmscsData } from "@/hooks/useOmscsData";

export function GradesView() {
  const { completedCourses, cumulativeGPA } = useOmscsData();

  return (
    <div className="p-4 space-y-3">
      <div className="px-4 py-3 rounded-2xl border border-outline-variant bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
              <Award className="h-3.5 w-3.5 text-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-label-m text-muted-foreground">
                Cumulative GPA
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold font-mono text-foreground">
                  {cumulativeGPA.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground">/ 4.0</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-label-m text-muted-foreground">
              Completed
            </p>
            <p className="text-lg font-bold font-mono text-foreground">
              {completedCourses.length}/10
            </p>
          </div>
        </div>

        {completedCourses.length > 0 && (
          <div className="mt-3 grid grid-cols-5 gap-1.5">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="p-1.5 rounded-lg text-center bg-muted border border-border"
              >
                <p className="text-xs font-mono font-bold text-foreground">
                  {course.final_grade}
                </p>
                <p className="text-[8px] truncate text-muted-foreground font-medium">
                  {course.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {completedCourses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-title-s text-foreground">
            Completed Courses
          </h3>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="px-3 py-2 rounded-2xl border border-outline-variant bg-card"
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
                  <span className="inline-flex items-center text-xs font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                    {course.final_grade}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {completedCourses.length === 0 && (
        <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
          <p className="text-xs font-medium text-muted-foreground">
            No completed courses yet.
          </p>
        </div>
      )}
    </div>
  );
}
