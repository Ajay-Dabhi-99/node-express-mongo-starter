/** Escapes user input before using it inside a RegExp (prevents regex injection / ReDoS). */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
