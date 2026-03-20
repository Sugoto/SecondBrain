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
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors rounded-none"
      >
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-xs text-foreground">
                {course.code}
              </p>
              {course.enrolled_semester && (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
                  {course.final_grade || "In Progress"}
                </span>
              )}
            </div>
            <p className="text-[10px] truncate text-muted-foreground font-medium">
              {course.name}
            </p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border border-border bg-muted"
          >
            <ChevronDown className="h-3 w-3 text-foreground" />
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
            <div className="px-3 pb-3 pt-2 space-y-2 border-t border-border">
              {hasDetails && (
                <div className="space-y-2">
                  {details.analysis && (
                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 border border-border">
                      <p className="text-[11px] uppercase tracking-wider mb-0.5 font-medium text-muted-foreground">
                        Analysis
                      </p>
                      <p className="text-[10px] text-foreground font-medium">
                        {details.analysis}
                      </p>
                    </div>
                  )}

                  {details.pros && details.pros.length > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-border">
                      <p className="text-[11px] uppercase tracking-wider mb-1 font-medium flex items-center gap-1 text-muted-foreground">
                        <ThumbsUp className="h-2.5 w-2.5" /> Pros
                      </p>
                      <ul className="space-y-0.5">
                        {details.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-[10px] flex items-start gap-1 text-foreground font-medium"
                          >
                            <span className="text-muted-foreground">•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {details.cons && details.cons.length > 0 && (
                    <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-border">
                      <p className="text-[11px] uppercase tracking-wider mb-1 font-medium flex items-center gap-1 text-muted-foreground">
                        <ThumbsDown className="h-2.5 w-2.5" /> Cons
                      </p>
                      <ul className="space-y-0.5">
                        {details.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-[10px] flex items-start gap-1 text-foreground font-medium"
                          >
                            <span className="text-muted-foreground">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors border border-border bg-muted text-foreground hover:bg-accent"
                >
                  <Pencil className="h-2.5 w-2.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors border border-border bg-muted text-foreground hover:bg-accent"
                >
                  <Trash2 className="h-2.5 w-2.5" /> Delete
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
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Course Catalog ({courses.length})
        </h3>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg text-[10px] font-medium transition-colors border border-border bg-foreground text-background hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> Add Course
        </button>
      </div>

      <div className="space-y-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteCourse}
          />
        ))}

        {courses.length === 0 && (
          <div className="text-center py-6 rounded-xl border border-dashed border-border bg-card/50">
            <p className="text-xs font-medium text-muted-foreground">
              No courses in catalog. Add one to get started!
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCloseDialog()}
      >
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          <DialogHeader className="border-b border-border pb-3 mb-3 -mx-6 -mt-6 px-6 pt-4 bg-muted/50 rounded-t-xl">
            <DialogTitle className="text-sm font-semibold text-foreground">
              {isEditing ? "Edit Course" : "Add Course"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Course Code
                </label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="CS 6250"
                  className="h-7 text-xs font-medium border border-border rounded-lg transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Course Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Computer Networks"
                  className="h-7 text-xs font-medium border border-border rounded-lg transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                Analysis (optional)
              </label>
              <Textarea
                value={formData.analysis}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, analysis: e.target.value }))
                }
                placeholder="Brief overview of the course..."
                rows={2}
                className="text-xs font-medium border border-border rounded-lg min-h-14 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                <ThumbsUp className="h-2.5 w-2.5" /> Pros (one per line)
              </label>
              <Textarea
                value={formData.pros}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, pros: e.target.value }))
                }
                placeholder="Great instructor&#10;Interesting projects&#10;Well organized"
                rows={2}
                className="text-xs font-medium border border-border rounded-lg min-h-14 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                <ThumbsDown className="h-2.5 w-2.5" /> Cons (one per line)
              </label>
              <Textarea
                value={formData.cons}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, cons: e.target.value }))
                }
                placeholder="Heavy workload&#10;Tough exams&#10;Outdated material"
                rows={2}
                className="text-xs font-medium border border-border rounded-lg min-h-14 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={isEditing ? handleUpdateCourse : handleAddCourse}
              disabled={saving || !formData.code || !formData.name}
              className="w-full h-9 rounded-lg text-xs font-medium transition-colors border border-border bg-foreground text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin mx-auto" />
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
