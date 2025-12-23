import { useState } from "react";
import {
  Loader2,
  Plus,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOmscsData } from "@/hooks/useOmscsData";
import { toast } from "sonner";
import type { OmscsCourse, OmscsCourseDetails } from "@/lib/supabase";

interface CourseCardProps {
  course: OmscsCourse;
  isDark: boolean;
  onEdit: (course: OmscsCourse) => void;
  onDelete: (course: OmscsCourse) => void;
}

function CourseCard({ course, isDark, onEdit, onDelete }: CourseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const details = course.details as OmscsCourseDetails | null;
  const hasDetails =
    details &&
    (details.analysis || details.pros?.length || details.cons?.length);

  return (
    <Card
      className="border overflow-hidden py-1"
      style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2"
      >
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-xs">{course.code}</p>
              {course.enrolled_semester && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: course.final_grade
                      ? isDark
                        ? "rgba(6, 182, 212, 0.2)"
                        : "rgba(6, 182, 212, 0.1)"
                      : isDark
                      ? "rgba(245, 158, 11, 0.2)"
                      : "rgba(245, 158, 11, 0.1)",
                    color: course.final_grade ? "#06b6d4" : "#f59e0b",
                  }}
                >
                  {course.final_grade || "In Progress"}
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">
              {course.name}
            </p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-3 pb-3 pt-2 space-y-2 border-t"
              style={{ borderColor: "rgba(128, 128, 128, 0.1)" }}
            >
              {/* Details section - only if has details */}
              {hasDetails && (
                <div className="space-y-2">
                  {/* Analysis */}
                  {details.analysis && (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium">
                        Analysis
                      </p>
                      <p className="text-[10px] text-foreground/80">
                        {details.analysis}
                      </p>
                    </div>
                  )}

                  {/* Pros */}
                  {details.pros && details.pros.length > 0 && (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium flex items-center gap-1">
                        <ThumbsUp className="h-2.5 w-2.5 text-green-500" /> Pros
                      </p>
                      <ul className="space-y-0.5">
                        {details.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-[10px] text-foreground/80 flex items-start gap-1"
                          >
                            <span className="text-green-500">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {details.cons && details.cons.length > 0 && (
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5 font-medium flex items-center gap-1">
                        <ThumbsDown className="h-2.5 w-2.5 text-red-500" /> Cons
                      </p>
                      <ul className="space-y-0.5">
                        {details.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-[10px] text-foreground/80 flex items-start gap-1"
                          >
                            <span className="text-red-500">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

interface CourseFormData {
  code: string;
  name: string;
  analysis: string;
  pros: string;
  cons: string;
}

function getFormDataFromCourse(course: OmscsCourse | null): CourseFormData {
  if (!course) {
    return { code: "", name: "", analysis: "", pros: "", cons: "" };
  }
  const details = course.details as OmscsCourseDetails | null;
  return {
    code: course.code,
    name: course.name,
    analysis: details?.analysis || "",
    pros: details?.pros?.join("\n") || "",
    cons: details?.cons?.join("\n") || "",
  };
}

function buildDetailsFromForm(form: CourseFormData): OmscsCourseDetails | null {
  const details: OmscsCourseDetails = {};
  if (form.analysis.trim()) details.analysis = form.analysis.trim();
  if (form.pros.trim()) {
    details.pros = form.pros
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (form.cons.trim()) {
    details.cons = form.cons
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return Object.keys(details).length > 0 ? details : null;
}

export function CoursesView() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { courses, loading, addCourse, updateCourse, deleteCourse } =
    useOmscsData();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<OmscsCourse | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(
    getFormDataFromCourse(null)
  );
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setFormData(getFormDataFromCourse(null));
    setShowAddDialog(true);
  };

  const handleOpenEdit = (course: OmscsCourse) => {
    setFormData(getFormDataFromCourse(course));
    setEditingCourse(course);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingCourse(null);
    setFormData(getFormDataFromCourse(null));
  };

  const handleAddCourse = async () => {
    if (!formData.code || !formData.name) return;
    setSaving(true);
    try {
      await addCourse({
        code: formData.code,
        name: formData.name,
        details: buildDetailsFromForm(formData) || undefined,
      });
      handleCloseDialog();
      toast.success("Course added");
    } catch {
      toast.error("Failed to add course");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCourse = async () => {
    if (!editingCourse || !formData.code || !formData.name) return;
    setSaving(true);
    try {
      await updateCourse(editingCourse.id, {
        code: formData.code,
        name: formData.name,
        details: buildDetailsFromForm(formData),
      });
      handleCloseDialog();
      toast.success("Course updated");
    } catch {
      toast.error("Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course: OmscsCourse) => {
    try {
      await deleteCourse(course.id);
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  const isDialogOpen = showAddDialog || editingCourse !== null;
  const isEditing = editingCourse !== null;

  return (
    <div className="p-4 space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          Course Catalog ({courses.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenAdd}
          className="border-cyan-500/50 text-cyan-500 hover:bg-cyan-500/10 h-7 text-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Course
        </Button>
      </div>

      {/* Course List */}
      <div className="space-y-3">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isDark={isDark}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteCourse}
          />
        ))}

        {courses.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            No courses in catalog. Add one to get started!
          </p>
        )}
      </div>

      {/* Add/Edit Course Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {isEditing ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground font-medium">
                  Course Code
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="CS 6250"
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-medium">
                  Course Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Computer Networks"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-medium">
                Analysis (optional)
              </label>
              <Textarea
                value={formData.analysis}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, analysis: e.target.value }))
                }
                placeholder="Brief overview of the course..."
                rows={2}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <ThumbsUp className="h-2.5 w-2.5 text-green-500" /> Pros (one
                per line)
              </label>
              <Textarea
                value={formData.pros}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pros: e.target.value }))
                }
                placeholder="Great instructor&#10;Interesting projects&#10;Well organized"
                rows={3}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <ThumbsDown className="h-2.5 w-2.5 text-red-500" /> Cons (one
                per line)
              </label>
              <Textarea
                value={formData.cons}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, cons: e.target.value }))
                }
                placeholder="Heavy workload&#10;Tough exams&#10;Outdated material"
                rows={3}
                className="text-xs"
              />
            </div>

            <Button
              onClick={isEditing ? handleUpdateCourse : handleAddCourse}
              disabled={saving || !formData.code || !formData.name}
              className="w-full bg-cyan-500 hover:bg-cyan-600 h-8 text-xs"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Course"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
