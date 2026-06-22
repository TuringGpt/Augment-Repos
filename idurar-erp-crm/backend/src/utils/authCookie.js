const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'idurar_auth_token';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;

  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const getCookieSameSite = (secure) => {
  const sameSite = process.env.COOKIE_SAME_SITE || (secure ? 'none' : 'lax');
  const normalized = String(sameSite).trim().toLowerCase();

  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  return normalized;
};

const getAuthCookieOptions = ({ maxAge } = {}) => {
  const secure = parseBoolean(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production');
  const options = {
    httpOnly: true,
    secure,
    sameSite: getCookieSameSite(secure),
    path: '/',
  };

  if (Number.isInteger(maxAge)) options.maxAge = maxAge;
  if (process.env.COOKIE_DOMAIN) options.domain = process.env.COOKIE_DOMAIN;

  return options;
};

const setAuthCookie = (res, token, options) => {
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions(options));
};

const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
};

const getAuthTokenFromRequest = (req) => {
  const authHeader = req.headers['authorization'];
  const bearerToken = authHeader && authHeader.split(' ')[1];

  return bearerToken || req.cookies?.[AUTH_COOKIE_NAME];
};

module.exports = {
  AUTH_COOKIE_NAME,
  ONE_DAY_MS,
  clearAuthCookie,
  getAuthTokenFromRequest,
  setAuthCookie,
};