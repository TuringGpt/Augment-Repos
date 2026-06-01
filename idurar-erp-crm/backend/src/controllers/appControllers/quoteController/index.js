const createCRUDController = require('@/controllers/middlewaresControllers/createCRUDController');
const methods = createCRUDController('Quote');

const convertQuoteToInvoice = require('./convertQuoteToInvoice');

methods.convert = convertQuoteToInvoice;
methods.mail = async (req, res) => {
  return res.status(200).json({
    success: true,
    result: null,
    message: 'Please Upgrade to Premium  Version to have full features',
  });
};

module.exports = methods;