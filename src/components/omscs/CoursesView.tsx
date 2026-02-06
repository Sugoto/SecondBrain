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
  onEdit: (course: OmscsCourse) => void;
  onDelete: (course: OmscsCourse) => void;
}

function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const details = course.details as OmscsCourseDetails | null;
  const hasDetails =
    details &&
    (details.analysis || details.pros?.length || details.cons?.length);

  return (
    <div className="overflow-hidden rounded-xl border-2 border-black dark:border-white bg-card shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 hover:bg-pastel-yellow/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm text-foreground">
                {course.code}
              </p>
              {course.enrolled_semester && (
                <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-pastel-green border border-black dark:border-white text-black dark:text-white">
                  {course.final_grade || "In Progress"}
                </span>
              )}
            </div>
            <p className="text-xs truncate text-muted-foreground font-medium">
              {course.name}
            </p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-7 w-7 rounded-md bg-white dark:bg-white/10 border-2 border-black dark:border-white flex items-center justify-center shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-black dark:text-white" />
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
            <div className="px-4 pb-4 pt-3 space-y-3 border-t-2 border-black/10 dark:border-white/10">
              {/* Details section - only if has details */}
              {hasDetails && (
                <div className="space-y-3">
                  {/* Analysis */}
                  {details.analysis && (
                    <div className="p-3 rounded-lg bg-pastel-blue/50 border border-black/20 dark:border-white/20">
                      <p className="text-[10px] uppercase tracking-wider mb-1 font-bold text-black/70 dark:text-white/70">
                        Analysis
                      </p>
                      <p className="text-xs text-foreground font-medium">
                        {details.analysis}
                      </p>
                    </div>
                  )}

                  {/* Pros */}
                  {details.pros && details.pros.length > 0 && (
                    <div className="p-3 rounded-lg bg-pastel-green/50 border border-black/20 dark:border-white/20">
                      <p className="text-[10px] uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1.5 text-black/70 dark:text-white/70">
                        <ThumbsUp className="h-3 w-3" /> Pros
                      </p>
                      <ul className="space-y-1">
                        {details.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-xs flex items-start gap-1.5 text-foreground font-medium"
                          >
                            <span className="text-black/50 dark:text-white/50">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {details.cons && details.cons.length > 0 && (
                    <div className="p-3 rounded-lg bg-pastel-pink/50 border border-black/20 dark:border-white/20">
                      <p className="text-[10px] uppercase tracking-wider mb-1.5 font-bold flex items-center gap-1.5 text-black/70 dark:text-white/70">
                        <ThumbsDown className="h-3 w-3" /> Cons
                      </p>
                      <ul className="space-y-1">
                        {details.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-xs flex items-start gap-1.5 text-foreground font-medium"
                          >
                            <span className="text-black/50 dark:text-white/50">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border-2 border-black dark:border-white bg-white dark:bg-white/10 text-black dark:text-white hover:bg-pastel-blue hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0]"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all border-2 border-black dark:border-white bg-white dark:bg-white/10 text-black dark:text-white hover:bg-pastel-pink hover:shadow-[2px_2px_0_#1a1a1a] dark:hover:shadow-[2px_2px_0_#FFFBF0]"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDialogOpen = showAddDialog || editingCourse !== null;
  const isEditing = editingCourse !== null;

  return (
    <div className="p-5 space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Course Catalog ({courses.length})
        </h3>
        <button
          onClick={handleOpenAdd}
          className="h-9 px-4 flex items-center gap-2 rounded-lg text-xs font-bold transition-all border-2 border-black dark:border-white bg-pastel-green text-black dark:text-white shadow-[2px_2px_0_#1a1a1a] dark:shadow-[2px_2px_0_#FFFBF0] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_#1a1a1a] dark:hover:shadow-[3px_3px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          <Plus className="h-4 w-4" /> Add Course
        </button>
      </div>

      {/* Course List */}
      <div className="space-y-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteCourse}
          />
        ))}

        {courses.length === 0 && (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-black/30 dark:border-white/30">
            <p className="text-sm font-medium text-muted-foreground">
              No courses in catalog. Add one to get started!
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Course Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border-2 border-black dark:border-white shadow-[6px_6px_0_#1a1a1a] dark:shadow-[6px_6px_0_#FFFBF0]">
          <DialogHeader className="border-b-2 border-black dark:border-white pb-4 mb-4 bg-pastel-purple -mx-6 -mt-6 px-6 pt-6 rounded-t-2xl">
            <DialogTitle className="text-lg font-bold text-black dark:text-white">
              {isEditing ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                  Course Code
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="CS 6250"
                  className="h-10 text-sm font-medium border-2 border-black dark:border-white rounded-lg"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                  Course Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Computer Networks"
                  className="h-10 text-sm font-medium border-2 border-black dark:border-white rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Analysis (optional)
              </label>
              <Textarea
                value={formData.analysis}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, analysis: e.target.value }))
                }
                placeholder="Brief overview of the course..."
                rows={2}
                className="text-sm font-medium border-2 border-black dark:border-white rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ThumbsUp className="h-3 w-3" /> Pros (one per line)
              </label>
              <Textarea
                value={formData.pros}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pros: e.target.value }))
                }
                placeholder="Great instructor&#10;Interesting projects&#10;Well organized"
                rows={3}
                className="text-sm font-medium border-2 border-black dark:border-white rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-bold uppercase tracking-wide flex items-center gap-1.5">
                <ThumbsDown className="h-3 w-3" /> Cons (one per line)
              </label>
              <Textarea
                value={formData.cons}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, cons: e.target.value }))
                }
                placeholder="Heavy workload&#10;Tough exams&#10;Outdated material"
                rows={3}
                className="text-sm font-medium border-2 border-black dark:border-white rounded-lg"
              />
            </div>

            <button
              onClick={isEditing ? handleUpdateCourse : handleAddCourse}
              disabled={saving || !formData.code || !formData.name}
              className="w-full h-12 rounded-xl text-sm font-bold transition-all border-2 border-black dark:border-white bg-pastel-green text-black shadow-[3px_3px_0_#1a1a1a] dark:shadow-[3px_3px_0_#FFFBF0] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#1a1a1a] dark:hover:shadow-[4px_4px_0_#FFFBF0] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Course"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
