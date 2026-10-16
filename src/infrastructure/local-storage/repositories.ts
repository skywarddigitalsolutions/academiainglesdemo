import type {
  CourseRepository,
  DemoDataManager,
  ReportCardRepository,
  Repositories,
  SessionStore,
  StudentRepository,
  UserRepository,
} from "@/application/ports";
import type { Course } from "@/domain/course";
import type { ReportCard } from "@/domain/report-card";
import type { Student } from "@/domain/student";
import type { Role, Session, User } from "@/domain/user";
import { buildSeed, type SeedData } from "../seed/seed-data";
import { LocalStorageCollection } from "./local-storage-collection";
import { STORAGE_PREFIX, type StorageLike } from "./storage";

/** Bump when the stored shape changes so old browsers get a fresh seed. */
const DATA_VERSION = "v2:";

const KEYS = {
  users: `${STORAGE_PREFIX}${DATA_VERSION}users`,
  courses: `${STORAGE_PREFIX}${DATA_VERSION}courses`,
  students: `${STORAGE_PREFIX}${DATA_VERSION}students`,
  reportCards: `${STORAGE_PREFIX}${DATA_VERSION}report-cards`,
  session: `${STORAGE_PREFIX}session`,
} as const;

const byLastName = (a: Student, b: Student) =>
  a.lastName.localeCompare(b.lastName, "es") ||
  a.firstName.localeCompare(b.firstName, "es");

class LocalStorageUserRepository implements UserRepository {
  constructor(private readonly items: LocalStorageCollection<User>) {}

  async list() {
    return this.items.all();
  }
  async getById(id: string) {
    return this.items.find((u) => u.id === id);
  }
  async findByUsername(username: string) {
    const normalized = username.trim().toLowerCase();
    return this.items.find((u) => u.username.toLowerCase() === normalized);
  }
  async listByRole(role: Role) {
    return this.items
      .filter((u) => u.role === role)
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "es"));
  }
  async save(user: User) {
    this.items.upsert(user);
  }
  async delete(id: string) {
    this.items.remove(id);
  }
}

class LocalStorageCourseRepository implements CourseRepository {
  constructor(private readonly items: LocalStorageCollection<Course>) {}

  async list() {
    return this.items.all();
  }
  async getById(id: string) {
    return this.items.find((c) => c.id === id);
  }
  async listByTeacher(teacherId: string) {
    return this.items.filter((c) => c.teacherIds.includes(teacherId));
  }
}

class LocalStorageStudentRepository implements StudentRepository {
  constructor(private readonly items: LocalStorageCollection<Student>) {}

  async list() {
    return this.items.all().sort(byLastName);
  }
  async getById(id: string) {
    return this.items.find((s) => s.id === id);
  }
  async listByCourse(courseId: string) {
    return this.items.filter((s) => s.courseId === courseId).sort(byLastName);
  }
  async listByGuardian(parentId: string) {
    return this.items
      .filter((s) => s.guardianIds.includes(parentId))
      .sort(byLastName);
  }
  async save(student: Student) {
    this.items.upsert(student);
  }
  async delete(id: string) {
    this.items.remove(id);
  }
}

class LocalStorageReportCardRepository implements ReportCardRepository {
  constructor(private readonly items: LocalStorageCollection<ReportCard>) {}

  async list() {
    return this.items.all();
  }
  async findByStudent(studentId: string, year: number) {
    return this.items.find((c) => c.studentId === studentId && c.year === year);
  }
  async save(card: ReportCard) {
    this.items.upsert(card);
  }
  async deleteByStudent(studentId: string) {
    this.items.removeWhere((c) => c.studentId === studentId);
  }
}

class LocalStorageSessionStore implements SessionStore {
  private memory: Session | null = null;

  constructor(private readonly storage: StorageLike | null) {}

  async get() {
    try {
      const raw = this.storage?.getItem(KEYS.session) ?? null;
      if (raw === null) return this.storage ? null : this.memory;
      const parsed = JSON.parse(raw) as Session;
      return parsed && typeof parsed.userId === "string" ? parsed : null;
    } catch {
      return this.memory;
    }
  }
  async set(session: Session) {
    this.memory = session;
    try {
      this.storage?.setItem(KEYS.session, JSON.stringify(session));
    } catch {
      // Keep the session in memory only.
    }
  }
  async clear() {
    this.memory = null;
    try {
      this.storage?.removeItem(KEYS.session);
    } catch {
      // Nothing else to clear.
    }
  }
}

/**
 * Composition root for the localStorage adapters.
 * Swap this function for a database-backed factory to change persistence.
 */
export function createLocalStorageRepositories(
  storage: StorageLike | null,
  year: number,
): Repositories {
  let seedCache: SeedData | null = null;
  const seed = () => (seedCache ??= buildSeed(year));

  const users = new LocalStorageCollection(storage, KEYS.users, () => seed().users);
  const courses = new LocalStorageCollection(storage, KEYS.courses, () => seed().courses);
  const students = new LocalStorageCollection(storage, KEYS.students, () => seed().students);
  const reportCards = new LocalStorageCollection(
    storage,
    KEYS.reportCards,
    () => seed().reportCards,
  );

  const demoData: DemoDataManager = {
    async reset() {
      for (const collection of [users, courses, students, reportCards]) {
        collection.reset();
      }
    },
  };

  return {
    users: new LocalStorageUserRepository(users),
    courses: new LocalStorageCourseRepository(courses),
    students: new LocalStorageStudentRepository(students),
    reportCards: new LocalStorageReportCardRepository(reportCards),
    session: new LocalStorageSessionStore(storage),
    demoData,
  };
}
