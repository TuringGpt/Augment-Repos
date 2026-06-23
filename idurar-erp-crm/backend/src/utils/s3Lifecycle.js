/**
 * S3 Lifecycle Configuration for idurar-erp-crm attachments
 *
 * Applies a lifecycle rule that automatically transitions all files under
 * public/uploads/ to S3 Standard-IA (Infrequent Access) after 90 days.
 *
 * COST & RETRIEVAL OVERVIEW
 * ─────────────────────────
 * S3 Standard (days 0–90)
 *   • Storage : ~$0.023 / GB / month
 *   • Retrieval: free (included in the per-request price)
 *   • Best for : invoices, logos, profile photos accessed regularly
 *
 * S3 Standard-IA (day 91 onwards)
 *   • Storage  : ~$0.0125 / GB / month  (≈ 46 % cheaper)
 *   • Retrieval: ~$0.01  / GB retrieved  (first-byte latency same as Standard)
 *   • Min size : 128 KB per object (smaller objects are billed as 128 KB)
 *   • Min age  : 30-day minimum charge after transition
 *   • Best for : old invoice PDFs, archived client documents rarely re-opened
 *
 * Rule of thumb: if you download a file less than ~once a month, IA saves money.
 * If you frequently re-download the same large attachment, the retrieval fee may
 * cancel out the storage saving — consider leaving those in Standard.
 *
 * Usage (see package.json "lifecycle" script):
 *   node src/utils/s3Lifecycle.js
 *
 * Required env vars (same as DoSingleStorage):
 *   DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_URL, DO_SPACES_NAME, REGION
 */

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const {
  S3Client,
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
} = require('@aws-sdk/client-s3');

// ─── Configuration ────────────────────────────────────────────────────────────

/** Prefix that covers every attachment uploaded by DoSingleStorage */
const UPLOADS_PREFIX = 'public/uploads/';

/** Days before objects transition to S3 Standard-IA */
const TRANSITION_DAYS = 90;

/** Rule ID — update if you add more rules later */
const RULE_ID = 'idurar-attachments-to-ia';

// ─── S3 Client ────────────────────────────────────────────────────────────────

function createS3Client() {
  const endpoint = process.env.DO_SPACES_URL
    ? 'https://' + process.env.DO_SPACES_URL
    : undefined;

  return new S3Client({
    ...(endpoint ? { endpoint } : {}),
    region: process.env.REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.DO_SPACES_KEY,
      secretAccessKey: process.env.DO_SPACES_SECRET,
    },
  });
}

// ─── Lifecycle Rule ───────────────────────────────────────────────────────────

/**
 * Returns the lifecycle configuration object to apply.
 * Exported so tests can inspect the rule without touching AWS.
 */
function buildLifecycleConfig() {
  return {
    Rules: [
      {
        ID: RULE_ID,
        Status: 'Enabled',
        Filter: {
          Prefix: UPLOADS_PREFIX,
        },
        Transitions: [
          {
            Days: TRANSITION_DAYS,
            StorageClass: 'STANDARD_IA',
          },
        ],
      },
    ],
  };
}

// ─── Apply & Verify ───────────────────────────────────────────────────────────

async function applyLifecycleRules() {
  const bucket = process.env.DO_SPACES_NAME;

  if (!bucket) {
    throw new Error(
      'DO_SPACES_NAME env var is not set. Cannot apply lifecycle rules without a bucket name.'
    );
  }

  const client = createS3Client();
  const lifecycleConfig = buildLifecycleConfig();

  console.log(`\nApplying S3 lifecycle rule to bucket: ${bucket}`);
  console.log(
    `  Rule  : "${RULE_ID}"\n` +
      `  Prefix: "${UPLOADS_PREFIX}"\n` +
      `  Action: transition to STANDARD_IA after ${TRANSITION_DAYS} days\n`
  );

  await client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: bucket,
      LifecycleConfiguration: lifecycleConfig,
    })
  );

  console.log('Lifecycle rule applied. Verifying...');

  const { Rules } = await client.send(
    new GetBucketLifecycleConfigurationCommand({ Bucket: bucket })
  );

  const applied = Rules.find((r) => r.ID === RULE_ID);
  if (!applied) {
    throw new Error('Rule was submitted but could not be found on the bucket. Check AWS console.');
  }

  console.log('Verified rule on bucket:');
  console.log(JSON.stringify(applied, null, 2));
  console.log('\nDone. Attachments older than 90 days will automatically move to Standard-IA.\n');
}

// ─── Module exports ───────────────────────────────────────────────────────────

module.exports = { buildLifecycleConfig, applyLifecycleRules, RULE_ID, TRANSITION_DAYS, UPLOADS_PREFIX };

// ─── CLI entry point ──────────────────────────────────────────────────────────

if (require.main === module) {
  applyLifecycleRules().catch((err) => {
    console.error('Failed to apply lifecycle rules:', err.message);
    process.exit(1);
  });
}
