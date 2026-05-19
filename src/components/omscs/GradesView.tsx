import { useOmscsData } from "@/hooks/useOmscsData";

export function GradesView() {
  const { completedCourses, cumulativeGPA } = useOmscsData();

  return (
    <div>
      <section className="px-6 pt-6 pb-8">
        <div className="grid grid-cols-2 divide-x divide-outline-variant/60 border-b border-outline-variant/60 pb-6">
          <div className="pr-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              Cumulative GPA
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums tracking-[-0.03em] text-foreground text-[44px] leading-none">
                {cumulativeGPA.toFixed(2)}
              </span>
              <span className="text-[11px] text-muted-foreground/70">/ 4.0</span>
            </div>
          </div>
          <div className="pl-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
              Completed
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums tracking-[-0.03em] text-foreground text-[44px] leading-none">
                {completedCourses.length}
              </span>
              <span className="text-[11px] text-muted-foreground/70">/ 10</span>
            </div>
          </div>
        </div>

        {completedCourses.length > 0 && (
          <div className="grid grid-cols-5 mt-6">
            {completedCourses.map((course, i) => (
              <div
                key={course.id}
                className={`flex flex-col items-start gap-1 px-2 py-2 ${
                  i > 0 ? "border-l border-outline-variant/60" : ""
                }`}
              >
                <p className="font-mono tabular-nums text-[14px] text-foreground leading-none">
                  {course.final_grade}
                </p>
                <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 truncate">
                  {course.code}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {completedCourses.length > 0 ? (
        <section className="px-6 pt-7 pb-8 border-t border-outline-variant">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-4">
            Course history
          </p>
          {completedCourses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/60 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-foreground truncate">
                  {course.code}
                </p>
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  {course.name}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono tabular-nums text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {course.enrolled_semester}
                </span>
                <span className="font-mono tabular-nums text-[14px] text-foreground">
                  {course.final_grade}
                </span>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="px-6 pt-12 pb-8 text-center border-t border-outline-variant">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            No history
          </p>
          <p className="text-[13px] text-muted-foreground/70">
            No completed courses yet.
          </p>
        </section>
      )}
    </div>
  );
}
