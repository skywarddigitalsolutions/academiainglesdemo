import type { Course } from "@/domain/course";
import type { Exam } from "@/domain/exam";
import type { ConceptualGrade, GradingType } from "@/domain/grading";
import {
  averageOf,
  CONCEPTUAL_SCORE,
  compareRisk,
  gradeScore,
  medianConcept,
  nearestConcept,
  studentPerformance,
  type StudentPerformance,
} from "@/domain/performance";
import { BIMESTER_NUMBERS, type BimesterNumber } from "@/domain/report-card";
import { fullName, type Student } from "@/domain/student";
import type { User } from "@/domain/user";
import { today } from "./exams";
import { loadOrCreateReportCard, requireCourse, type UseCaseDeps } from "./shared";

/*
 * Read model for Dirección's "Tablero". Built from drafts too: Dirección sees
 * work in progress. Aggregates are computed over students, never as an average
 * of course averages. Conceptual courses (1° a 4° grado) never get a numeric
 * average or a percentage: they expose a median concept and counts.
 */

export interface StudentMetrics {
  student: Student;
  performance: StudentPerformance;
}

export interface BimesterAverage {
  bimester: BimesterNumber;
  /**
   * Numeric: mean of the scores graded in the bimester. Conceptual: the internal
   * score of `concept` (null = nobody graded yet).
   */
  average: number | null;
  /** Conceptual only: median concept of the bimester. */
  concept: ConceptualGrade | null;
  /** How many students have a grade in the bimester. */
  graded: number;
}

export interface CourseMetrics {
  course: Course;
  teachers: User[];
  studentCount: number;
  /** Numeric: mean of the graded students' averages. Conceptual: the internal score of `concept`. */
  average: number | null;
  /** Conceptual only: median of the students' concepts. */
  concept: ConceptualGrade | null;
  bimesterAverages: BimesterAverage[];
  passed: number;
  failed: number;
  ungraded: number;
  /** Percentages of the graded students, one decimal (null = none graded, always null when conceptual). */
  passRate: number | null;
  failRate: number | null;
  examsTaken: number;
  examsUpcoming: number;
  /** Mean of the per-exam averages (conceptual grades via their equivalence). */
  examsAverage: number | null;
  /** Sorted by full name. */
  students: StudentMetrics[];
  /** Medium and high March risk, highest first. */
  atRisk: StudentMetrics[];
  improving: number;
  declining: number;
}

export interface SchoolMetrics {
  studentCount: number;
  /** Mean over the students of numeric courses only. */
  average: number | null;
  passed: number;
  failed: number;
  ungraded: number;
  atRiskHigh: number;
  atRiskMedium: number;
  examsTaken: number;
  examsUpcoming: number;
}

export interface DashboardMetrics {
  /** Calendar day used to split exams taken/upcoming (yyyy-mm-dd). */
  today: string;
  year: number;
  school: SchoolMetrics;
  /** Numeric courses only. */
  bimesterAverages: BimesterAverage[];
  /** Same order as the course list. */
  courses: CourseMetrics[];
}

function percentOf(count: number, total: number): number | null {
  return total === 0 ? null : Math.round((count / total) * 1000) / 10;
}

function bimesterAverages(list: StudentMetrics[], isConceptual: boolean): BimesterAverage[] {
  return BIMESTER_NUMBERS.map((bimester, i) => {
    const scores = list
      .map((s) => s.performance.scores[i])
      .filter((score): score is number => score !== null);
    if (!isConceptual) {
      return { bimester, average: averageOf(scores), concept: null, graded: scores.length };
    }
    const concept = medianConcept(scores.map(nearestConcept));
    return {
      bimester,
      average: concept ? CONCEPTUAL_SCORE[concept] : null,
      concept,
      graded: scores.length,
    };
  });
}

/** Student counts shared by the course and school levels. */
function countStudents(list: StudentMetrics[]) {
  const performances = list.map((s) => s.performance);
  const passed = performances.filter((p) => p.standing === "passed").length;
  const failed = performances.filter((p) => p.standing === "failed").length;
  return { studentCount: list.length, passed, failed, ungraded: list.length - passed - failed };
}

/** Course-level average and concept: a mean for numeric courses, a median concept otherwise. */
function courseAverage(list: StudentMetrics[], isConceptual: boolean) {
  if (!isConceptual) {
    const average = averageOf(
      list.map((s) => s.performance.average).filter((a): a is number => a !== null),
    );
    return { average, concept: null };
  }
  const concept = medianConcept(
    list.map((s) => s.performance.concept).filter((c): c is ConceptualGrade => c !== null),
  );
  return { average: concept ? CONCEPTUAL_SCORE[concept] : null, concept };
}

