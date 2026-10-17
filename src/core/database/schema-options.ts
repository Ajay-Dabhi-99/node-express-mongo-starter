/**
 * Shared schema options so every collection behaves the same:
 * - createdAt / updatedAt added automatically
 * - no "__v" field
 * - API responses expose "id" instead of "_id"
 */
export function toJSONTransform(_doc: unknown, ret: Record<string, unknown>) {
  delete ret._id;
  return ret;
}

export const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true, transform: toJSONTransform },
  toObject: { virtuals: true, transform: toJSONTransform },
};
