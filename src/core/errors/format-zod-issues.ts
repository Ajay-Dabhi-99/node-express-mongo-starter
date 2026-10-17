import type { ZodError } from 'zod';

export interface ValidationIssue {
  location: string;
  path: string;
  message: string;
}

export function formatZodIssues(error: ZodError, location = 'body'): ValidationIssue[] {
  return error.issues.map((issue) => ({
    location,
    path: issue.path.join('.'),
    message: issue.message,
  }));
}
