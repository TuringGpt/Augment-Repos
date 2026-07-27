/**
 * DTO (Data Transfer Object) utility to sanitize Mongoose documents/objects for API responses.
 *
 * @param {Object|Array} doc - The Mongoose document or array of documents to sanitize.
 * @returns {Object|Array} The sanitized object or array.
 */
const sanitizeDocument = (doc) => {
  if (Array.isArray(doc)) {
    return doc.map((item) => sanitizeDocument(item));
  }
  if (doc && typeof doc.toObject === 'function') {
    doc = doc.toObject();
  }
  if (doc && typeof doc === 'object') {
    const sanitized = { ...doc };
    delete sanitized.__v;
    delete sanitized.removed;
    // We keep _id as it is usually needed for the frontend,
    // but we can add logic to hide it if specifically requested.
    return sanitized;
  }
  return doc;
};

module.exports = {
  sanitizeDocument,
};
