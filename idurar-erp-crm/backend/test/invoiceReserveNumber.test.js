const assert = require('node:assert/strict');
const test = require('node:test');

const {
  INVOICE_NUMBER_SETTING_KEY,
  isDuplicateInvoiceNumberError,
  reserveNextInvoiceNumber,
} = require('../src/controllers/appControllers/invoiceController/reserveInvoiceNumber');

test('reserveNextInvoiceNumber returns the atomically incremented setting value', async () => {
  let receivedArgs;

  const invoiceNumber = await reserveNextInvoiceNumber(async (args) => {
    receivedArgs = args;
    return { settingValue: 42 };
  });

  assert.deepEqual(receivedArgs, { settingKey: INVOICE_NUMBER_SETTING_KEY });
  assert.equal(invoiceNumber, 42);
});

test('reserveNextInvoiceNumber rejects missing or invalid setting values', async () => {
  await assert.rejects(
    reserveNextInvoiceNumber(async () => null),
    /Unable to reserve invoice number/
  );

  await assert.rejects(
    reserveNextInvoiceNumber(async () => ({ settingValue: 'not-a-number' })),
    /Unable to reserve invoice number/
  );
});

test('isDuplicateInvoiceNumberError only matches duplicate invoice number errors', () => {
  assert.equal(
    isDuplicateInvoiceNumberError({ code: 11000, keyPattern: { number: 1, year: 1 } }),
    true
  );
  assert.equal(isDuplicateInvoiceNumberError({ code: 11000, keyPattern: { email: 1 } }), false);
  assert.equal(isDuplicateInvoiceNumberError({ code: 12345, keyPattern: { number: 1 } }), false);
});