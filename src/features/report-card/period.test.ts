import { describe, expect, it } from "vitest";
import { periodPillLabel } from "./period";

describe("periodPillLabel", () => {
  it("uses the ordinal for bimesters and the word for the closing", () => {
    expect(periodPillLabel(1)).toBe("1°");
    expect(periodPillLabel(4)).toBe("4°");
    expect(periodPillLabel("closing")).toBe("Cierre");
  });
});
