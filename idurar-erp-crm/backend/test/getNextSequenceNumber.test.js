const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const getNextSequenceNumber = require('../src/middlewares/sequences/getNextSequenceNumber');

const originalModel = mongoose.model;

test.afterEach(() => {
  mongoose.model = originalModel;
});

test('seeds invoice sequence from settings before incrementing', async () => {
  const calls = [];
  const models = {
    Setting: {
      findOne(query) {
        calls.push(['setting.findOne', query]);
        return {
          select(fields) {
            calls.push(['setting.select', fields]);
            return {
              async lean() {
                return { settingValue: 41 };
              },
            };
          },
        };
      },
    },
    Sequence: {
      updateOne(filter, update, options) {
        calls.push(['sequence.updateOne', filter, update, options]);
        return { exec: async () => ({ acknowledged: true }) };
      },
      findOneAndUpdate(filter, update, options) {
        calls.push(['sequence.findOneAndUpdate', filter, update, options]);
        return { exec: async () => ({ currentValue: 42 }) };
      },
    },
  };

  mongoose.model = (name) => models[name];

  const result = await getNextSequenceNumber({ entity: 'invoice' });

  assert.equal(result, 42);
  assert.deepEqual(calls[0], ['setting.findOne', { settingKey: 'last_invoice_number', removed: false }]);
  assert.deepEqual(calls[2], [
    'sequence.updateOne',
    { sequenceKey: 'invoice' },
    { $setOnInsert: { sequenceKey: 'invoice', currentValue: 41 } },
    { upsert: true, setDefaultsOnInsert: true },
  ]);
});

test('supports quote sequences and falls back to zero when settings are missing', async () => {
  const models = {
    Setting: {
      findOne() {
        return {
          select() {
            return {
              async lean() {
                return null;
              },
            };
          },
        };
      },
    },
    Sequence: {
      updateOne(filter, update) {
        assert.deepEqual(filter, { sequenceKey: 'quote' });
        assert.deepEqual(update, {
          $setOnInsert: { sequenceKey: 'quote', currentValue: 0 },
        });
        return { exec: async () => ({ acknowledged: true }) };
      },
      findOneAndUpdate() {
        return { exec: async () => ({ currentValue: 1 }) };
      },
    },
  };

  mongoose.model = (name) => models[name];

  const result = await getNextSequenceNumber({ entity: 'quote' });

  assert.equal(result, 1);
});