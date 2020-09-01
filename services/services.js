const db = require('./firebase');

async function all() {
  let data = {};
  const result = await db.collection('services').get();
  result.forEach(doc => {
    const docData = doc.data();
    data = { ...data, [docData.tag]: { id: doc.id, ...docData } }
  });
  return data;
}

module.exports = {
  all,
};