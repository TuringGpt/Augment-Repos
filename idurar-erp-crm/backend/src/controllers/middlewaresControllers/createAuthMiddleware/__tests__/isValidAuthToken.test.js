'use strict';

jest.mock('mongoose');
jest.mock('jsonwebtoken');

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const isValidAuthToken = require('../isValidAuthToken');

process.env.JWT_SECRET = 'test-secret';

const USER_MODEL = 'Admin';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();
const mockUserFindOne = jest.fn();
const mockPasswordFindOne = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.model.mockImplementation((name) => {
    if (name === USER_MODEL + 'Password') return { findOne: mockPasswordFindOne };
    if (name === USER_MODEL) return { findOne: mockUserFindOne };
  });
});

describe('isValidAuthToken', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const req = { headers: {} };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'No authentication token, authorization denied.',
        jwtExpired: true,
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 500 when JWT is expired (jwt.verify throws TokenExpiredError)', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw expiredError; });
    const req = { headers: { authorization: 'Bearer expiredtoken' } };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, jwtExpired: true })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 500 when JWT signature is invalid (JsonWebTokenError)', async () => {
    const invalidError = new Error('invalid signature');
    invalidError.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw invalidError; });
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ jwtExpired: true, controller: 'isValidAuthToken' })
    );
  });

  it('returns 401 when user does not exist in DB', async () => {
    jwt.verify.mockReturnValue({ id: 'uid1' });
    mockUserFindOne.mockResolvedValue(null);
    mockPasswordFindOne.mockResolvedValue({ loggedSessions: [] });
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User doens't Exist, authorization denied." })
    );
  });

  it('returns 401 when token is not in loggedSessions (already logged out)', async () => {
    jwt.verify.mockReturnValue({ id: 'uid1' });
    mockUserFindOne.mockResolvedValue({ _id: 'uid1' });
    mockPasswordFindOne.mockResolvedValue({ loggedSessions: ['other-token'] });
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'User is already logout try to login, authorization denied.' })
    );
  });

  it('calls next() and sets req user when token is valid', async () => {
    const mockUser = { _id: 'uid1', name: 'Test' };
    jwt.verify.mockReturnValue({ id: 'uid1' });
    mockUserFindOne.mockResolvedValue(mockUser);
    mockPasswordFindOne.mockResolvedValue({ loggedSessions: ['validtoken'] });
    const req = { headers: { authorization: 'Bearer validtoken' } };
    const res = mockRes();
    await isValidAuthToken(req, res, mockNext, { userModel: USER_MODEL });
    expect(mockNext).toHaveBeenCalled();
    expect(req.admin).toBe(mockUser);
    expect(res.status).not.toHaveBeenCalled();
  });
});
