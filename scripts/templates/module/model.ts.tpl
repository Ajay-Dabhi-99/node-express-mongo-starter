import { Schema, model, type HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '@/core/database/schema-options';

// TODO: replace these example fields with your real fields.
export interface __Name__ {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type __Name__Document = HydratedDocument<__Name__>;

const __name__Schema = new Schema<__Name__>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

__name__Schema.index({ isActive: 1, createdAt: -1 });

export const __Name__Model = model<__Name__>('__Name__', __name__Schema);
