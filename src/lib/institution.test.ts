import { describe, expect, it } from "vitest";
import { INSTITUTION_CONTACT } from "./institution";

describe("institution contact", () => {
  it("keeps the Secretaría contact shown on the landing", () => {
    expect(INSTITUTION_CONTACT.email).toBe("secretaria@inmaculada.edu.ar");
    expect(INSTITUTION_CONTACT.phone).toBe("(011) 4000-0000");
  });
});
