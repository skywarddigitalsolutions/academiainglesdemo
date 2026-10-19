"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHOOL_LEVELS,
  courseName,
  formatSchedule,
  gradingTypeFor,
  nextCourseNameFor,
  parseSchedule,
  schoolLevelLabel,
  yearsFor,
  type Course,
  type SchoolLevel,
} from "@/domain/course";
import type { User } from "@/domain/user";
import { errorMessage } from "@/lib/error-message";
import { getServices } from "@/providers/services";

export interface CourseFormState {
  id?: string;
  level: SchoolLevel;
  year: number;
  division: string;
  days: string;
  start: string;
  end: string;
  teacherIds: string[];
  nextCourseName: string;
}

export function newCourseForm(): CourseFormState {
  return {
    level: "primary",
    year: 1,
    division: "A",
    days: "",
    start: "",
    end: "",
    teacherIds: [],
    nextCourseName: nextCourseNameFor("primary", 1, "A"),
  };
}

export function editCourseForm(course: Course): CourseFormState {
  return {
    id: course.id,
    level: course.level,
    year: course.year,
    division: course.division,
    ...parseSchedule(course.schedule),
    teacherIds: course.teacherIds,
    nextCourseName: course.nextCourseName,
  };
}

const DIVISIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** Create / edit a course: level, year, division, schedule and assigned teachers. */
export function CourseDialog({
  initial,
  teachers,
  hasStudents,
  onClose,
  onSaved,
}: {
  initial: CourseFormState;
  teachers: User[];
  /** The grading type (derived from level and year) cannot change once the course has students. */
  hasStudents: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The promotion target follows the course until the admin edits it by hand.
  const [nextEdited, setNextEdited] = useState(Boolean(initial.id));

  function changeClass(patch: Partial<Pick<CourseFormState, "level" | "year" | "division">>) {
    setForm((f) => {
      const next = { ...f, ...patch };
      if (!yearsFor(next.level).includes(next.year)) next.year = 1;
      if (!nextEdited) {
        next.nextCourseName = nextCourseNameFor(next.level, next.year, next.division);
      }
      return next;
    });
  }

  function toggleTeacher(id: string, checked: boolean) {
    setForm((f) => ({
      ...f,
      teacherIds: checked ? [...f.teacherIds, id] : f.teacherIds.filter((t) => t !== id),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const course = await getServices().admin.saveCourse({
        id: form.id,
        level: form.level,
        year: form.year,
        division: form.division,
        schedule: formatSchedule(form),
        teacherIds: form.teacherIds,
        nextCourseName: form.nextCourseName,
      });
      toast.success(
        initial.id ? "Datos del curso actualizados." : `El curso ${course.name} fue creado.`,
      );
      onSaved();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const gradingType = gradingTypeFor(form.level, form.year);
  const gradingChanged =
    Boolean(initial.id) && hasStudents && gradingType !== gradingTypeFor(initial.level, initial.year);
  const yearLabel = form.level === "primary" ? "Grado" : "Año";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial.id ? "Editar curso" : "Nuevo curso"}</DialogTitle>
          <DialogDescription>
            El nivel, el grado o año y la división definen el nombre del curso y su tipo de calificación.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-level">Nivel</Label>
              <Select
                value={form.level}
                onValueChange={(value) => changeClass({ level: value as SchoolLevel })}
              >
                <SelectTrigger id="co-level" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {schoolLevelLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-year">{yearLabel}</Label>
              <Select
                value={String(form.year)}
                onValueChange={(value) => changeClass({ year: Number(value) })}
              >
                <SelectTrigger id="co-year" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearsFor(form.level).map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}°
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-division">División</Label>
              <Select
                value={form.division}
                onValueChange={(value) => changeClass({ division: value })}
              >
                <SelectTrigger id="co-division" className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIVISIONS.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg bg-muted px-3 py-2 text-sm">
            <p>
              <span className="text-muted-foreground">Curso: </span>
              <span className="font-medium">{courseName(form.level, form.year, form.division)}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Calificación: </span>
              <span className="font-medium">{gradingType === "conceptual" ? "Nota conceptual" : "Nota numérica"}</span>
            </p>
            {gradingChanged && (
              <p className="mt-1 text-xs text-destructive">
                Ese grado cambia el tipo de calificación y el curso ya tiene alumnos.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="co-next">Curso siguiente</Label>
            <Input
              id="co-next"
              value={form.nextCourseName}
              onChange={(e) => {
                setNextEdited(true);
                setForm({ ...form, nextCourseName: e.target.value });
              }}
              placeholder="Ej.: 4° Grado B"
              className="h-10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="co-days">Días de cursada</Label>
            <Input
              id="co-days"
              value={form.days}
              onChange={(e) => setForm({ ...form, days: e.target.value })}
              placeholder="Ej.: Lunes y miércoles"
              className="h-10"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-start">Desde</Label>
              <Input
                id="co-start"
                type="time"
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
                className="h-10 tabular-nums"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="co-end">Hasta</Label>
              <Input
                id="co-end"
                type="time"
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
                className="h-10 tabular-nums"
                required
              />
            </div>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">
              Docentes asignados ({form.teacherIds.length})
            </legend>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
              {teachers.length === 0 && (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  Todavía no hay docentes cargados.
                </p>
              )}
              {teachers.map((t) => (
                <label
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={form.teacherIds.includes(t.id)}
                    onCheckedChange={(v) => toggleTeacher(t.id, v === true)}
                  />
                  <span>
                    {t.lastName}, {t.firstName}{" "}
                    <span className="text-muted-foreground">({t.username})</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
