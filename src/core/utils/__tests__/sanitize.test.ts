import { describe, expect, it } from 'vitest';
import { sanitizeInPlace } from '../sanitize';

describe('sanitizeInPlace', () => {
  it('removes Mongo operators, dotted keys and prototype-pollution keys (deeply)', () => {
    const input: Record<string, unknown> = JSON.parse(
      '{"email":{"$gt":""},"a.b":1,"__proto__":{"admin":true},"nested":[{"$where":"x","ok":1}],"name":"ok"}',
    );

    sanitizeInPlace(input);

    expect(input).toEqual({ email: {}, nested: [{ ok: 1 }], name: 'ok' });
  });

  it('ignores primitives and null', () => {
    expect(() => sanitizeInPlace(null)).not.toThrow();
    expect(() => sanitizeInPlace('text')).not.toThrow();
  });
});
