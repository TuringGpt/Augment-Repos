require('module-alias/register');

const assert = require('node:assert/strict');
const http = require('node:http');
const { afterEach, test } = require('node:test');

const express = require('express');
const mongoose = require('mongoose');

const { catchErrors } = require('../../src/handlers/errorHandlers');

const originalMongooseModel = mongoose.model;

afterEach(() => {
  mongoose.model = originalMongooseModel;
  delete require.cache[require.resolve('../../src/controllers/appControllers/quoteController/convertQuoteToInvoice')];
});

const requestConvert = async ({ quote, quoteUpdates = [] }) => {
  const savedInvoices = [];
  const invoiceUpdates = [];

  class InvoiceModel {
    constructor(data) {
      Object.assign(this, data, { _id: 'invoice-id' });
    }

    async save() {
      savedInvoices.push({ ...this });
      return this;
    }

    static findOneAndUpdate(query, update) {
      invoiceUpdates.push({ query, update });
      return { exec: async () => ({ ...savedInvoices[0], ...update }) };
    }
  }

  const QuoteModel = {
    findOne(query) {
      return { exec: async () => (query._id === quote._id ? quote : null) };
    },
    findOneAndUpdate(query, update) {
      quoteUpdates.push({ query, update });
      return { exec: async () => ({ ...quote, ...update }) };
    },
  };

  mongoose.model = (name) =>
    ({ Quote: QuoteModel, Invoice: InvoiceModel })[name] ||
    originalMongooseModel.call(mongoose, name);

  const convertQuoteToInvoice = require('../../src/controllers/appControllers/quoteController/convertQuoteToInvoice');
  const app = express();
  app.get(
    '/api/quote/convert/:id',
    (req, res, next) => {
      req.admin = { _id: 'admin-id' };
      next();
    },
    catchErrors(convertQuoteToInvoice)
  );

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/quote/convert/${quote._id}`);
    return {
      status: response.status,
      body: await response.json(),
      savedInvoice: savedInvoices[0],
      invoiceUpdates,
      quoteUpdates,
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

test('GET /api/quote/convert/:id recalculates totals, taxes, and status', async () => {
  const result = await requestConvert({
    quote: {
      _id: 'quote-id',
      createdBy: 'admin-id',
      number: 42,
      year: 2026,
      date: '2026-06-01',
      expiredDate: '2026-07-01',
      client: 'client-id',
      currency: 'USD',
      taxRate: 10,
      items: [
        { itemName: 'Implementation', quantity: 2, price: 100, total: 999 },
        { itemName: 'Support', quantity: 3, price: 50, total: 999 },
      ],
    },
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(result.body.result.subTotal, 350);
  assert.equal(result.body.result.taxTotal, 35);
  assert.equal(result.body.result.total, 385);
  assert.equal(result.body.result.status, 'draft');
  assert.equal(result.body.result.paymentStatus, 'unpaid');
  assert.deepEqual(result.body.result.items.map((item) => item.total), [200, 150]);
  assert.equal(result.quoteUpdates[0].update.status, 'accepted');
  assert.equal(result.quoteUpdates[0].update.converted, true);
});

test('GET /api/quote/convert/:id allows a zero-quantity line without changing totals', async () => {
  const result = await requestConvert({
    quote: {
      _id: 'quote-id',
      createdBy: 'admin-id',
      number: 43,
      year: 2026,
      date: '2026-06-01',
      expiredDate: '2026-07-01',
      client: 'client-id',
      currency: 'USD',
      taxRate: 8.25,
      items: [
        { itemName: 'Discovery', quantity: 0, price: 125, total: 500 },
        { itemName: 'Delivery', quantity: 4, price: 25, total: 500 },
      ],
    },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body.result.items.map((item) => item.total), [0, 100]);
  assert.equal(result.body.result.subTotal, 100);
  assert.equal(result.body.result.taxTotal, 8.25);
  assert.equal(result.body.result.total, 108.25);
  assert.equal(result.body.result.status, 'draft');
});