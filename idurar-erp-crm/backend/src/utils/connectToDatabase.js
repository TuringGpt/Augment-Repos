const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

const connectionOptions = {
  serverSelectionTimeoutMS: 30000,
};

const connectToDatabase = (databaseUrl = process.env.DATABASE) => {
  if (!databaseUrl) {
    throw new Error('DATABASE environment variable is required to connect to MongoDB');
  }

  return mongoose.connect(databaseUrl, connectionOptions);
};

module.exports = connectToDatabase;