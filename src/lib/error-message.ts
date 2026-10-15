import { DomainError } from "@/domain/errors";

export function errorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  return "Ocurrió un error inesperado. Intente nuevamente.";
}
