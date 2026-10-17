import { Schema, model, type HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '@/core/database/schema-options';

export interface Product {
  name: string;
  description?: string;
  price: number;
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;

const productSchema = new Schema<Product>(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  baseSchemaOptions,
);

// Compound index matching the most common list query (filter by category, newest first).
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ isActive: 1 });

export const ProductModel = model<Product>('Product', productSchema);
