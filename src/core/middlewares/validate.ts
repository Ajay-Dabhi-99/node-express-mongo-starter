import type { Request, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '@/core/errors/app-error';
import { formatZodIssues, type ValidationIssue } from '@/core/errors/format-zod-issues';

interface RequestSchemas {
  params?: ZodTypeAny;
  query?: ZodTypeAny;
  body?: ZodTypeAny;
}

const LOCATIONS = ['params', 'query', 'body'] as const;

/**
 * Validates params / query / body with Zod BEFORE the controller runs.
 * - Invalid → 400 with every problem listed.
 * - Valid → the request gets the PARSED values (trimmed, coerced, defaults applied,
 *   unknown keys removed), so controllers can trust their input.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    const issues: ValidationIssue[] = [];
    const parsed: Partial<Record<(typeof LOCATIONS)[number], unknown>> = {};

    for (const location of LOCATIONS) {
      const schema = schemas[location];
      if (!schema) continue;

      const result = schema.safeParse(req[location]);
      if (result.success) {
        parsed[location] = result.data;
      } else {
        issues.push(...formatZodIssues(result.error, location));
      }
    }

    if (issues.length > 0) {
      next(new ValidationError(issues));
      return;
    }

    if ('body' in parsed) req.body = parsed.body;
    if ('params' in parsed) req.params = parsed.params as Request['params'];
    if ('query' in parsed) {
      // Express 5 exposes req.query as a getter, so it is redefined instead of reassigned.
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
  };
}

/** Typed access to a query that was already validated by `validate({ query })`. */
export function validatedQuery<T>(req: Request): T {
  return req.query as unknown as T;
}
