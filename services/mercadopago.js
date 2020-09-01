const mercadopago = require('mercadopago');
const config = require('../config/mercadopago');

mercadopago.configure({
  sandbox: true,
  access_token: config.accessToken
})

module.exports = mercadopago;