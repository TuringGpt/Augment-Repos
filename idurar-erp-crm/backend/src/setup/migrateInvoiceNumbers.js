require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

// Load all models so mongoose.model('Invoice') / mongoose.model('Setting') resolve.
const modelsFiles = globSync('./src/models/**/*.js');
for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

const SETTING_KEY = 'last_invoice_number';
const MAX_RETRIES = 5;

// Reserve the next invoice number atomically, retrying if the reserved value
// still collides with an existing (number, year) pair. Mirrors the runtime logic
// in invoiceController/create.js so the migration leaves the counter consistent.
async function reserveUniqueNumber(Setting, Invoice, year) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const setting = await Setting.findOneAndUpdate(
      { settingKey: SETTING_KEY },
      { $inc: { settingValue: 1 } },
      { new: true, runValidators: true }
    ).exec();

    if (!setting) {
      throw new Error(`Setting "${SETTING_KEY}" not found. Run "npm run setup" first.`);
    }

    const candidate = setting.settingValue;
    const clash = await Invoice.findOne({ number: candidate, year, removed: false }).exec();
    if (!clash) {
      return candidate;
    }
  }
  throw new Error('Could not reserve a unique invoice number after retries.');
}

async function migrate() {
  await mongoose.connect(process.env.DATABASE);

  const Invoice = mongoose.model('Invoice');
  const Setting = mongoose.model('Setting');

  // 1. Bring the counter up to the highest existing invoice number so freshly
  //    reserved numbers can never collide with legacy data.
  const [maxDoc] = await Invoice.find({}).sort({ number: -1 }).limit(1).exec();
  const maxNumber = maxDoc?.number || 0;
  const counter = await Setting.findOne({ settingKey: SETTING_KEY }).exec();
  if (!counter) {
    throw new Error(`Setting "${SETTING_KEY}" not found. Run "npm run setup" first.`);
  }
  if (counter.settingValue < maxNumber) {
    console.log(
      `👉 Bumping ${SETTING_KEY} from ${counter.settingValue} to ${maxNumber} (highest existing number).`
    );
    counter.settingValue = maxNumber;
    await counter.save();
  }

  // 2. Find duplicate (number, year) pairs among non-removed invoices.
  const duplicateGroups = await Invoice.aggregate([
    { $match: { removed: false } },
    {
      $group: {
        _id: { number: '$number', year: '$year' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicateGroups.length === 0) {
    console.log('👍 No duplicate (number, year) pairs found. Safe to build the unique index.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`⚠️  Found ${duplicateGroups.length} duplicate (number, year) group(s). Reconciling...`);

  let renumbered = 0;
  for (const group of duplicateGroups) {
    const { number, year } = group._id;

    // Keep the earliest-created invoice with the original number; re-number the rest.
    const docs = await Invoice.find({ number, year, removed: false })
      .sort({ created: 1, _id: 1 })
      .exec();

    const toRenumber = docs.slice(1);
    for (const doc of toRenumber) {
      const newNumber = await reserveUniqueNumber(Setting, Invoice, year);
      doc.number = newNumber;
      await doc.save();
      renumbered += 1;
      console.log(
        `   • Invoice ${doc._id}: (number ${number}, year ${year}) → number ${newNumber}.`
      );
    }
  }

  console.log(`👍 Reconciled duplicates: re-numbered ${renumbered} invoice(s).`);
  console.log('🥳 Migration completed. Safe to build the unique (number, year) index.');

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((e) => {
  console.log('\n🚫 Error! The migration failed. Details below:');
  console.log(e);
  process.exit(1);
});
