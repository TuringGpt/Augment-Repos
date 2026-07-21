const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const invoiceService = require('@/services/invoiceService');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  let body = req.body;

  const { error, value } = schema.validate(body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [], taxRate = 0, discount = 0 } = value;

  // Compute item totals and invoice totals via the service layer
  const { items: computedItems, subTotal, taxTotal, total } = invoiceService.calculateInvoiceTotals(
    { items, taxRate }
  );

  body['subTotal'] = subTotal;
  body['taxTotal'] = taxTotal;
  body['total'] = total;
  body['items'] = computedItems;

  body['paymentStatus'] = invoiceService.getCreatePaymentStatus({ total, discount });
  body['createdBy'] = req.admin._id;

  // Creating a new document in the collection
  const result = await new Model(body).save();
  const fileId = 'invoice-' + result._id + '.pdf';
  const updateResult = await Model.findOneAndUpdate(
    { _id: result._id },
    { pdf: fileId },
    {
      new: true,
    }
  ).exec();
  // Returning successfull response

  await invoiceService.incrementLastInvoiceNumber();

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result: updateResult,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
