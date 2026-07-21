const INVOICE_NUMBER_SETTING_KEY = 'last_invoice_number';
const MAX_INVOICE_NUMBER_RETRIES = 5;

const getIncreaseBySettingKey = () => require('@/middlewares/settings').increaseBySettingKey;

const reserveNextInvoiceNumber = async (increaseSetting = getIncreaseBySettingKey()) => {
  const invoiceNumberSetting = await increaseSetting({
    settingKey: INVOICE_NUMBER_SETTING_KEY,
  });

  const nextInvoiceNumber = Number(invoiceNumberSetting?.settingValue);
  if (!Number.isFinite(nextInvoiceNumber) || nextInvoiceNumber < 1) {
    throw new Error('Unable to reserve invoice number');
  }

  return nextInvoiceNumber;
};

const isDuplicateInvoiceNumberError = (error) => {
  if (error?.code !== 11000) {
    return false;
  }

  const keyPattern = error.keyPattern || {};
  return Boolean(keyPattern.number || error.message?.includes('number'));
};

module.exports = {
  INVOICE_NUMBER_SETTING_KEY,
  MAX_INVOICE_NUMBER_RETRIES,
  isDuplicateInvoiceNumberError,
  reserveNextInvoiceNumber,
};