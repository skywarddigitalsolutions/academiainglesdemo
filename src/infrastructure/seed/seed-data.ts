import { DEMO_PASSWORD } from "@/application/demo-constants";
import type { Course } from "@/domain/course";
import { createCourseNote, type CourseNote } from "@/domain/course-note";
import { returnReview, submitReview, type PeriodReview } from "@/domain/period-review";
import type { ConceptualGrade, GradeValue, GradingType } from "@/domain/grading";
import {
  acknowledgeBimester,
  createEmptyReportCard,
  getBimester,
  isBimesterComplete,
  publishBimester,
  updateBimester,
  updateClosing,
  type BimesterNumber,
  type ReportCard,
} from "@/domain/report-card";
import type { Student } from "@/domain/student";
import type { User } from "@/domain/user";

export interface SeedData {
  users: User[];
  courses: Course[];
  students: Student[];
  reportCards: ReportCard[];
  reviews: PeriodReview[];
  notes: CourseNote[];
}

export { DEMO_PASSWORD };

function user(
  id: string,
  username: string,
  role: User["role"],
  firstName: string,
  lastName: string,
  phone = "",
): User {
  return {
    id,
    username,
    password: DEMO_PASSWORD,
    role,
    firstName,
    lastName,
    email: `${username}@inmaculada.edu.ar`,
    phone,
  };
}

const USERS: User[] = [
  user("u-admin", "admin", "admin", "María Elena", "Gutiérrez"),
  user("u-teacher-1", "profesor", "teacher", "Laura", "Benítez"),
  user("u-teacher-2", "jperalta", "teacher", "Javier", "Peralta"),
  user("u-parent-1", "padre", "parent", "Carlos", "Romero", "11 4567-8910"),
  user("u-parent-2", "vdiaz", "parent", "Valeria", "Díaz", "11 4567-1234"),
  user("u-parent-3", "amedina", "parent", "Andrea", "Medina", "11 5321-7788"),
  user("u-parent-4", "gsosa", "parent", "Gustavo", "Sosa", "11 6012-3344"),
  user("u-parent-5", "pcastro", "parent", "Paula", "Castro", "11 4789-5566"),
  user("u-parent-6", "macosta", "parent", "Marcelo", "Acosta", "11 5987-2211"),
];

const COURSES: Course[] = [
  {
    id: "c-2a",
    name: "2° Grado A",
    gradingType: "conceptual",
    teacherIds: ["u-teacher-1"],
    nextCourseName: "3° Grado A",
    schedule: "Lunes y miércoles · 14:00 a 15:30",
  },
  {
    id: "c-5a",
    name: "5° Grado A",
    gradingType: "numeric",
    teacherIds: ["u-teacher-1"],
    nextCourseName: "6° Grado A",
    schedule: "Martes y jueves · 15:00 a 16:30",
  },
  {
    id: "c-1y",
    name: "1° Año",
    gradingType: "numeric",
    teacherIds: ["u-teacher-2"],
    nextCourseName: "2° Año",
    schedule: "Lunes y viernes · 17:00 a 18:30",
  },
];

type StudentRow = [id: string, firstName: string, lastName: string, guardians: string[], level: number];

/** `level` drives the generated grades (roughly the numeric average). */
const STUDENT_ROWS: Record<string, StudentRow[]> = {
  "c-2a": [
    ["s-01", "Sofía", "Romero", ["u-parent-1", "u-parent-2"], 9],
    ["s-02", "Mateo", "González", [], 8],
    ["s-03", "Valentina", "López", ["u-parent-3"], 9.5],
    ["s-04", "Benjamín", "Martínez", [], 7],
    ["s-05", "Isabella", "Pereyra", [], 8],
    ["s-06", "Joaquín", "Suárez", [], 6.5],
    ["s-07", "Emma", "Ríos", [], 8.5],
  ],
  "c-5a": [
    ["s-08", "Tomás", "Romero", ["u-parent-1", "u-parent-2"], 7.5],
    ["s-09", "Martina", "Sosa", ["u-parent-4"], 9],
    ["s-10", "Bruno", "Acosta", ["u-parent-6"], 5],
    ["s-11", "Catalina", "Herrera", [], 8],
    ["s-12", "Felipe", "Molina", [], 7],
    ["s-13", "Julieta", "Navarro", [], 9.5],
    ["s-14", "Lautaro", "Domínguez", [], 6.5],
    ["s-15", "Mía", "Vega", [], 8],
  ],
  "c-1y": [
    ["s-16", "Agustina", "Castro", ["u-parent-5"], 8.5],
    ["s-17", "Santiago", "Ruiz", [], 7],
    ["s-18", "Camila", "Ortiz", [], 9],
    ["s-19", "Nicolás", "Giménez", [], 6.5],
    ["s-20", "Lucía", "Fernández", [], 8],
    ["s-21", "Facundo", "Silva", [], 7.5],
  ],
};

/** The student whose closing shows "Va a examen final". */
const FINAL_EXAM_STUDENT_ID = "s-10";

const OBSERVATIONS: string[] = [
  "Participa activamente en clase y muestra gran entusiasmo por el idioma.",
  "Muy buena comprensión oral. Se sugiere reforzar la escritura en casa.",
  "Cumple con las tareas en tiempo y forma. Excelente actitud de trabajo.",
  "Progresa en vocabulario y pronunciación. Debe prestar más atención en clase.",
  "Trabaja con dedicación en las actividades grupales y ayuda a sus compañeros.",
  "Se recomienda practicar la lectura en voz alta para ganar fluidez.",
];

