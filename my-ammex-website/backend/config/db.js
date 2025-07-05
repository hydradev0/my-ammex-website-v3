const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MONGODB_URI not found. Using in-memory database for development.');
      console.log('📝 To use a real database, create a .env file with MONGODB_URI=your_connection_string');
      
      // For development, we can continue without database
      // You can uncomment the line below to use an in-memory MongoDB
      // const conn = await mongoose.connect('mongodb://localhost:27017/ammex-website');
      
      console.log('🚀 Server running without database connection');
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log('⚠️  Continuing without database connection for development');
    // Don't exit process for development
    // process.exit(1);
  }
};

module.exports = connectDB; 