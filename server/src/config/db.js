import mongoose from 'mongoose';

// Production must use the configured MongoDB Atlas URI. Never silently switch
// to an embedded/local database, because that can make accounts appear missing
// or already registered in a different database.
export const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGODB_URI || (isProduction ? '' : 'mongodb://127.0.0.1:27017/menuqr');

  if (!uri) {
    throw new Error('[Database] MONGODB_URI is required in production. Add your MongoDB Atlas URI to Render Environment Variables.');
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log(
      `[Database] Connected successfully. Database: ${mongoose.connection.name}; Host: ${mongoose.connection.host}`
    );
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error.message);
    // Fail startup instead of using a different database behind the scenes.
    throw error;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
};
