const db = require('./firebase');
const userCollection = db.collection('users');

async function getByEmail(email) {
  const result = await userCollection.where('email', '==', email).get();
  if(result.empty) {
    throw Error('Usuário não encontrado!');
  }
  const user = [];
  result.forEach(doc => user.push({id: doc.id, ...doc.data()}));

  return user[0];
}

module.exports = {
  getByEmail
};