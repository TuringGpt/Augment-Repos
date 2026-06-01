const mongoose = require('mongoose');

const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const { calculate } = require('@/helpers');
const { increaseBySettingKey } = require('@/middlewares/settings');

const convert = async (req, res) => {
  const { id } = req.params;

  // Find the quote
  const quote = await Quote.findOne({ _id: id, removed: false });

  if (!quote) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Quote not found',
    });
  }

  if (quote.converted) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Quote has already been converted to an invoice',
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = quote;

  // Recalculate totals from items
  let subTotal = 0;
  let taxTotal = 0;
  let total = 0;

  const invoiceItems = items.map((item) => {
    const itemTotal = calculate.multiply(item.quantity, item.price);
    subTotal = calculate.add(subTotal, itemTotal);
    return {
      itemName: item.itemName,
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      total: itemTotal,
    };
  });

  taxTotal = calculate.multiply(subTotal, taxRate / 100);
  total = calculate.add(subTotal, taxTotal);

  const paymentStatus = calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';

  // Determine the next invoice number from settings (best-effort)
  let invoiceNumber = quote.number;
  try {
    const Setting = mongoose.model('Setting');
    const setting = await Setting.findOne({ settingKey: 'last_invoice_number' });
    if (setting) {
      invoiceNumber = (setting.settingValue || 0) + 1;
    }
  } catch (_) {
    // use quote number as fallback
  }

  // Build the invoice document
  const invoiceData = {
    createdBy: req.admin._id,
    number: invoiceNumber,
    year: quote.year,
    date: quote.date,
    expiredDate: quote.expiredDate,
    client: quote.client._id || quote.client,
    items: invoiceItems,
    taxRate,
    subTotal,
    taxTotal,
    total,
    currency: quote.currency,
    discount,
    notes: quote.notes,
    status: 'draft',
    paymentStatus,
    converted: {
      from: 'quote',
      quote: quote._id,
    },
  };

  const invoice = await new Invoice(invoiceData).save();

  const fileId = 'invoice-' + invoice._id + '.pdf';
  await Invoice.findOneAndUpdate({ _id: invoice._id }, { pdf: fileId }, { new: true }).exec();

  // Mark the quote as converted
  await Quote.findOneAndUpdate(
    { _id: id },
    { converted: true, status: 'accepted', invoice: invoice._id },
    { new: true }
  ).exec();

  increaseBySettingKey({ settingKey: 'last_invoice_number' });

  return res.status(200).json({
    success: true,
    result: invoice,
    message: 'Quote successfully converted to invoice',
  });
};

module.exports = convert;
