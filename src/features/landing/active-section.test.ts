import { describe, expect, it } from "vitest";
import { activeSection } from "./active-section";

const ORDER = ["que-va-a-ver", "acceso", "instituto", "contacto"];

describe("landing scrollspy", () => {
  it("has no active link while only the hero is in view", () => {
    expect(activeSection(ORDER, new Set())).toBeNull();
    expect(activeSection(ORDER, new Set(["hero"]))).toBeNull();
  });

  it("marks the section crossing the reading line", () => {
    expect(activeSection(ORDER, new Set(["acceso"]))).toBe("acceso");
  });

  it("prefers the later section when two are in the band", () => {
    expect(activeSection(ORDER, new Set(["que-va-a-ver", "acceso"]))).toBe("acceso");
  });
});
