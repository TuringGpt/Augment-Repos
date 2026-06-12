'use strict';

jest.mock('mongoose');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('shortid');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const resetPassword = require('../resetPassword');

process.env.JWT_SECRET = 'test-secret';

const USER_MODEL = 'Admin';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockExec = jest.fn().mockResolvedValue({});
const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });
const mockPasswordFindOne = jest.fn();
const mockUserFindOne = jest.fn();

const baseUser = { _id: 'uid1', name: 'Test', surname: 'User', role: 'admin', email: 'test@example.com', photo: '', enabled: true };
const baseDbPassword = { resetToken: 'valid-token' };

beforeEach(() => {
  jest.clearAllMocks();
  shortid.generate.mockReturnValue('generated-id');
  bcrypt.hashSync.mockReturnValue('hashed-password');
  jwt.sign.mockReturnValue('signed-jwt-token');
  mockUserFindOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(baseUser) });
  mockPasswordFindOne.mockResolvedValue(baseDbPassword);
  mongoose.model.mockImplementation((name) => {
    if (name === USER_MODEL + 'Password') return { findOne: mockPasswordFindOne, findOneAndUpdate: mockFindOneAndUpdate };
    if (name === USER_MODEL) return { findOne: mockUserFindOne };
  });
});

describe('resetPassword', () => {
  it('returns 200 with token on successful password reset', async () => {
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'valid-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Successfully resetPassword user' })
    );
    expect(res.json.mock.calls[0][0].result).toHaveProperty('token', 'signed-jwt-token');
  });

  it('returns 403 when reset token is invalid (mismatch)', async () => {
    mockPasswordFindOne.mockResolvedValue({ resetToken: 'correct-token' });
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'wrong-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Invalid reset token' })
    );
  });

  it('returns 403 when reset token in DB is null (expired/cleared)', async () => {
    mockPasswordFindOne.mockResolvedValue({ resetToken: null });
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'some-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid reset token' })
    );
  });

  it('returns 403 when reset token in DB is undefined', async () => {
    mockPasswordFindOne.mockResolvedValue({ resetToken: undefined });
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'some-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 409 when account is disabled', async () => {
    mockUserFindOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ ...baseUser, enabled: false }) });
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'valid-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Your account is disabled, contact your account adminstrator' })
    );
  });

  it('returns 409 when required fields are missing (Joi validation)', async () => {
    const req = { body: { userId: 'uid1', resetToken: 'valid-token' } }; // missing password
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid reset password object' })
    );
  });

  it('signs JWT with 24h expiry on successful reset', async () => {
    const req = { body: { password: 'NewPass1', userId: 'uid1', resetToken: 'valid-token' } };
    const res = mockRes();
    await resetPassword(req, res, { userModel: USER_MODEL });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'uid1' },
      'test-secret',
      { expiresIn: '24h' }
    );
  });
});
