import { useState } from "react";
import { BookOpen, Plus, Loader2, Check, Trash2, TrendingUp } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOmscsData } from "@/hooks/useOmscsData";
import { toast } from "sonner";

const GRADES = ["A", "B", "C", "D", "F"] as const;

export function SemesterView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const {
    currentCourses,
    availableCourses,
    currentSemester,
    loading,
    enrollCourse,
    unenrollCourse,
    setFinalGrade,
  } = useOmscsData();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGradeDialog, setShowGradeDialog] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    setSaving(true);
    try {
      await enrollCourse(selectedCourse, currentSemester);
      setSelectedCourse("");
      setShowAddDialog(false);
      toast.success("Course enrolled");
    } catch {
      toast.error("Failed to enroll");
    } finally {
      setSaving(false);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    try {
      await unenrollCourse(courseId);
      toast.success("Course removed");
    } catch {
      toast.error("Failed to remove course");
    }
  };

  const handleSetGrade = async () => {
    if (!showGradeDialog || !selectedGrade) return;
    setSaving(true);
    try {
      await setFinalGrade(showGradeDialog, selectedGrade);
      setShowGradeDialog(null);
      setSelectedGrade("");
      toast.success("Grade saved");
    } catch {
      toast.error("Failed to save grade");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Semester Header */}
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
              <TrendingUp className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">
                Current Semester
              </p>
              <span className="text-sm font-bold">{currentSemester}</span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="bg-cyan-500 hover:bg-cyan-600 h-7 text-xs"
            disabled={availableCourses.length === 0}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Current Courses */}
      <div className="space-y-2">
        {currentCourses.map((course) => (
          <Card
            key={course.id}
            className="px-3 py-2 border"
            style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: isDark
                    ? "rgba(6, 182, 212, 0.15)"
                    : "rgba(6, 182, 212, 0.1)",
                }}
              >
                <BookOpen className="h-4 w-4 text-cyan-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">{course.code}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {course.name}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setSelectedGrade("");
                    setShowGradeDialog(course.id);
                  }}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Set final grade"
                >
                  <Check className="h-3.5 w-3.5 text-green-500" />
                </button>
                <button
                  onClick={() => handleUnenroll(course.id)}
                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                  title="Remove course"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {currentCourses.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No courses enrolled for {currentSemester}.
          </p>
        )}
      </div>

      {/* Add Course Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Enroll in Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id} className="text-xs">
                    {course.code}: {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleEnroll}
              disabled={saving || !selectedCourse}
              className="w-full bg-cyan-500 hover:bg-cyan-600 h-8 text-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enroll"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Grade Dialog */}
      <Dialog
        open={showGradeDialog !== null}
        onOpenChange={() => setShowGradeDialog(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">Set Final Grade</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((grade) => (
                  <SelectItem key={grade} value={grade} className="text-xs">
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSetGrade}
              disabled={saving || !selectedGrade}
              className="w-full bg-cyan-500 hover:bg-cyan-600 h-8 text-xs"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Grade"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
