const mongoose = require('mongoose');

const { calculate } = require('@/helpers');
const { increaseBySettingKey, readBySettingKey } = require('@/middlewares/settings');

const LAST_INVOICE_NUMBER_SETTING_KEY = 'last_invoice_number';

const getInvoiceModel = () => mongoose.model('Invoice');

const calculateInvoiceTotals = ({ items = [], taxRate = 0 }) => {
  let subTotal = 0;

  const calculatedItems = items.map((item) => {
    const itemTotal = calculate.multiply(item['quantity'], item['price']);
    subTotal = calculate.add(subTotal, itemTotal);

    return {
      ...item,
      total: itemTotal,
    };
  });

  const taxTotal = calculate.multiply(subTotal, taxRate / 100);
  const total = calculate.add(subTotal, taxTotal);

  return {
    items: calculatedItems,
    subTotal,
    taxTotal,
    total,
  };
};

const getInvoicePaymentStatus = ({ total = 0, discount = 0, credit = 0 }) => {
  if (calculate.sub(total, discount) === credit) {
    return 'paid';
  }

  return credit > 0 ? 'partially' : 'unpaid';
};

const getNextInvoiceNumber = async ({ requestedNumber, requestedYear } = {}) => {
  const year = requestedYear || new Date().getFullYear();

  if (requestedNumber) {
    return {
      number: requestedNumber,
      year,
    };
  }

  const setting = await readBySettingKey({ settingKey: LAST_INVOICE_NUMBER_SETTING_KEY });
  const lastInvoiceNumber = Number(setting?.settingValue || 0);

  return {
    number: lastInvoiceNumber + 1,
    year,
  };
};

const createInvoice = async (payload, createdBy) => {
  const Invoice = getInvoiceModel();
  const body = { ...payload };
  const invoiceNumber = await getNextInvoiceNumber({
    requestedNumber: body.number,
    requestedYear: body.year,
  });
  const totals = calculateInvoiceTotals(body);

  Object.assign(body, invoiceNumber, totals, {
    paymentStatus: getInvoicePaymentStatus({
      total: totals.total,
      discount: body.discount,
      credit: body.credit,
    }),
    createdBy,
  });

  const result = await new Invoice(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';

  const invoiceWithPdf = await Invoice.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    { new: true }
  ).exec();

  await increaseBySettingKey({ settingKey: LAST_INVOICE_NUMBER_SETTING_KEY });

  return invoiceWithPdf;
};

const updateInvoice = async (invoiceId, payload) => {
  const Invoice = getInvoiceModel();
  const previousInvoice = await Invoice.findOne({
    _id: invoiceId,
    removed: false,
  });

  if (!previousInvoice) {
    return null;
  }

  const body = { ...payload };
  const totals = calculateInvoiceTotals(body);

  Object.assign(body, totals, {
    pdf: 'invoice-' + invoiceId + '.pdf',
    paymentStatus: getInvoicePaymentStatus({
      total: totals.total,
      discount: body.discount,
      credit: previousInvoice.credit,
    }),
  });

  if (body.hasOwnProperty('currency')) {
    delete body.currency;
  }

  return Invoice.findOneAndUpdate({ _id: invoiceId, removed: false }, body, {
    new: true,
  }).exec();
};

module.exports = {
  calculateInvoiceTotals,
  getInvoicePaymentStatus,
  getNextInvoiceNumber,
  createInvoice,
  updateInvoice,
};