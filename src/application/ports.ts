import type { Course } from "@/domain/course";
import type { CourseNote } from "@/domain/course-note";
import type { TeacherAbsence } from "@/domain/teacher-absence";
import type { Exam } from "@/domain/exam";
import type { PeriodReview } from "@/domain/period-review";
import type { ReportCard } from "@/domain/report-card";
import type { Student } from "@/domain/student";
import type { Role, Session, User } from "@/domain/user";

/*
 * Ports (driven side). Every method is async so that a remote adapter
 * (e.g. Postgres behind an API) can replace the localStorage adapters
 * without changing use cases or UI.
 */

export interface StudentRepository {
  list(): Promise<Student[]>;
  getById(id: string): Promise<Student | null>;
  listByCourse(courseId: string): Promise<Student[]>;
  listByGuardian(parentId: string): Promise<Student[]>;
  save(student: Student): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface CourseRepository {
  list(): Promise<Course[]>;
  getById(id: string): Promise<Course | null>;
  listByTeacher(teacherId: string): Promise<Course[]>;
  save(course: Course): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface UserRepository {
  list(): Promise<User[]>;
  getById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  listByRole(role: Role): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ReportCardRepository {
  list(): Promise<ReportCard[]>;
  findByStudent(studentId: string, year: number): Promise<ReportCard | null>;
  save(card: ReportCard): Promise<void>;
  deleteByStudent(studentId: string): Promise<void>;
}

/** Approval batches of a course period (see domain/period-review). */
export interface PeriodReviewRepository {
  listByCourse(courseId: string, year: number): Promise<PeriodReview[]>;
  getById(id: string): Promise<PeriodReview | null>;
  save(review: PeriodReview): Promise<void>;
  delete(id: string): Promise<void>;
}

/** Notes from Dirección to the teachers of a course, and when each teacher read them. */
export interface CourseNoteRepository {
  /** Newest first. */
  listByCourse(courseId: string, year: number): Promise<CourseNote[]>;
  save(note: CourseNote): Promise<void>;
  getSeenAt(teacherId: string, courseId: string): Promise<string | null>;
  markSeen(teacherId: string, courseId: string, at: string): Promise<void>;
}

/** Exams of the courses (see domain/exam). */
export interface ExamRepository {
  /** Sorted by date, oldest first. */
  listByCourse(courseId: string, year: number): Promise<Exam[]>;
  /** Every course, sorted by date, oldest first. */
  listByYear(year: number): Promise<Exam[]>;
  getById(id: string): Promise<Exam | null>;
  save(exam: Exam): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface SessionStore {
  get(): Promise<Session | null>;
  set(session: Session): Promise<void>;
  clear(): Promise<void>;
}

export interface DemoDataManager {
  /** Restores the initial demo data set. */
  reset(): Promise<void>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(prefix: string): string;
}

/** Days a teacher will not be at school, registered by Dirección. */
export interface TeacherAbsenceRepository {
  /** Earliest first. */
  list(): Promise<TeacherAbsence[]>;
  getById(id: string): Promise<TeacherAbsence | null>;
  save(absence: TeacherAbsence): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface Repositories {
  students: StudentRepository;
  courses: CourseRepository;
  users: UserRepository;
  reportCards: ReportCardRepository;
  reviews: PeriodReviewRepository;
  notes: CourseNoteRepository;
  exams: ExamRepository;
  teacherAbsences: TeacherAbsenceRepository;
  session: SessionStore;
  demoData: DemoDataManager;
}
