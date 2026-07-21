const mongoose = require('mongoose');

const Model = mongoose.model('Sequence');

// Atomically allocates and returns the next number for a given entity/year.
// The single-document findOneAndUpdate with $inc + upsert is atomic in MongoDB,
// so concurrent creates can never be handed the same number.
const getNextSequence = async ({ entity, year }) => {
  const currentYear = year || new Date().getFullYear();

  const result = await Model.findOneAndUpdate(
    { entity, year: currentYear },
    {
      $inc: { current: 1 },
    },
    {
      new: true, // return the incremented document
      upsert: true, // create the counter on first use
      setDefaultsOnInsert: true,
    }
  ).exec();

  return { number: result.current, year: currentYear };
};

module.exports = getNextSequence;
