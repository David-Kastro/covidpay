const db = require('./firebase');

async function getByIds(ids) {
  const labs1 = await db.collection('labs').doc(ids[0]).get();
  const labs2 = await db.collection('labs').doc(ids[1]).get();
  return [labs1.data(), labs2.data()].filter(doc => !!doc);
}

module.exports = {
  getByIds
};