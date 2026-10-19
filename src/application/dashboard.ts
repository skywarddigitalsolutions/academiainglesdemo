import type { Course } from "@/domain/course";
import type { Exam } from "@/domain/exam";
import {
  averageOf,
  compareRisk,
  gradeScore,
  studentPerformance,
  type StudentPerformance,
} from "@/domain/performance";
import { BIMESTER_NUMBERS, type BimesterNumber } from "@/domain/report-card";
import { fullName, type Student } from "@/domain/student";
import type { User } from "@/domain/user";
import { today } from "./exams";
import { loadOrCreateReportCard, type UseCaseDeps } from "./shared";

/*
 * Read model for Dirección's "Tablero". Built from drafts too: Dirección sees
 * work in progress. Aggregates are computed over students, never as an average
 * of course averages.
 */

export interface StudentMetrics {
  student: Student;
  performance: StudentPerformance;
}

export interface BimesterAverage {
  bimester: BimesterNumber;
  /** Mean of the scores graded in the bimester (null = nobody graded yet). */
  average: number | null;
  /** How many students have a grade in the bimester. */
  graded: number;
}

export interface CourseMetrics {
  course: Course;
  teachers: User[];
  studentCount: number;
  /** Mean of the graded students' averages. */
  average: number | null;
  bimesterAverages: BimesterAverage[];
  passed: number;
  failed: number;
  ungraded: number;
  /** Percentages of the graded students, one decimal (null = none graded). */
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
  average: number | null;
  passed: number;
  failed: number;
  ungraded: number;
  passRate: number | null;
  failRate: number | null;
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
  bimesterAverages: BimesterAverage[];
  /** Same order as the course list. */
  courses: CourseMetrics[];
}

function percentOf(count: number, total: number): number | null {
  return total === 0 ? null : Math.round((count / total) * 1000) / 10;
}

function bimesterAverages(list: StudentMetrics[]): BimesterAverage[] {
  return BIMESTER_NUMBERS.map((bimester, i) => {
    const scores = list
      .map((s) => s.performance.scores[i])
      .filter((score): score is number => score !== null);
    return { bimester, average: averageOf(scores), graded: scores.length };
  });
}

/** Totals shared by the course and school levels. */
function summarize(list: StudentMetrics[]) {
  const performances = list.map((s) => s.performance);
  const passed = performances.filter((p) => p.standing === "passed").length;
  const failed = performances.filter((p) => p.standing === "failed").length;
  return {
    studentCount: list.length,
    average: averageOf(
      performances.map((p) => p.average).filter((a): a is number => a !== null),
    ),
    passed,
    failed,
    ungraded: list.length - passed - failed,
    passRate: percentOf(passed, passed + failed),
    failRate: percentOf(failed, passed + failed),
  };
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
  const summary = summarize(sorted);
  return {
    course,
    teachers,
    ...summary,
    bimesterAverages: bimesterAverages(sorted),
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

export async function loadDashboard(deps: UseCaseDeps): Promise<DashboardMetrics> {
  const { courses, students, users, exams } = deps.repositories;
  const day = today(deps);
  const [allCourses, allStudents, teachers, allExams] = await Promise.all([
    courses.list(),
    students.list(),
    users.listByRole("teacher"),
    exams.listByYear(deps.year),
  ]);
  const metrics: StudentMetrics[] = await Promise.all(
    allStudents.map(async (student) => {
      const card = await loadOrCreateReportCard(deps, student);
      return {
        student,
        performance: studentPerformance(card),
      };
    }),
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
  const totals = summarize(metrics);
  return {
    today: day,
    year: deps.year,
    school: {
      ...totals,
      atRiskHigh: level("high"),
      atRiskMedium: level("medium"),
      examsTaken: courseMetrics.reduce((sum, c) => sum + c.examsTaken, 0),
      examsUpcoming: courseMetrics.reduce((sum, c) => sum + c.examsUpcoming, 0),
    },
    bimesterAverages: bimesterAverages(metrics),
    courses: courseMetrics,
  };
}
