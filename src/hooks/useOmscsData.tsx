import { useMemo } from "react";
import { useLiveQuery } from "@tanstack/react-db";
import { omscsCoursesCollection } from "@/lib/collections";
import { today } from "@/lib/utils";
import type { OmscsCourse } from "@/lib/supabase";

// Calculate current semester based on date
function getCurrentSemester(): string {
  const { month, year } = today();

  if (month >= 1 && month <= 4) return `Spring ${year}`;
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

// GPA calculation
const GRADE_POINTS: Record<string, number> = {
  A: 4.0,
  B: 3.0,
  C: 2.0,
  D: 1.0,
  F: 0.0,
};

function calculateGPA(grades: string[]): number {
  const valid = grades.filter((g) => g in GRADE_POINTS);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, g) => sum + GRADE_POINTS[g], 0) / valid.length;
}

type CourseUpdates = {
  code?: string;
  name?: string;
  enrolled_semester?: string | null;
  final_grade?: string | null;
  details?: Record<string, unknown> | null;
};

export function useOmscsData() {
  const { data, isLoading, isError } = useLiveQuery((q) =>
    q.from({ c: omscsCoursesCollection }).orderBy(({ c }) => c.code),
  );
  const courses: OmscsCourse[] = data;

  const currentSemester = getCurrentSemester();

  const enrolledCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester !== null),
    [courses],
  );

  const currentCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester === currentSemester && !c.final_grade),
    [courses, currentSemester],
  );

  const completedCourses = useMemo(() => courses.filter((c) => c.final_grade !== null), [courses]);

  const availableCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester === null),
    [courses],
  );

  const cumulativeGPA = useMemo(
    () => calculateGPA(completedCourses.map((c) => c.final_grade!)),
    [completedCourses],
  );

  const updateCourse = (courseId: string, updates: CourseUpdates) =>
    omscsCoursesCollection.update(courseId, (draft) => {
      Object.assign(draft, updates);
    }).isPersisted.promise;

  const addCourse = async (course: {
    code: string;
    name: string;
    enrolled_semester?: string | null;
    final_grade?: string | null;
    details?: Record<string, unknown>;
  }) => {
    const created: OmscsCourse = {
      id: crypto.randomUUID(),
      code: course.code,
      name: course.name,
      enrolled_semester: course.enrolled_semester ?? null,
      final_grade: course.final_grade ?? null,
      details: course.details ?? null,
      created_at: new Date().toISOString(),
    };
    await omscsCoursesCollection.insert(created).isPersisted.promise;
    return created;
  };

  return {
    courses,
    enrolledCourses,
    currentCourses,
    completedCourses,
    availableCourses,
    currentSemester,
    cumulativeGPA,
    loading: isLoading && courses.length === 0,
    error: isError ? (omscsCoursesCollection.utils.lastError as Error) : null,
    refetch: () => omscsCoursesCollection.utils.refetch(),
    enrollCourse: (courseId: string, semester: string) =>
      updateCourse(courseId, { enrolled_semester: semester }),
    unenrollCourse: (courseId: string) =>
      updateCourse(courseId, { enrolled_semester: null, final_grade: null }),
    setFinalGrade: (courseId: string, grade: string) =>
      updateCourse(courseId, { final_grade: grade }),
    addCourse,
    updateCourse,
    deleteCourse: (courseId: string) => omscsCoursesCollection.delete(courseId).isPersisted.promise,
  };
}
