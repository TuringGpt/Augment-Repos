const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === '') return false;

  const normalized = String(value).trim().toLowerCase();
  if (['true', 'yes', 'on'].includes(normalized)) return true;
  if (['false', 'no', 'off'].includes(normalized)) return false;

  const proxyCount = Number(normalized);
  if (Number.isInteger(proxyCount) && proxyCount >= 0) return proxyCount;

  return value;
};

module.exports = {
  parseTrustProxy,
};