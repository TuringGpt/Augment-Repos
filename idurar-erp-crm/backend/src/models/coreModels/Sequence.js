const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema(
  {
    removed: {
      type: Boolean,
      default: false,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    sequenceKey: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    currentValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: 'created',
      updatedAt: 'updated',
    },
  }
);

module.exports = mongoose.model('Sequence', sequenceSchema);