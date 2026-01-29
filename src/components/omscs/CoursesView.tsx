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

// Unified OMSCS color palette - matches OmscsTracker
const COLORS = {
  bgCard: "#263241",
  bgCardHover: "#2d3a4a",
  bgMuted: "rgba(255, 255, 255, 0.05)",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#64748b",
  textForeground: "rgba(241, 245, 249, 0.8)",
  accent: "#06b6d4",
  accentBg: "rgba(6, 182, 212, 0.15)",
  warning: "#f59e0b",
  warningBg: "rgba(245, 158, 11, 0.15)",
  success: "#10b981",
  danger: "#ef4444",
  dangerBg: "rgba(239, 68, 68, 0.1)",
  border: "rgba(100, 116, 139, 0.25)",
};

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
    <div
      className="overflow-hidden rounded-lg"
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-3 py-2"
      >
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-xs" style={{ color: COLORS.textPrimary }}>
                {course.code}
              </p>
              {course.enrolled_semester && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={{
                    background: course.final_grade ? COLORS.accentBg : COLORS.warningBg,
                    color: course.final_grade ? COLORS.accent : COLORS.warning,
                  }}
                >
                  {course.final_grade || "In Progress"}
                </span>
              )}
            </div>
            <p className="text-[10px] truncate" style={{ color: COLORS.textSecondary }}>
              {course.name}
            </p>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="h-3.5 w-3.5" style={{ color: COLORS.textMuted }} />
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
              style={{ borderColor: COLORS.border }}
            >
              {/* Details section - only if has details */}
              {hasDetails && (
                <div className="space-y-2">
                  {/* Analysis */}
                  {details.analysis && (
                    <div>
                      <p
                        className="text-[9px] uppercase tracking-wider mb-0.5 font-medium"
                        style={{ color: COLORS.textMuted }}
                      >
                        Analysis
                      </p>
                      <p className="text-[10px]" style={{ color: COLORS.textForeground }}>
                        {details.analysis}
                      </p>
                    </div>
                  )}

                  {/* Pros */}
                  {details.pros && details.pros.length > 0 && (
                    <div>
                      <p
                        className="text-[9px] uppercase tracking-wider mb-0.5 font-medium flex items-center gap-1"
                        style={{ color: COLORS.textMuted }}
                      >
                        <ThumbsUp className="h-2.5 w-2.5" style={{ color: COLORS.success }} /> Pros
                      </p>
                      <ul className="space-y-0.5">
                        {details.pros.map((pro, i) => (
                          <li
                            key={i}
                            className="text-[10px] flex items-start gap-1"
                            style={{ color: COLORS.textForeground }}
                          >
                            <span style={{ color: COLORS.success }}>•</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {details.cons && details.cons.length > 0 && (
                    <div>
                      <p
                        className="text-[9px] uppercase tracking-wider mb-0.5 font-medium flex items-center gap-1"
                        style={{ color: COLORS.textMuted }}
                      >
                        <ThumbsDown className="h-2.5 w-2.5" style={{ color: COLORS.danger }} /> Cons
                      </p>
                      <ul className="space-y-0.5">
                        {details.cons.map((con, i) => (
                          <li
                            key={i}
                            className="text-[10px] flex items-start gap-1"
                            style={{ color: COLORS.textForeground }}
                          >
                            <span style={{ color: COLORS.danger }}>•</span>
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors"
                  style={{ color: COLORS.textSecondary }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bgMuted}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(course);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-medium transition-colors"
                  style={{ color: COLORS.danger }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.dangerBg}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <Trash2 className="h-3 w-3" /> Delete
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
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: COLORS.accent }} />
      </div>
    );
  }

  const isDialogOpen = showAddDialog || editingCourse !== null;
  const isEditing = editingCourse !== null;

  return (
    <div className="p-4 space-y-3">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3
          className="text-[10px] font-medium uppercase tracking-wider"
          style={{ color: COLORS.textSecondary }}
        >
          Course Catalog ({courses.length})
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenAdd}
          className="h-7 text-xs"
          style={{
            borderColor: "rgba(6, 182, 212, 0.5)",
            color: COLORS.accent,
          }}
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
            onEdit={handleOpenEdit}
            onDelete={handleDeleteCourse}
          />
        ))}

        {courses.length === 0 && (
          <p className="text-xs text-center py-8" style={{ color: COLORS.textSecondary }}>
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
