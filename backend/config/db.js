const mongoose = require('mongoose');

// In serverless environments (like Vercel), each function invocation can
// reuse a "warm" instance, so we cache the connection on the global object
// to avoid reconnecting to MongoDB on every request.
let cached = global._marginaliaMongooseConn;
if (!cached) {
  cached = global._marginaliaMongooseConn = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing. Add it to your .env file (see .env.example) or your host\'s environment variables.');
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => {
      console.log('Connected to MongoDB.');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = connectDB;
