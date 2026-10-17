import mongoose, { type ClientSession } from 'mongoose';

/**
 * Runs several DB writes as ONE atomic unit: all succeed or all roll back.
 * Atlas always runs a replica set, so transactions work on every tier.
 *
 * @example
 * await withTransaction(async (session) => {
 *   await OrderModel.create([{ ... }], { session });
 *   await ProductModel.updateOne({ _id }, { $inc: { stock: -1 } }, { session });
 * });
 */
export async function withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
