/** Lower-case text without accents, for accent-insensitive matching. */
export const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Students whose name contains every word of the query (case and accents
 * ignored, any order). An empty query returns nobody.
 */
export function searchStudents<T extends { student: { firstName: string; lastName: string } }>(
  items: T[],
  query: string,
): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return items.filter(({ student }) => {
    const name = normalize(`${student.firstName} ${student.lastName}`);
    return words.every((w) => name.includes(w));
  });
}
