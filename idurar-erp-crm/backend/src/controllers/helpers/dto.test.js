const test = require('node:test');
const assert = require('node:assert/strict');

const { pickDtoFields, toDto } = require('./dto');

test('toDto removes version keys recursively and adds id aliases', () => {
  const result = toDto({
    _id: 'invoice-1',
    __v: 3,
    client: {
      _id: 'client-1',
      __v: 1,
      name: 'Acme',
    },
  });

  assert.deepEqual(result, {
    _id: 'invoice-1',
    id: 'invoice-1',
    client: {
      _id: 'client-1',
      id: 'client-1',
      name: 'Acme',
    },
  });
});

test('toDto lets controllers reshape nested objects with property transformers', () => {
  const result = toDto(
    {
      _id: 'invoice-1',
      createdBy: {
        _id: 'admin-1',
        name: 'Owner',
        email: 'owner@example.com',
      },
    },
    {
      propertyTransformers: {
        createdBy: (createdBy) => pickDtoFields(createdBy, ['name']),
      },
    }
  );

  assert.deepEqual(result, {
    _id: 'invoice-1',
    id: 'invoice-1',
    createdBy: {
      name: 'Owner',
    },
  });
});