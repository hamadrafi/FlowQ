const mongoose = require('mongoose');
const uri = "mongodb://adminhamad1:hamadadmin1@ac-mw7sdrk-shard-00-00.lprpn2a.mongodb.net:27017,ac-mw7sdrk-shard-00-01.lprpn2a.mongodb.net:27017,ac-mw7sdrk-shard-00-02.lprpn2a.mongodb.net:27017/test?authSource=admin&tls=true&tlsInsecure=true";

async function test() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(uri);
    console.log('✅ Connection successful');
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err);
    process.exit(1);
  }
}

test();
