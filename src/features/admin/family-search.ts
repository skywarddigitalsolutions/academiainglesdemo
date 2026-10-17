import { normalize } from "./student-search";

interface Person {
  firstName: string;
  lastName: string;
}

interface FamilyLike {
  parent: Person & { username: string };
  children: (Person & { courseId: string })[];
}

/** Families with at least one child in the course (a family may appear in several courses). */
export function familiesInCourse<T extends FamilyLike>(items: T[], courseId: string): T[] {
  return items.filter(({ children }) => children.some((c) => c.courseId === courseId));
}

/**
 * Families whose guardian name, username or children's names contain every
 * word of the query (case and accents ignored, any order). An empty query
 * returns nobody.
 */
export function searchFamilies<T extends FamilyLike>(items: T[], query: string): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return items.filter(({ parent, children }) => {
    const text = normalize(
      [
        parent.firstName,
        parent.lastName,
        parent.username,
        ...children.map((c) => `${c.firstName} ${c.lastName}`),
      ].join(" "),
    );
    return words.every((w) => text.includes(w));
  });
}
