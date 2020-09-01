const db = require('./firebase');

async function all() {
  let data = [];
  const result = await db.collection('clinics').get();
  result.forEach(doc => {data = [...data, {id: doc.id, ...doc.data()}]});
  return data;
}

async function getByIds(ids) {
  const clinics1 = await db.collection('clinics').doc(ids[0]).get();
  const clinics2 = await db.collection('clinics').doc(ids[1]).get();
  return [clinics1.data(), clinics2.data()].filter(doc => !!doc);
}

module.exports = {
  all,
  getByIds
};