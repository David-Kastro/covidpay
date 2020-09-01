const db = require('./firebase');
const examCollection = db.collection('exams');

async function findExamByPaymentId(payment_id) {
  const result = await examCollection
    .where('payment_id', '==', payment_id)
    .get();
  const exam = [];
  result.forEach(doc => exam.push({id: doc.id, ...doc.data()}));

  return exam.length ? exam[0] : null;
}

async function saveExam(data) {
  const exam = await findExamByPaymentId(data.payment_id);
  if( !exam ) {
    const newExam = await examCollection.add(data);
    return {id: newExam.id}
  }
  const updatedExam = await examCollection
    .doc(exam.id)
    .set({...data}, {merge: true});

  return {id: updatedExam.id}
}

module.exports = {
  findExamByPaymentId,
  saveExam,
};