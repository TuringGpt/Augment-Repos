'use strict';

jest.mock('mongoose');

const mongoose = require('mongoose');
const logout = require('../logout');

const USER_MODEL = 'Admin';

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockExec = jest.fn().mockResolvedValue({});
const mockFindOneAndUpdate = jest.fn().mockReturnValue({ exec: mockExec });

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.model.mockReturnValue({ findOneAndUpdate: mockFindOneAndUpdate });
});

describe('logout', () => {
  it('removes specific token from sessions when Authorization header is present', async () => {
    const req = {
      headers: { authorization: 'Bearer mytoken123' },
      admin: { _id: 'uid1' },
    };
    const res = mockRes();
    await logout(req, res, { userModel: USER_MODEL });

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { user: 'uid1' },
      { $pull: { loggedSessions: 'mytoken123' } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Successfully logout' })
    );
  });

  it('clears all sessions when no Authorization header is present', async () => {
    const req = {
      headers: {},
      admin: { _id: 'uid2' },
    };
    const res = mockRes();
    await logout(req, res, { userModel: USER_MODEL });

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { user: 'uid2' },
      { loggedSessions: [] },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: 'Successfully logout' })
    );
  });

  it('clears all sessions when Authorization header has no Bearer token', async () => {
    const req = {
      headers: { authorization: '' },
      admin: { _id: 'uid3' },
    };
    const res = mockRes();
    await logout(req, res, { userModel: USER_MODEL });

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { user: 'uid3' },
      { loggedSessions: [] },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns success response in all cases', async () => {
    const req = {
      headers: { authorization: 'Bearer tok' },
      admin: { _id: 'uid4' },
    };
    const res = mockRes();
    await logout(req, res, { userModel: USER_MODEL });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      result: {},
      message: 'Successfully logout',
    });
  });
});