function examAverage(exam: Exam): number | null {
  return averageOf(
    Object.values(exam.grades)
      .map((grade) => gradeScore(grade))
      .filter((score): score is number => score !== null),
  );
}

function buildCourse(
  course: Course,
  teachers: User[],
  students: StudentMetrics[],
  exams: Exam[],
  day: string,
): CourseMetrics {
  const sorted = [...students].sort((a, b) =>
    fullName(a.student).localeCompare(fullName(b.student), "es"),
  );
  const isConceptual = course.gradingType === "conceptual";
  const counts = countStudents(sorted);
  return {
    course,
    teachers,
    ...counts,
    ...courseAverage(sorted, isConceptual),
    passRate: isConceptual ? null : percentOf(counts.passed, counts.passed + counts.failed),
    failRate: isConceptual ? null : percentOf(counts.failed, counts.passed + counts.failed),
    bimesterAverages: bimesterAverages(sorted, isConceptual),
    examsTaken: exams.filter((e) => e.date <= day).length,
    examsUpcoming: exams.filter((e) => e.date > day).length,
    examsAverage: averageOf(
      exams.map(examAverage).filter((a): a is number => a !== null),
    ),
    students: sorted,
    atRisk: sorted
      .filter((s) => s.performance.risk.level !== "none")
      .sort((a, b) => compareRisk(a.performance, b.performance)),
    improving: sorted.filter((s) => s.performance.trend === "up").length,
    declining: sorted.filter((s) => s.performance.trend === "down").length,
  };
}

async function studentMetrics(
  deps: UseCaseDeps,
  student: Student,
  gradingType: GradingType | undefined,
): Promise<StudentMetrics> {
  const card = await loadOrCreateReportCard(deps, student);
  return { student, performance: studentPerformance(card, gradingType) };
}

/** Metrics of one course (same shape as its entry in the dashboard). */
export async function loadCourseMetrics(
  deps: UseCaseDeps,
  courseId: string,
): Promise<CourseMetrics> {
  const course = await requireCourse(deps, courseId);
  const { students, users, exams } = deps.repositories;
  const [courseStudents, teachers, courseExams] = await Promise.all([
    students.listByCourse(course.id),
    users.listByRole("teacher"),
    exams.listByYear(deps.year),
  ]);
  const roster = await Promise.all(
    courseStudents.map((s) => studentMetrics(deps, s, course.gradingType)),
  );
  return buildCourse(
    course,
    teachers.filter((t) => course.teacherIds.includes(t.id)),
    roster,
    courseExams.filter((e) => e.courseId === course.id),
    today(deps),
  );
}

/**
 * Dashboard of the whole school, or of the given courses only (a teacher's own):
 * the school aggregates are then computed over those courses' students.
 */
export async function loadDashboard(
  deps: UseCaseDeps,
  onlyCourseIds?: readonly string[],
): Promise<DashboardMetrics> {
  const { courses, students, users, exams } = deps.repositories;
  const day = today(deps);
  const [everyCourse, everyStudent, teachers, allExams] = await Promise.all([
    courses.list(),
    students.list(),
    users.listByRole("teacher"),
    exams.listByYear(deps.year),
  ]);
  const allCourses = onlyCourseIds
    ? everyCourse.filter((c) => onlyCourseIds.includes(c.id))
    : everyCourse;
  const allStudents = onlyCourseIds
    ? everyStudent.filter((s) => onlyCourseIds.includes(s.courseId))
    : everyStudent;
  const metrics: StudentMetrics[] = await Promise.all(
    allStudents.map((student) =>
      studentMetrics(deps, student, allCourses.find((c) => c.id === student.courseId)?.gradingType),
    ),
  );

  const courseMetrics = allCourses.map((course) =>
    buildCourse(
      course,
      teachers.filter((t) => course.teacherIds.includes(t.id)),
      metrics.filter((m) => m.student.courseId === course.id),
      allExams.filter((e) => e.courseId === course.id),
      day,
    ),
  );

  const level = (wanted: "high" | "medium") =>
    metrics.filter((m) => m.performance.risk.level === wanted).length;
  const numericStudents = metrics.filter((m) => m.performance.gradingType === "numeric");
  return {
    today: day,
    year: deps.year,
    school: {
      ...countStudents(metrics),
      average: courseAverage(numericStudents, false).average,
      atRiskHigh: level("high"),
      atRiskMedium: level("medium"),
      examsTaken: courseMetrics.reduce((sum, c) => sum + c.examsTaken, 0),
      examsUpcoming: courseMetrics.reduce((sum, c) => sum + c.examsUpcoming, 0),
    },
    bimesterAverages: bimesterAverages(numericStudents, false),
    courses: courseMetrics,
  };
}
