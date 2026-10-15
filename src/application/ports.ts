import type { Course } from "@/domain/course";
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

export interface Repositories {
  students: StudentRepository;
  courses: CourseRepository;
  users: UserRepository;
  reportCards: ReportCardRepository;
  session: SessionStore;
  demoData: DemoDataManager;
}
