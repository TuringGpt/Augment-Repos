const mongoose = require('mongoose');

const sequenceSettingMap = {
  invoice: 'last_invoice_number',
  quote: 'last_quote_number',
};

const getSettingValueAsNumber = async (settingKey) => {
  const Setting = mongoose.model('Setting');
  const setting = await Setting.findOne({
    settingKey,
    removed: false,
  })
    .select('settingValue')
    .lean();

  const initialValue = Number(setting?.settingValue);

  return Number.isFinite(initialValue) ? initialValue : 0;
};

const getNextSequenceNumber = async ({ entity }) => {
  const sequenceKey = entity?.toLowerCase();
  const settingKey = sequenceSettingMap[sequenceKey];

  if (!settingKey) {
    return null;
  }

  const Sequence = mongoose.model('Sequence');
  const initialValue = await getSettingValueAsNumber(settingKey);

  await Sequence.updateOne(
    { sequenceKey },
    {
      $setOnInsert: {
        sequenceKey,
        currentValue: initialValue,
      },
    },
    {
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).exec();

  const sequence = await Sequence.findOneAndUpdate(
    { sequenceKey },
    {
      $inc: {
        currentValue: 1,
      },
    },
    {
      new: true,
    }
  ).exec();

  return sequence?.currentValue ?? null;
};

module.exports = getNextSequenceNumber;