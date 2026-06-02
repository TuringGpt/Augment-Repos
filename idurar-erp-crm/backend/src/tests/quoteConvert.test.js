'use strict';

/**
 * Integration tests for GET /api/quote/convert/:id
 *
 * Covers:
 *  - Correct subTotal / taxTotal / total propagated to the generated Invoice
 *  - Quote status set to "accepted" and converted flag set to true
 *  - Invoice paymentStatus derived correctly
 *  - Edge case: one line item has zero quantity
 *  - Already-converted quote returns 400
 *  - Non-existent quote returns 404
 *  - Missing auth token returns 401
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const request = require('supertest');

// ── Load module-alias so @/ paths resolve inside the app ──────────────────────
require('module-alias/register');

process.env.JWT_SECRET = 'test_jwt_secret_key';

// ── Lazily require the app AFTER env vars are set ────────────────────────────
let app;
let mongod;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create an Admin + AdminPassword and return a signed token that the
 * isValidAuthToken middleware will accept.
 */
async function createAdminWithToken() {
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');

  const admin = await new Admin({
    email: 'test@example.com',
    name: 'Test Admin',
    enabled: true,
  }).save();

  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

  await new AdminPassword({
    user: admin._id,
    password: 'hashed_password',
    salt: 'some_salt',
    emailVerified: true,
    loggedSessions: [token],
  }).save();

  return { admin, token };
}

/**
 * Insert a Client document and return it.
 */
async function createClient(adminId) {
  const Client = mongoose.model('Client');
  return Client.create({ name: 'ACME Corp', createdBy: adminId });
}

/**
 * Build a Quote document for the given client/admin.
 */
function buildQuoteData(clientId, adminId, overrides = {}) {
  return {
    createdBy: adminId,
    number: 1001,
    year: 2024,
    date: new Date(),
    expiredDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    client: clientId,
    currency: 'USD',
    taxRate: 10,
    discount: 0,
    status: 'pending',
    converted: false,
    items: [
      { itemName: 'Widget A', quantity: 2, price: 50, total: 100 },
      { itemName: 'Widget B', quantity: 3, price: 20, total: 60 },
    ],
    subTotal: 160,
    taxTotal: 16,
    total: 176,
    ...overrides,
  };
}

// ── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Register ALL models so mongoose.model() calls inside the app succeed
  require('../models/coreModels/Admin');
  require('../models/coreModels/AdminPassword');
  require('../models/coreModels/Setting');
  require('../models/coreModels/Upload');
  require('../models/appModels/Client');
  require('../models/appModels/Invoice');
  require('../models/appModels/Payment');
  require('../models/appModels/Quote');

  app = require('../app');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clean between tests so each test starts with a fresh DB state
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('GET /api/quote/convert/:id', () => {
  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app).get('/api/quote/convert/000000000000000000000001');
    expect(res.status).toBe(401);
  });

  it('returns 404 for a non-existent quote id', async () => {
    const { token } = await createAdminWithToken();
    const fakeId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/api/quote/convert/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('converts a quote and verifies subTotal, taxTotal, total on the invoice', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');
    const Invoice = mongoose.model('Invoice');

    const quote = await Quote.create(buildQuoteData(client._id, admin._id));

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const invoice = res.body.result;
    // items: 2×50 = 100, 3×20 = 60 → subTotal = 160
    expect(invoice.subTotal).toBe(160);
    // taxRate 10% → taxTotal = 16
    expect(invoice.taxTotal).toBe(16);
    // total = 160 + 16 = 176
    expect(invoice.total).toBe(176);
    expect(invoice.status).toBe('draft');
    expect(invoice.paymentStatus).toBe('unpaid');

    // Verify the persisted Invoice in DB
    const dbInvoice = await Invoice.findById(invoice._id);
    expect(dbInvoice).not.toBeNull();
    expect(dbInvoice.subTotal).toBe(160);
    expect(dbInvoice.taxTotal).toBe(16);
    expect(dbInvoice.total).toBe(176);
  });

  it('sets quote status to "accepted" and converted:true after conversion', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');

    const quote = await Quote.create(buildQuoteData(client._id, admin._id));

    await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    const updatedQuote = await Quote.findById(quote._id);
    expect(updatedQuote.converted).toBe(true);
    expect(updatedQuote.status).toBe('accepted');
  });

  it('links the invoice back to the quote via converted.quote field', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');
    const Invoice = mongoose.model('Invoice');

    const quote = await Quote.create(buildQuoteData(client._id, admin._id));

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const dbInvoice = await Invoice.findById(res.body.result._id);
    expect(dbInvoice.converted.from).toBe('quote');
    expect(dbInvoice.converted.quote.toString()).toBe(quote._id.toString());
  });

  it('returns 400 when attempting to convert an already-converted quote', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');

    const quote = await Quote.create(
      buildQuoteData(client._id, admin._id, { converted: true, status: 'accepted' })
    );

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already been converted/i);
  });

  it('edge case: one line item with zero quantity results in zero total for that line', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');
    const Invoice = mongoose.model('Invoice');

    // Items: qty=0 at price=100, qty=2 at price=50
    // subTotal = 0 + 100 = 100, taxTotal = 10%, total = 110
    const quoteData = buildQuoteData(client._id, admin._id, {
      taxRate: 10,
      items: [
        { itemName: 'Zero-qty item', quantity: 0, price: 100, total: 0 },
        { itemName: 'Normal item', quantity: 2, price: 50, total: 100 },
      ],
      subTotal: 100,
      taxTotal: 10,
      total: 110,
    });

    const quote = await Quote.create(quoteData);

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const invoice = res.body.result;
    expect(invoice.subTotal).toBe(100);
    expect(invoice.taxTotal).toBe(10);
    expect(invoice.total).toBe(110);

    // Confirm zero-qty line is preserved with total = 0
    const dbInvoice = await Invoice.findById(invoice._id);
    const zeroLine = dbInvoice.items.find((i) => i.itemName === 'Zero-qty item');
    expect(zeroLine).toBeDefined();
    expect(zeroLine.quantity).toBe(0);
    expect(zeroLine.total).toBe(0);
  });

  it('marks invoice paymentStatus as "paid" when total minus discount equals zero (zero-total path)', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');

    // total = 0 (price=0, qty=1), taxRate=0, discount=0 → paid
    const quoteData = buildQuoteData(client._id, admin._id, {
      taxRate: 0,
      discount: 0,
      items: [{ itemName: 'Free item', quantity: 1, price: 0, total: 0 }],
      subTotal: 0,
      taxTotal: 0,
      total: 0,
    });

    const quote = await Quote.create(quoteData);

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.result.paymentStatus).toBe('paid');
  });

  it('marks invoice paymentStatus as "paid" when discount equals total (discount-driven paid path)', async () => {
    const { admin, token } = await createAdminWithToken();
    const client = await createClient(admin._id);
    const Quote = mongoose.model('Quote');

    // Items: 1×100 + 10% tax → subTotal=100, taxTotal=10, total=110
    // discount=110 → calculate.sub(110, 110) = 0 ≤ 0 → paid
    const quoteData = buildQuoteData(client._id, admin._id, {
      taxRate: 10,
      discount: 110,
      items: [{ itemName: 'Widget', quantity: 1, price: 100, total: 100 }],
      subTotal: 100,
      taxTotal: 10,
      total: 110,
    });

    const quote = await Quote.create(quoteData);

    const res = await request(app)
      .get(`/api/quote/convert/${quote._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.result.paymentStatus).toBe('paid');
  });
});
