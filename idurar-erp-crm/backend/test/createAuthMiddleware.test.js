const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');

const originalLoad = Module._load;

const models = {};
const calls = { updates: [] };

const mockMongoose = {
  model(name) {
    if (!models[name]) throw new Error(`Missing mongoose model mock: ${name}`);
    return models[name];
  },
};

const mockBcrypt = {
  compare: async () => true,
  hashSync: (value) => `hashed:${value}`,
};

const mockJwt = {
  sign: () => 'signed-token',
  verify: () => ({ id: 'admin-1' }),
};

let shortidCounter = 0;
const mockShortid = {
  generate: () => `short-${++shortidCounter}`,
};

const requiredString = {
  email() {
    return this;
  },
  required() {
    return this;
  },
};

const mockJoi = {
  object: () => ({ validate: (value) => ({ error: null, value }) }),
  string: () => requiredString,
};

Module._load = function loadMock(request, parent, isMain) {
  if (request === 'mongoose') return mockMongoose;
  if (request === 'bcryptjs') return mockBcrypt;
  if (request === 'jsonwebtoken') return mockJwt;
  if (request === 'shortid') return mockShortid;
  if (request === 'joi') return mockJoi;
  if (request === '@/middlewares/settings') return { loadSettings: async () => ({}) };
  if (request === '@/settings') {
    return { useAppSettings: () => ({ idurar_app_email: 'noreply@example.com', idurar_base_url: 'https://app.example.com' }) };
  }
  if (request === '@/emailTemplate/emailVerfication') return { passwordVerfication: () => '<p>reset</p>' };
  if (request === 'resend') return { Resend: function Resend() { return { emails: { send: async () => ({ data: {} }) } }; } };
  return originalLoad.call(this, request, parent, isMain);
};

const createAuthMiddleware = require('../src/controllers/middlewaresControllers/createAuthMiddleware');

test.after(() => {
  Module._load = originalLoad;
});

function execResult(value) {
  return { exec: async () => value };
}

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function resetMocks() {
  process.env.JWT_SECRET = 'test-secret';
  shortidCounter = 0;
  calls.updates = [];
  mockBcrypt.compare = async () => true;
  mockBcrypt.hashSync = (value) => `hashed:${value}`;
  mockJwt.sign = () => 'signed-token';
  mockJwt.verify = () => ({ id: 'admin-1' });
  delete models.Admin;
  delete models.AdminPassword;
}

function updateModelMock() {
  return {
    findOneAndUpdate(filter, update, options) {
      calls.updates.push({ filter, update, options });
      return execResult({});
    },
  };
}

function adminFixture(overrides = {}) {
  return {
    _id: 'admin-1',
    name: 'Ada',
    surname: 'Lovelace',
    role: 'owner',
    email: 'ada@example.com',
    photo: 'ada.png',
    enabled: true,
    ...overrides,
  };
}

test('login signs a session token and stores it for enabled admins', async () => {
  resetMocks();
  const user = adminFixture();
  const password = { salt: 'salt-', password: 'hashed-password' };

  models.Admin = { findOne: async () => user };
  models.AdminPassword = { findOne: async () => password, ...updateModelMock() };
  mockJwt.sign = (payload, secret, options) => {
    assert.deepEqual(payload, { id: 'admin-1' });
    assert.equal(secret, 'test-secret');
    assert.deepEqual(options, { expiresIn: '24h' });
    return 'login-token';
  };

  const req = { body: { email: 'ada@example.com', password: 'correct-password' } };
  const res = createResponse();

  await createAuthMiddleware('Admin').login(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.result.token, 'login-token');
  assert.deepEqual(calls.updates[0].update, { $push: { loggedSessions: 'login-token' } });
});

