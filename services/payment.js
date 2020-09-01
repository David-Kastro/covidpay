const db = require('./firebase');
const paymentCollection = db.collection('payment');

async function findPaymentByPreferenceAndType(id, type) {
  const result = await paymentCollection
    .where('id', '==', id)
    .where('type', '==', type)
    .get();
  const payment = [];
  result.forEach(doc => payment.push({docId: doc.id, ...doc.data()}));

  return payment.length ? payment[0] : null;
}

async function savePayment(data) {
  const payment = await findPaymentByPreferenceAndType(data.id, data.type);
  if( !payment ) {
    const newPayment = await paymentCollection.add(data);
    return {id: newPayment.id}
  }
  const updatedPayment = await paymentCollection
    .doc(payment.docId)
    .set({...data}, {merge: true});

  return {id: updatedPayment.id}
}

module.exports = {
  findPaymentByPreferenceAndType,
  savePayment,
};