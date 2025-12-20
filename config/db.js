const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb+srv://venkatesht6:venky457146@clusterelection.hewacgw.mongodb.net/?retryWrites=true&w=majority&appName=ClusterElection';
  try {
    await mongoose.connect(uri, { dbName: 'task_manager' });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('DB connection error', err);
    process.exit(1);
  }
};

module.exports = { connectDB };