test('login rejects invalid credentials without storing a session', async () => {
  resetMocks();
  models.Admin = { findOne: async () => adminFixture() };
  models.AdminPassword = { findOne: async () => ({ salt: 'salt-', password: 'hashed-password' }), ...updateModelMock() };
  mockBcrypt.compare = async () => false;

  const req = { body: { email: 'ada@example.com', password: 'wrong-password' } };
  const res = createResponse();

  await createAuthMiddleware('Admin').login(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Invalid credentials.');
  assert.equal(calls.updates.length, 0);
});

test('logout removes the current bearer token from logged sessions', async () => {
  resetMocks();
  models.AdminPassword = updateModelMock();
  const req = { admin: { _id: 'admin-1' }, headers: { authorization: 'Bearer session-token' } };
  const res = createResponse();

  await createAuthMiddleware('Admin').logout(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(calls.updates[0], {
    filter: { user: 'admin-1' },
    update: { $pull: { loggedSessions: 'session-token' } },
    options: { new: true },
  });
  assert.equal(res.body.message, 'Successfully logout');
});

test('logout clears all sessions when no bearer token is supplied', async () => {
  resetMocks();
  models.AdminPassword = updateModelMock();
  const req = { admin: { _id: 'admin-1' }, headers: {} };
  const res = createResponse();

  await createAuthMiddleware('Admin').logout(req, res);

  assert.deepEqual(calls.updates[0].update, { loggedSessions: [] });
  assert.equal(res.body.success, true);
});

test('resetPassword accepts a valid reset token and rotates password/session fields', async () => {
  resetMocks();
  const user = adminFixture();
  models.Admin = { findOne: () => execResult(user) };
  models.AdminPassword = {
    findOne: async () => ({ resetToken: 'valid-reset-token' }),
    ...updateModelMock(),
  };
  mockJwt.sign = () => 'reset-session-token';

  const req = { body: { userId: 'admin-1', password: 'new-password', resetToken: 'valid-reset-token' } };
  const res = createResponse();

  await createAuthMiddleware('Admin').resetPassword(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.result.token, 'reset-session-token');
  assert.deepEqual(calls.updates[0].filter, { user: 'admin-1' });
  assert.equal(calls.updates[0].update.password, 'hashed:short-1new-password');
  assert.equal(calls.updates[0].update.emailVerified, true);
  assert.deepEqual(calls.updates[0].update.$push, { loggedSessions: 'reset-session-token' });
});

test('resetPassword rejects an invalid reset token without rotating credentials', async () => {
  resetMocks();
  models.Admin = { findOne: () => execResult(adminFixture()) };
  models.AdminPassword = {
    findOne: async () => ({ resetToken: 'valid-reset-token' }),
    ...updateModelMock(),
  };

  const req = { body: { userId: 'admin-1', password: 'new-password', resetToken: 'wrong-reset-token' } };
  const res = createResponse();

  await createAuthMiddleware('Admin').resetPassword(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'Invalid reset token');
  assert.equal(calls.updates.length, 0);
});

test('isValidAuthToken rejects expired bearer tokens with jwtExpired set', async () => {
  resetMocks();
  models.Admin = { findOne: async () => adminFixture() };
  models.AdminPassword = { findOne: async () => ({ loggedSessions: ['expired-token'] }) };
  mockJwt.verify = () => {
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    throw error;
  };
  const res = createResponse();

  await createAuthMiddleware('Admin').isValidAuthToken(
    { headers: { authorization: 'Bearer expired-token' } },
    res,
    () => assert.fail('next should not be called for expired tokens')
  );

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.message, 'jwt expired');
  assert.equal(res.body.jwtExpired, true);
});

test('isValidAuthToken rejects tokens that are no longer in logged sessions', async () => {
  resetMocks();
  models.Admin = { findOne: async () => adminFixture() };
  models.AdminPassword = { findOne: async () => ({ loggedSessions: ['different-token'] }) };
  const res = createResponse();

  await createAuthMiddleware('Admin').isValidAuthToken(
    { headers: { authorization: 'Bearer stale-token' } },
    res,
    () => assert.fail('next should not be called for stale tokens')
  );

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, 'User is already logout try to login, authorization denied.');
  assert.equal(res.body.jwtExpired, true);
});