const mongoose = require('mongoose');
const currency = require('currency.js');

const { calculate } = require('@/helpers');

const Model = mongoose.model('Invoice');

const getFrontendBaseUrl = () => {
  const baseUrl = process.env.STRIPE_CHECKOUT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  return baseUrl.replace(/\/$/, '');
};

const getInvoiceBalance = (invoice) => {
  const outstandingAmount = calculate.sub(
    calculate.sub(invoice.total || 0, invoice.discount || 0),
    invoice.credit || 0
  );

  if (outstandingAmount <= 0) {
    throw new Error('Invoice is already fully paid');
  }

  return {
    outstandingAmount,
    stripeAmount: currency(outstandingAmount).intValue,
  };
};

const getInvoiceCurrency = (invoice) => {
  const invoiceCurrency = String(invoice.currency || '')
    .trim()
    .toLowerCase();

  if (!invoiceCurrency || invoiceCurrency === 'na') {
    throw new Error('Invoice currency is not configured');
  }

  return invoiceCurrency;
};

const createStripeCheckout = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  const invoice = await Model.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();

  if (!invoice) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Invoice not found',
    });
  }

  const frontendBaseUrl = getFrontendBaseUrl();
  const { outstandingAmount, stripeAmount } = getInvoiceBalance(invoice);
  const currencyCode = getInvoiceCurrency(invoice);
  const invoiceLabel = `Invoice #${invoice.number}/${invoice.year}`;

  const formData = new URLSearchParams();
  formData.append('mode', 'payment');
  formData.append('submit_type', 'pay');
  formData.append('success_url', `${frontendBaseUrl}/invoice/read/${invoice._id}?checkout=success`);
  formData.append('cancel_url', `${frontendBaseUrl}/invoice/read/${invoice._id}?checkout=cancelled`);
  formData.append('client_reference_id', invoice._id.toString());
  formData.append('metadata[invoiceId]', invoice._id.toString());
  formData.append('metadata[invoiceNumber]', `${invoice.number}/${invoice.year}`);
  formData.append('metadata[invoiceBalance]', String(outstandingAmount));
  formData.append('line_items[0][price_data][currency]', currencyCode);
  formData.append('line_items[0][price_data][product_data][name]', invoiceLabel);
  formData.append('line_items[0][price_data][product_data][description]', 'Outstanding invoice balance payment');
  formData.append('line_items[0][price_data][unit_amount]', String(stripeAmount));
  formData.append('line_items[0][quantity]', '1');

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.url) {
    throw new Error(result?.error?.message || 'Unable to create Stripe checkout session');
  }

  return res.status(200).json({
    success: true,
    result: {
      id: result.id,
      url: result.url,
    },
    message: 'Stripe checkout session created successfully',
  });
};

module.exports = createStripeCheckout;