/*
  Invoice service layer.

  Encapsulates the invoice business logic that previously lived inline in the
  controllers (totals calculation, payment-status resolution and invoice number
  generation), so controllers only deal with the request/response cycle and the
  Mongoose model stays a thin data layer.
*/

const { calculate } = require('@/helpers');
const { increaseBySettingKey, readBySettingKey } = require('@/middlewares/settings');

// Compute each item total plus the invoice subTotal, taxTotal and total.
// Returns a new items array so the caller does not rely on in-place mutation.
const calculateInvoiceTotals = ({ items = [], taxRate = 0 }) => {
  let subTotal = 0;

  const computedItems = items.map((item) => {
    const total = calculate.multiply(item['quantity'], item['price']);
    subTotal = calculate.add(subTotal, total);
    return { ...item, total };
  });

  const taxTotal = calculate.multiply(subTotal, taxRate / 100);
  const total = calculate.add(subTotal, taxTotal);

  return { items: computedItems, subTotal, taxTotal, total };
};

// Payment status for a brand new invoice (no prior credit recorded yet).
const getCreatePaymentStatus = ({ total, discount = 0 }) => {
  return calculate.sub(total, discount) === 0 ? 'paid' : 'unpaid';
};

// Payment status for an existing invoice, accounting for credit already paid.
const getUpdatePaymentStatus = ({ total, discount = 0, credit = 0 }) => {
  return calculate.sub(total, discount) === credit
    ? 'paid'
    : credit > 0
    ? 'partially'
    : 'unpaid';
};

// Number generation: the next invoice number derived from the persisted counter.
const getNextInvoiceNumber = async () => {
  const lastNumberSetting = await readBySettingKey({ settingKey: 'last_invoice_number' });
  const lastNumber = lastNumberSetting?.settingValue ?? 0;
  return lastNumber + 1;
};

// Advance the persisted invoice counter after a successful create.
const incrementLastInvoiceNumber = async () => {
  return increaseBySettingKey({ settingKey: 'last_invoice_number' });
};

module.exports = {
  calculateInvoiceTotals,
  getCreatePaymentStatus,
  getUpdatePaymentStatus,
  getNextInvoiceNumber,
  incrementLastInvoiceNumber,
};
