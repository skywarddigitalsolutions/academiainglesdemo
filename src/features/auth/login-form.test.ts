import { describe, expect, it } from "vitest";
import { hasLoginErrors, validateLogin } from "./login-form";

describe("login form validation", () => {
  it("asks for both fields when they are empty", () => {
    expect(validateLogin("", "")).toEqual({
      username: "Ingrese su usuario",
      password: "Ingrese su contraseña",
    });
  });

  it("treats a username made only of spaces as empty", () => {
    expect(validateLogin("   ", "demo123")).toEqual({ username: "Ingrese su usuario" });
  });

  it("asks only for the missing password", () => {
    expect(validateLogin("padre", "")).toEqual({ password: "Ingrese su contraseña" });
  });

  it("has no errors when both fields are filled", () => {
    const errors = validateLogin("padre", "demo123");
    expect(errors).toEqual({});
    expect(hasLoginErrors(errors)).toBe(false);
    expect(hasLoginErrors(validateLogin("", ""))).toBe(true);
  });
});
