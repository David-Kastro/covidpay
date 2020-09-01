const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const mercadopago = require('./services/mercadopago');
const paymentService = require('./services/payment');
const examService = require('./services/exam');
const usersService = require('./services/users');
const template = require('./helpers/template')

const app = express();

app.use(cors({ origin: true }));

const TEST = true;

const prices = {
  1: 179.00,
  2: 199.00
};

const examTypes = {
  COLETA: {
    title: 'Coleta COVID-19',
    description : 'Coleta para o teste da COVID-19',
    quantity: 1,
    currency_id: 'BRL',
  },
  CONSULTA: {
    title: 'Consulta COVID-19',
    description : 'Consulta para o teste da COVID-19',
    quantity: 1,
    currency_id: 'BRL',
  }
}

app.get('/checkout/:email/:labs', async (req, res) => {
  const { email, labs } = req.params;
  const parsedLabs = JSON.parse(labs);

  try {

    if(parsedLabs.length !== 2) {
      throw Error('Laboratórios inválidos');
    }

    const user = await usersService.getByEmail(email);
    
    const purchaseOrder = {
      items: parsedLabs.map(lab => ({ 
        ...examTypes[lab.type],
        id: lab.id,
        category_id: lab.type,
        unit_price: prices[user.profile_type] / 2 
      })),
      payer : {
        email: user.email,
        name: user.name,
        identification: {
          type: 'CPF',
          number: user.identification.cpf
        },
        address: {
          zip_code: user.address.zip_code,
          street_number: Number(user.address.street_number || 0),
          street_name: user.address.neighborhood,
        },
      },
      auto_return : "all",
      external_reference : "1",
      back_urls : {
        success : "https://us-central1-covid-pay.cloudfunctions.net/payment/checkout/success",
        pending : "https://us-central1-covid-pay.cloudfunctions.net/payment/checkout/pending",
        failure : "https://us-central1-covid-pay.cloudfunctions.net/payment/checkout/failure",
      },
      notification_url: 'https://us-central1-covid-pay.cloudfunctions.net/payment/checkout/notification'
    }

    const preference = await mercadopago.preferences.create(purchaseOrder);

    return res.redirect(`${preference.body.init_point}`);

  } catch (err) {
    return res.send(err.message);
  }
});

app.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const preference = await mercadopago.preferences.get(id);
    return res.send(preference);
  }catch(err){
    return res.send(err.message);
  }
});

app.get('/checkout/success', (req, res) => {
  return res.send(template('success'));
});

app.get('/checkout/pending', (req, res) => {
  return res.send(template('pending'));
});

app.get('/checkout/failure', async (req, res) => {
  return res.send(template('failure'));
});

app.post('/checkout/notification', async (req, res) => {
  const { type } = req.query;

  if( type !== 'payment' ) {
    return res.status(200).send('ok');
  }

  const { data } = req.body;

  const resPayment = await mercadopago.payment.get(data.id);
  const payment = resPayment.body;

  const resOrder = await mercadopago.merchant_orders.get(payment.order.id);
  const order = resOrder.body;

  Promise.all(order.items.map(async item => {
    const newPayment = await paymentService.savePayment({
      id: payment.id,
      status: payment.status,
      status_detail: payment.status_detail,
      lab_id: item.id,
      type: item.category_id,
      price: item.unit_price,
      currency_id: item.currency_id,
      title: item.title,
      quantity: item.quantity,
      description: item.description,
      payer: payment.payer || null,
      barcode: payment.barcode || null,
      card: payment.card || null,
      date_approved: payment.date_approved ? new Date(payment.date_approved) : null,
      date_created: payment.date_created ? new Date(payment.date_created) : null,
      date_last_updated: payment.date_last_updated ? new Date(payment.date_last_updated) : null,
      date_of_expiration: payment.date_of_expiration ? new Date(payment.date_of_expiration) : null,
      operation_type: payment.operation_type || null,
      order: payment.order || null,
      payment_method_id: payment.payment_method_id || null,
      payment_type_id: payment.payment_type_id || null,
      operation_type: payment.operation_type || null,
      operation_type: payment.operation_type || null,
      operation_type: payment.operation_type || null,
      transaction_details: payment.transaction_details || null,
    });
    const newExam = await examService.saveExam({
      payment_id: newPayment.id || null,
      lab_id: item.id || null,
      type: item.category_id || null,
      client: TEST ? 'test@gmail.com' : payment.payer.email,
      status: payment.status,
      payment_status: payment.status,
      payment_status_detail: payment.status_detail,
      date_created: new Date(payment.date_created),
    });
    return { payment_id: newPayment.id, exam_id: newExam.id }
  }));

  return res.status(200).send('ok');
});


exports.payment = functions.https.onRequest(app);
