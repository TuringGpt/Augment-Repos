'use strict';

jest.mock('mongoose');
jest.mock('../authUser');

const mongoose = require('mongoose');
const authUser = require('../authUser');
const login = require('../login');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const USER_MODEL = 'Admin';

const mockUserFind = jest.fn();
const mockPasswordFind = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.model.mockImplementation((name) => {
    if (name === USER_MODEL + 'Password') return { findOne: mockPasswordFind };
    if (name === USER_MODEL) return { findOne: mockUserFind };
  });
});

describe('login', () => {
  it('returns 409 when email is missing', async () => {
    const req = { body: { password: 'secret' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('returns 409 when email format is invalid', async () => {
    const req = { body: { email: 'not-an-email', password: 'secret' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid/Missing credentials.' })
    );
  });

  it('returns 409 when password is missing', async () => {
    const req = { body: { email: 'user@example.com' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('returns 404 when user does not exist', async () => {
    mockUserFind.mockResolvedValue(null);
    const req = { body: { email: 'noone@example.com', password: 'secret' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'No account with this email has been registered.' })
    );
  });

  it('returns 409 when account is disabled', async () => {
    const mockUser = { _id: 'uid1', enabled: false };
    mockUserFind.mockResolvedValue(mockUser);
    mockPasswordFind.mockResolvedValue({ salt: 'salt', password: 'hashed' });
    const req = { body: { email: 'disabled@example.com', password: 'secret' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Your account is disabled, contact your account adminstrator' })
    );
  });

  it('delegates to authUser when credentials look valid', async () => {
    const mockUser = { _id: 'uid1', enabled: true };
    const mockDbPassword = { salt: 'salt', password: 'hashed' };
    mockUserFind.mockResolvedValue(mockUser);
    mockPasswordFind.mockResolvedValue(mockDbPassword);
    authUser.mockResolvedValue();
    const req = { body: { email: 'user@example.com', password: 'secret' } };
    const res = mockRes();
    await login(req, res, { userModel: USER_MODEL });
    expect(authUser).toHaveBeenCalledWith(
      req,
      res,
      expect.objectContaining({ user: mockUser, databasePassword: mockDbPassword, password: 'secret' })
    );
  });
});
