const DEFAULT_HIDDEN_FIELDS = ['__v'];

const normalizeDtoOptions = (options = {}) => {
  const hiddenFields = [...new Set([...DEFAULT_HIDDEN_FIELDS, ...(options.hiddenFields || [])])];

  return {
    hiddenFields,
    propertyTransformers: options.propertyTransformers || {},
  };
};

const cloneForDto = (value) => {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
};

const applyDto = (value, options) => {
  if (Array.isArray(value)) {
    return value.map((item) => applyDto(item, options));
  }

  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  const dto = {};

  for (const [key, childValue] of Object.entries(value)) {
    if (options.hiddenFields.includes(key)) {
      continue;
    }

    let nextValue = applyDto(childValue, options);
    const transformer = options.propertyTransformers[key];

    if (typeof transformer === 'function') {
      nextValue = transformer(nextValue);
    }

    if (nextValue !== undefined) {
      dto[key] = nextValue;
    }
  }

  if (dto._id && dto.id === undefined) {
    dto.id = dto._id;
  }

  return dto;
};

const toDto = (value, options = {}) => {
  const normalizedValue = cloneForDto(value);

  return applyDto(normalizedValue, normalizeDtoOptions(options));
};

const pickDtoFields = (value, fields = []) => {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return value;
  }

  return fields.reduce((accumulator, field) => {
    if (value[field] !== undefined) {
      accumulator[field] = value[field];
    }

    return accumulator;
  }, {});
};

const sendDtoResponse = (res, { status = 200, success, result, message, dtoOptions, ...extra }) => {
  return res.status(status).json({
    success,
    result: toDto(result, dtoOptions),
    message,
    ...extra,
  });
};

module.exports = {
  pickDtoFields,
  sendDtoResponse,
  toDto,
};