const mongoose = require('mongoose');

// Atomic counter collection used to allocate sequential numbers (e.g. invoice
// and quote numbers). One document per entity/year pair holds the last number
// that was handed out.
const sequenceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  entity: {
    type: String,
    required: true,
    lowercase: true,
  },
  year: {
    type: Number,
    required: true,
  },
  current: {
    type: Number,
    default: 0,
  },
});

// Guarantees a single counter document per entity/year, so the atomic upsert in
// getNextSequence can never create duplicates under concurrency.
sequenceSchema.index({ entity: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Sequence', sequenceSchema);
