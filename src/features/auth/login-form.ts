/** Inline errors of the login form, by field. Empty when the form can be sent. */
export interface LoginErrors {
  username?: string;
  password?: string;
}

export function validateLogin(username: string, password: string): LoginErrors {
  const errors: LoginErrors = {};
  if (username.trim() === "") errors.username = "Ingrese su usuario";
  if (password === "") errors.password = "Ingrese su contraseña";
  return errors;
}

export function hasLoginErrors(errors: LoginErrors): boolean {
  return errors.username !== undefined || errors.password !== undefined;
}
