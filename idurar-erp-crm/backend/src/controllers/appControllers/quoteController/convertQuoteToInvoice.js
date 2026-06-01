const mongoose = require('mongoose');

const { calculate } = require('@/helpers');

const calculateQuoteTotals = (items, taxRate) => {
  let subTotal = 0;

  const calculatedItems = items.map((item) => {
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

  const taxTotal = calculate.multiply(subTotal, taxRate / 100);

  return {
    items: calculatedItems,
    subTotal,
    taxTotal,
    total: calculate.add(subTotal, taxTotal),
  };
};

const convertQuoteToInvoice = async (req, res) => {
  const Quote = mongoose.model('Quote');
  const Invoice = mongoose.model('Invoice');

  const quote = await Quote.findOne({ _id: req.params.id, removed: false }).exec();

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

  const { items, subTotal, taxTotal, total } = calculateQuoteTotals(
    quote.items || [],
    quote.taxRate || 0
  );
  const invoice = await new Invoice({
    createdBy: req.admin?._id || quote.createdBy,
    number: quote.number,
    year: quote.year,
    content: quote.content,
    date: quote.date,
    expiredDate: quote.expiredDate,
    client: quote.client,
    converted: { from: 'quote', quote: quote._id },
    items,
    taxRate: quote.taxRate || 0,
    subTotal,
    taxTotal,
    total,
    currency: quote.currency,
    discount: quote.discount || 0,
    notes: quote.notes,
    status: 'draft',
    paymentStatus: calculate.sub(total, quote.discount || 0) === 0 ? 'paid' : 'unpaid',
  }).save();

  const result = await Invoice.findOneAndUpdate(
    { _id: invoice._id },
    { pdf: 'invoice-' + invoice._id + '.pdf' },
    { new: true }
  ).exec();

  await Quote.findOneAndUpdate(
    { _id: quote._id, removed: false },
    { converted: true, status: 'accepted' },
    { new: true }
  ).exec();

  return res.status(200).json({
    success: true,
    result,
    message: 'Quote converted to invoice successfully',
  });
};

module.exports = convertQuoteToInvoice;