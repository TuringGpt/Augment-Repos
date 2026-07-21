const invoiceService = require('@/services/appServices/invoiceService');
const schema = require('./schemaValidate');

const update = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const { items = [] } = value;

  if (items.length === 0) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Items cannot be empty',
    });
  }

  const result = await invoiceService.updateInvoice(req.params.id, value);

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Invoice not found',
    });
  }

  // Returning successfull response

  return res.status(200).json({
    success: true,
    result,
    message: 'we update this document ',
  });
};

module.exports = update;
