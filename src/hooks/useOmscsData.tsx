import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { OmscsCourse } from "@/lib/supabase";

// Calculate current semester based on date
export function getCurrentSemester(): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 1 && month <= 4) return `Spring ${year}`;
  if (month >= 5 && month <= 7) return `Summer ${year}`;
  return `Fall ${year}`;
}

// GPA calculation
const GRADE_POINTS: Record<string, number> = {
  A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0,
};

export function calculateGPA(grades: string[]): number {
  const valid = grades.filter((g) => g in GRADE_POINTS);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, g) => sum + GRADE_POINTS[g], 0) / valid.length;
}

export function useOmscsData() {
  const [courses, setCourses] = useState<OmscsCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch courses from Supabase
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("omscs_courses")
        .select("*")
        .order("code");

      if (fetchError) throw fetchError;
      setCourses(data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch OMSCS courses:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const currentSemester = getCurrentSemester();

  // Enrolled courses (have enrolled_semester set)
  const enrolledCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester !== null),
    [courses]
  );

  // Current semester courses (enrolled this semester, no final grade yet)
  const currentCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester === currentSemester && !c.final_grade),
    [courses, currentSemester]
  );

  // Completed courses (have final grade)
  const completedCourses = useMemo(
    () => courses.filter((c) => c.final_grade !== null),
    [courses]
  );

  // Not enrolled courses
  const availableCourses = useMemo(
    () => courses.filter((c) => c.enrolled_semester === null),
    [courses]
  );

  // Cumulative GPA
  const cumulativeGPA = useMemo(
    () => calculateGPA(completedCourses.map((c) => c.final_grade!)),
    [completedCourses]
  );

  // Enroll in a course
  const enrollCourse = useCallback(async (courseId: string, semester: string) => {
    const { error: updateError } = await supabase
      .from("omscs_courses")
      .update({ enrolled_semester: semester })
      .eq("id", courseId);

    if (updateError) throw updateError;

    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, enrolled_semester: semester } : c))
    );
  }, []);

  // Unenroll from a course
  const unenrollCourse = useCallback(async (courseId: string) => {
    const { error: updateError } = await supabase
      .from("omscs_courses")
      .update({ enrolled_semester: null, final_grade: null })
      .eq("id", courseId);

    if (updateError) throw updateError;

    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, enrolled_semester: null, final_grade: null } : c
      )
    );
  }, []);

  // Set final grade (marks course as completed)
  const setFinalGrade = useCallback(async (courseId: string, grade: string) => {
    const { error: updateError } = await supabase
      .from("omscs_courses")
      .update({ final_grade: grade })
      .eq("id", courseId);

    if (updateError) throw updateError;

    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, final_grade: grade } : c))
    );
  }, []);

  // Add a new course
  const addCourse = useCallback(
    async (course: { code: string; name: string; details?: Record<string, unknown> }) => {
      const { data, error: insertError } = await supabase
        .from("omscs_courses")
        .insert({
          code: course.code,
          name: course.name,
          details: course.details || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setCourses((prev) => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)));
      }
      return data;
    },
    []
  );

  // Update a course
  const updateCourse = useCallback(
    async (courseId: string, updates: { code?: string; name?: string; details?: Record<string, unknown> | null }) => {
      const { error: updateError } = await supabase
        .from("omscs_courses")
        .update(updates)
        .eq("id", courseId);

      if (updateError) throw updateError;

      setCourses((prev) =>
        prev
          .map((c) => (c.id === courseId ? { ...c, ...updates } : c))
          .sort((a, b) => a.code.localeCompare(b.code))
      );
    },
    []
  );

  // Delete a course
  const deleteCourse = useCallback(async (courseId: string) => {
    const { error: deleteError } = await supabase
      .from("omscs_courses")
      .delete()
      .eq("id", courseId);

    if (deleteError) throw deleteError;

    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  }, []);

  return {
    courses,
    enrolledCourses,
    currentCourses,
    completedCourses,
    availableCourses,
    currentSemester,
    cumulativeGPA,
    loading,
    error,
    refetch: fetchCourses,
    enrollCourse,
    unenrollCourse,
    setFinalGrade,
    addCourse,
    updateCourse,
    deleteCourse,
  };
}
