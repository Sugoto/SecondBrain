import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useOmscsData } from "@/hooks/useOmscsData";
import type { OmscsCourse } from "@/lib/supabase";
import { CourseDialog, statusOf } from "./CourseDialog";

const TERM_ORDER: Record<string, number> = { Spring: 0, Summer: 1, Fall: 2 };

function semesterRank(value: string | null): number {
  if (!value) return -Infinity;
  const match = value.match(/^(Spring|Summer|Fall)\s+(\d{4})$/);
  if (!match) return -Infinity;
  const [, term, year] = match;
  return parseInt(year, 10) * 10 + (TERM_ORDER[term] ?? 0);
}

function sortCourses(list: OmscsCourse[]): OmscsCourse[] {
  return [...list].sort((a, b) => {
    const rankDiff = semesterRank(b.enrolled_semester) - semesterRank(a.enrolled_semester);
    if (rankDiff !== 0) return rankDiff;
    return a.code.localeCompare(b.code);
  });
}

export function GradesView() {
  const {
    courses,
    completedCourses,
    cumulativeGPA,
    currentSemester,
    addCourse,
    updateCourse,
    deleteCourse,
  } = useOmscsData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OmscsCourse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (course: OmscsCourse) => {
    setEditing(course);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (values: {
    code: string;
    name: string;
    enrolled_semester: string | null;
    final_grade: string | null;
  }) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateCourse(editing.id, values);
      } else {
        await addCourse(values);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to save course:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editing) return;
    setSubmitting(true);
    try {
      await deleteCourse(editing.id);
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to delete course:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const pursuingCourses = useMemo(
    () => sortCourses(courses.filter((c) => statusOf(c) === "pursuing")),
    [courses],
  );
  const plannedCourses = useMemo(
    () => sortCourses(courses.filter((c) => statusOf(c) === "planned")),
    [courses],
  );
  const doneCourses = useMemo(() => sortCourses(completedCourses), [completedCourses]);

  return (
    <div>
      <section className="px-6 pt-6 pb-8">
        <div className="grid grid-cols-2 divide-x divide-outline-variant/60 pb-2">
          <div className="pr-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Cumulative GPA
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums tracking-[-0.03em] text-foreground text-[44px] leading-none">
                {(Math.floor(cumulativeGPA * 100) / 100).toFixed(2)}
              </span>
              <span className="text-[11px] text-muted-foreground/70">/ 4.0</span>
            </div>
          </div>
          <div className="pl-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Completed
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono tabular-nums tracking-[-0.03em] text-foreground text-[44px] leading-none">
                {doneCourses.length}
              </span>
              <span className="text-[11px] text-muted-foreground/70">/ 10</span>
            </div>
          </div>
        </div>
      </section>

      <CourseSection
        label="Pursuing"
        courses={pursuingCourses}
        onCourseClick={openEdit}
        emptyText="No courses in progress."
      />

      <CourseSection
        label="Planned"
        courses={plannedCourses}
        onCourseClick={openEdit}
        emptyText="No planned courses."
      />

      <CourseSection
        label="Completed"
        courses={doneCourses}
        onCourseClick={openEdit}
        emptyText="No completed courses yet."
      />

      <div className="px-6 py-6 border-t border-foreground/30">
        <button
          type="button"
          onClick={openAdd}
          className="w-full h-11 rounded-lg border border-outline-variant flex items-center justify-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add course
        </button>
      </div>

      <CourseDialog
        open={dialogOpen}
        initial={editing}
        currentSemester={currentSemester}
        onClose={closeDialog}
        onSubmit={handleSubmit}
        onDelete={editing ? handleDelete : undefined}
        isSubmitting={submitting}
      />
    </div>
  );
}

interface CourseSectionProps {
  label: string;
  courses: OmscsCourse[];
  onCourseClick: (c: OmscsCourse) => void;
  emptyText: string;
}

function CourseSection({
  label,
  courses,
  onCourseClick,
  emptyText,
}: CourseSectionProps) {
  return (
    <section className="px-6 pt-7 pb-8 border-t border-foreground/30">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-4">
        {label}
        <span className="ml-2 font-mono tabular-nums text-muted-foreground/60">
          {courses.length}
        </span>
      </p>
      {courses.length === 0 ? (
        <p className="text-[12px] text-muted-foreground/70 py-2">{emptyText}</p>
      ) : (
        <div>
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => onCourseClick(course)}
              className="w-full flex items-center justify-between gap-4 py-3 text-left border-b border-foreground/15 last:border-b-0 hover:bg-surface-container-low/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono tabular-nums text-[13px] text-foreground truncate">
                  {course.code}
                </p>
                <p className="text-[11px] text-muted-foreground/70 truncate">
                  {course.name}
                </p>
                {course.enrolled_semester && (
                  <p className="font-mono tabular-nums text-[10px] uppercase tracking-wider text-muted-foreground/80 mt-1">
                    {course.enrolled_semester}
                  </p>
                )}
              </div>
              {course.final_grade && (
                <span className="font-mono tabular-nums text-[14px] text-foreground shrink-0">
                  {course.final_grade}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
