const mongoose = require('mongoose');

// Bypassing SRV lookup by using direct shard address
const uri = "mongodb://adminhamad1:hamadadmin1@ac-mw7sdrk-shard-00-00.lprpn2a.mongodb.net:27017/test?ssl=true&authSource=admin&retryWrites=true&w=majority";

async function run() {
  console.log('Testing connection to MongoDB...');
  console.log('URI:', uri.replace(/:([^@]+)@/, ':****@')); // Hide password in logs
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
    process.exit(0);
  } catch (err) {
    console.error('❌ FAILED:');
    console.error(err);
    process.exit(1);
  }
}

run();
