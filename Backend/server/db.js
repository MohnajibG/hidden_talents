import mongoose from "mongoose";

// The connection is cached so requests don't open a new one every time.
const cache = globalThis.__mongoose || (globalThis.__mongoose = { conn: null, promise: null });

export const connectDb = async () => {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is missing from the environment variables");
    cache.promise = mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  }
  cache.conn = await cache.promise;
  return cache.conn;
};

export const proofBucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "proofs" });
