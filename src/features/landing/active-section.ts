/**
 * Scrollspy: the navigation section currently crossing the reading line.
 * `inBand` holds the ids of the sections inside that line; when two are in
 * it (a section ending, the next starting) the later one wins.
 */
export function activeSection(order: readonly string[], inBand: ReadonlySet<string>): string | null {
  for (let i = order.length - 1; i >= 0; i--) {
    if (inBand.has(order[i])) return order[i];
  }
  return null;
}