const LOW_OBSERVATION =
  "Presenta dificultades en gramática y comprensión lectora. Se recomienda acompañamiento en casa y asistencia a clases de apoyo.";

function toConceptual(value: number): ConceptualGrade {
  if (value >= 9) return "Excelente";
  if (value >= 8) return "Muy bueno";
  if (value >= 7) return "Bueno";
  if (value >= 6) return "Regular";
  return "Insuficiente";
}

function clampGrade(value: number): number {
  return Math.min(10, Math.max(1, Math.round(value)));
}

function gradeFor(type: GradingType, value: number): GradeValue {
  return type === "conceptual" ? toConceptual(value) : clampGrade(value);
}

function at(year: number, monthDay: string, time = "10:00"): Date {
  return new Date(`${year}-${monthDay}T${time}:00.000-03:00`);
}

const BIMESTER_VARIATION: Record<BimesterNumber, number> = {
  1: 0,
  2: 0.5,
  3: -0.5,
  4: 0,
};

function buildReportCard(
  student: Student,
  course: Course,
  level: number,
  index: number,
  year: number,
): ReportCard {
  let card = createEmptyReportCard({
    id: `rc-${student.id}-${year}`,
    studentId: student.id,
    courseId: course.id,
    year,
  });
  const type = course.gradingType;
  const isLow = level < 6;

  // Bimester 3 is still being loaded: roughly two thirds of each course.
  const bimesters: BimesterNumber[] = index % 3 === 2 ? [1, 2] : [1, 2, 3];
  for (const n of bimesters) {
    const value = level + BIMESTER_VARIATION[n] + ((index + n) % 2 === 0 ? 0.5 : 0);
    card = updateBimester(
      card,
      n,
      {
        applicationGrade: gradeFor(type, value),
        conductGrade: toConceptual(Math.min(10, value + 1)),
        observation: isLow ? LOW_OBSERVATION : OBSERVATIONS[(index + n) % OBSERVATIONS.length],
        absences: (index * 3 + n) % 4,
      },
      type,
    );
  }

  // Bimesters 1 and 2: published to families.
  card = publishBimester(card, 1, at(year, "04-30", "11:30"));
  card = publishBimester(card, 2, at(year, "07-04", "12:15"));

  // Some families already read them.
  if (index % 2 === 0) {
    card = acknowledgeBimester(card, 1, at(year, "05-04", "20:45"));
  }
  if (index % 3 === 0 && student.guardianIds[0] !== "u-parent-1") {
    card = acknowledgeBimester(card, 2, at(year, "07-09", "21:10"));
  }

  card = updateClosing(
    card,
    { cuatrimestralExam: gradeFor(type, level + (index % 2 === 0 ? 0 : -0.5)) },
    type,
  );

  if (student.id === FINAL_EXAM_STUDENT_ID) {
    card = updateClosing(
      card,
      {
        result: "Va a examen final",
        finalExam: { modality: "Escrito", grade: null },
      },
      type,
    );
  }
  return card;
}

export function buildSeed(year: number): SeedData {
  const students: Student[] = [];
  const reportCards: ReportCard[] = [];

  for (const course of COURSES) {
    STUDENT_ROWS[course.id].forEach(([id, firstName, lastName, guardianIds, level], index) => {
      const student: Student = {
        id,
        firstName,
        lastName,
        courseId: course.id,
        guardianIds: [...guardianIds],
      };
      students.push(student);
      reportCards.push(buildReportCard(student, course, level, index, year));
    });
  }

  const { reviews, notes } = buildReviews(year, reportCards);
  return {
    users: USERS.map((u) => ({ ...u })),
    courses: COURSES.map((c) => ({ ...c, teacherIds: [...c.teacherIds] })),
    students,
    reportCards,
    reviews,
    notes,
  };
}

const RETURN_NOTE =
  "Revise la nota de aplicación de Bruno Acosta y complete las observaciones antes de volver a enviar.";

/**
 * Approval states shown by the demo for the 3° bimester:
 * 1° Año was sent to Dirección (pending), 5° Grado A was returned to the
 * teacher with a note, and 2° Grado A is still a draft.
 */
function buildReviews(year: number, cards: ReportCard[]) {
  const completeIn = (courseId: string) =>
    cards
      .filter((c) => c.courseId === courseId && isBimesterComplete(getBimester(c, 3)))
      .map((c) => c.studentId);

  const pending = submitReview(null, {
    courseId: "c-1y",
    year,
    period: 3,
    studentIds: completeIn("c-1y"),
    teacherId: "u-teacher-2",
    now: at(year, "10-14", "18:20"),
  });
  const returned = returnReview(
    submitReview(null, {
      courseId: "c-5a",
      year,
      period: 3,
      studentIds: completeIn("c-5a"),
      teacherId: "u-teacher-1",
      now: at(year, "10-10", "17:05"),
    }),
    "u-admin",
    RETURN_NOTE,
    at(year, "10-13", "09:40"),
  );
  const notes = [
    createCourseNote({
      id: "note-c-5a-3",
      courseId: "c-5a",
      year,
      authorId: "u-admin",
      authorName: "María Elena Gutiérrez",
      text: RETURN_NOTE,
      period: 3,
      now: at(year, "10-13", "09:40"),
    }),
  ];
  return { reviews: [pending, returned], notes };
}
