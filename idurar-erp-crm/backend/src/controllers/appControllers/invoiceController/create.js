const invoiceService = require('@/services/appServices/invoiceService');
const schema = require('./schemaValidate');

const create = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    const { details } = error;
    return res.status(400).json({
      success: false,
      result: null,
      message: details[0]?.message,
    });
  }

  const result = await invoiceService.createInvoice(value, req.admin._id);

  // Returning successfull response
  return res.status(200).json({
    success: true,
    result,
    message: 'Invoice created successfully',
  });
};

module.exports = create;
