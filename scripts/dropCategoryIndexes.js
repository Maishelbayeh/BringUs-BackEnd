const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://mais_helbayeh:ojTOYKEzJuyH1GCU@cluster0.9b4mdpc.mongodb.net/bringus?retryWrites=true&w=majority&appName=Cluster0';

async function dropIndexes() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const categories = db.collection('categories');
  const indexes = await categories.indexes();
  for (const idx of indexes) {
    if (idx.name !== '_id_') {
      try {
        await categories.dropIndex(idx.name);
        console.log('Dropped index:', idx.name);
      } catch (e) {
        console.log('Could not drop index:', idx.name, e.message);
      }
    }
  }
  await mongoose.disconnect();
  console.log('All non-_id_ indexes dropped.');
}

dropIndexes(); 