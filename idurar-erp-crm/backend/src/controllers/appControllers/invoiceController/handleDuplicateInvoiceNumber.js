const DUPLICATE_KEY_ERROR_CODE = 11000;

const isDuplicateInvoiceNumberError = (error) => {
  return (
    error?.code === DUPLICATE_KEY_ERROR_CODE &&
    (error?.keyPattern?.number || error?.keyValue?.number !== undefined)
  );
};

const handleDuplicateInvoiceNumber = (error, res) => {
  if (!isDuplicateInvoiceNumberError(error)) {
    throw error;
  }

  return res.status(409).json({
    success: false,
    result: null,
    message: 'Invoice number already exists. Please use a unique invoice number.',
  });
};

module.exports = handleDuplicateInvoiceNumber;