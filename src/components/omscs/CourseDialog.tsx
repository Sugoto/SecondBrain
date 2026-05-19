import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import type { OmscsCourse } from "@/lib/supabase";

export type CourseStatus = "planned" | "pursuing" | "done";
type Term = "Spring" | "Summer" | "Fall";

export function statusOf(course: OmscsCourse): CourseStatus {
  if (course.final_grade) return "done";
  if (course.enrolled_semester) return "pursuing";
  return "planned";
}

const EYEBROW = "text-[10px] uppercase tracking-wider text-muted-foreground";
const GRADES = ["A", "B", "C", "D", "F"] as const;
const TERMS: Term[] = ["Spring", "Summer", "Fall"];
const START_YEAR = 2025;

function parseSemester(value: string | null): { term: Term; year: number } | null {
  if (!value) return null;
  const match = value.match(/^(Spring|Summer|Fall)\s+(\d{4})$/);
  if (!match) return null;
  return { term: match[1] as Term, year: parseInt(match[2], 10) };
}

function parseCurrentTerm(currentSemester: string): Term {
  const parsed = parseSemester(currentSemester);
  return parsed?.term ?? "Fall";
}

function parseCurrentYear(currentSemester: string): number {
  const parsed = parseSemester(currentSemester);
  return parsed?.year ?? new Date().getFullYear();
}

interface CourseDialogProps {
  open: boolean;
  initial?: OmscsCourse | null;
  currentSemester: string;
  onClose: () => void;
  onSubmit: (values: {
    code: string;
    name: string;
    enrolled_semester: string | null;
    final_grade: string | null;
  }) => Promise<void>;
  onDelete?: () => void;
  isSubmitting: boolean;
}

export function CourseDialog({
  open,
  initial,
  currentSemester,
  onClose,
  onSubmit,
  onDelete,
  isSubmitting,
}: CourseDialogProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CourseStatus>("planned");
  const [grade, setGrade] = useState<string>("A");
  const [term, setTerm] = useState<Term>(parseCurrentTerm(currentSemester));
  const [year, setYear] = useState<number>(parseCurrentYear(currentSemester));

  const years = useMemo(() => {
    const max = Math.max(new Date().getFullYear() + 2, START_YEAR + 3);
    return Array.from({ length: max - START_YEAR + 1 }, (_, i) => START_YEAR + i);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setCode(initial.code);
      setName(initial.name);
      const s = statusOf(initial);
      setStatus(s);
      setGrade(initial.final_grade ?? "A");
      const parsed = parseSemester(initial.enrolled_semester);
      setTerm(parsed?.term ?? parseCurrentTerm(currentSemester));
      setYear(parsed?.year ?? parseCurrentYear(currentSemester));
    } else {
      setCode("");
      setName("");
      setStatus("planned");
      setGrade("A");
      setTerm(parseCurrentTerm(currentSemester));
      setYear(parseCurrentYear(currentSemester));
    }
  }, [open, initial, currentSemester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const enrolledSemester =
      status === "planned" ? null : `${term} ${year}`;
    const finalGrade = status === "done" ? grade : null;

    await onSubmit({
      code: code.trim(),
      name: name.trim(),
      enrolled_semester: enrolledSemester,
      final_grade: finalGrade,
    });
  };

  const title = initial ? "Edit course" : "New course";
  const showSemester = status !== "planned";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !isSubmitting && onClose()}>
      <DialogContent
        className="max-w-md w-[calc(100%-1.5rem)] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-outline-variant bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
          <p className={EYEBROW}>{title}</p>
          <DialogTitle className="sr-only">{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-6 pt-4 pb-4 overflow-y-auto flex-1 space-y-6">
            <div>
              <p className={`${EYEBROW} mb-2`}>Code</p>
              <input
                placeholder="CS 6300"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-10 font-mono text-[15px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/40 uppercase"
                autoFocus={!initial}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <p className={`${EYEBROW} mb-2`}>Title</p>
              <input
                placeholder="Software Development Process"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 text-[15px] text-foreground bg-transparent border-b border-outline-variant/60 focus:border-foreground transition-colors outline-none placeholder:text-muted-foreground/40"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <p className={`${EYEBROW} mb-2`}>Status</p>
              <div className="grid grid-cols-3 border-y border-outline-variant divide-x divide-outline-variant">
                {(["planned", "pursuing", "done"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    disabled={isSubmitting}
                    aria-pressed={status === s}
                    className={`h-9 text-[10px] uppercase tracking-wider transition-colors ${
                      status === s
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {showSemester && (
              <div className="space-y-4">
                <div>
                  <p className={`${EYEBROW} mb-2`}>Semester</p>
                  <div className="grid grid-cols-3 border-y border-outline-variant divide-x divide-outline-variant">
                    {TERMS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTerm(t)}
                        disabled={isSubmitting}
                        aria-pressed={term === t}
                        className={`h-9 text-[10px] uppercase tracking-wider transition-colors ${
                          term === t
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={`${EYEBROW} mb-2`}>Year</p>
                  <div
                    className="grid border-y border-outline-variant divide-x divide-outline-variant"
                    style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}
                  >
                    {years.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYear(y)}
                        disabled={isSubmitting}
                        aria-pressed={year === y}
                        className={`h-9 font-mono tabular-nums text-[12px] transition-colors ${
                          year === y
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {status === "done" && (
              <div>
                <p className={`${EYEBROW} mb-2`}>Grade received</p>
                <div className="grid grid-cols-5 border-y border-outline-variant divide-x divide-outline-variant">
                  {GRADES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      disabled={isSubmitting}
                      aria-pressed={grade === g}
                      className={`h-10 font-mono text-[14px] transition-colors ${
                        grade === g
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {onDelete && initial && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 h-10 text-[11px] uppercase tracking-wider text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                Delete course
              </button>
            )}
          </div>

          <div className="flex gap-2 px-6 pb-6 pt-3 shrink-0 border-t border-outline-variant">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-lg border border-outline-variant text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!code.trim() || !name.trim() || isSubmitting}
              className="flex-1 h-11 rounded-lg bg-foreground text-background text-[11px] uppercase tracking-wider transition-opacity active:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving
                </>
              ) : initial ? (
                "Save"
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
