export type Role = "admin" | "teacher" | "parent";

export interface User {
  id: string;
  username: string;
  /** Demo only: plain text. A real adapter must store a password hash. */
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Session {
  userId: string;
  role: Role;
  displayName: string;
  startedAt: string;
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Dirección",
  teacher: "Docente",
  parent: "Familia",
};

export const ROLE_HOME: Record<Role, string> = {
  admin: "/admin",
  teacher: "/teacher",
  parent: "/parent",
};

export function displayName(user: Pick<User, "firstName" | "lastName">) {
  return `${user.firstName} ${user.lastName}`;
}
