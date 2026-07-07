function loadDotenv() {
  try {
    const dotenv = require('dotenv');
    dotenv.config({ path: '.env' });
    dotenv.config({ path: '.env.local' });
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
  }
}

loadDotenv();

const DEFAULT_RULE_ID = 'idurar-attachments-to-infrequent-access-after-90-days';
const DEFAULT_PREFIX = 'public/uploads/';
const DEFAULT_TRANSITION_DAYS = 90;
const DEFAULT_STORAGE_CLASS = 'STANDARD_IA';

function optionalEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

function requiredEnv(...names) {
  const value = optionalEnv(...names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${names.join(' or ')}`);
  }
  return value;
}

function normalizeEndpoint(endpoint) {
  if (!endpoint) return undefined;
  return endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `https://${endpoint}`;
}

function buildLifecycleConfiguration() {
  const transitionDays = Number(optionalEnv('S3_ATTACHMENTS_IA_AFTER_DAYS')) || DEFAULT_TRANSITION_DAYS;
  const storageClass = optionalEnv('S3_ATTACHMENTS_IA_STORAGE_CLASS') || DEFAULT_STORAGE_CLASS;
  const prefix = optionalEnv('S3_ATTACHMENTS_PREFIX') || DEFAULT_PREFIX;

  return {
    Rules: [
      {
        ID: optionalEnv('S3_ATTACHMENTS_LIFECYCLE_RULE_ID') || DEFAULT_RULE_ID,
        Status: 'Enabled',
        Filter: { Prefix: prefix },
        Transitions: [{ Days: transitionDays, StorageClass: storageClass }],
      },
    ],
  };
}

function buildS3Client() {
  const { S3Client } = require('@aws-sdk/client-s3');
  const endpoint = normalizeEndpoint(optionalEnv('S3_ENDPOINT', 'AWS_S3_ENDPOINT', 'DO_SPACES_URL'));

  return new S3Client({
    endpoint,
    region: requiredEnv('AWS_REGION', 'AWS_S3_REGION_NAME', 'REGION'),
    credentials: {
      accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID', 'DO_SPACES_KEY'),
      secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY', 'DO_SPACES_SECRET'),
    },
  });
}

async function configureAttachmentLifecycle() {
  const { PutBucketLifecycleConfigurationCommand } = require('@aws-sdk/client-s3');
  const bucket = requiredEnv('S3_BUCKET_NAME', 'AWS_STORAGE_BUCKET_NAME', 'DO_SPACES_NAME');
  const lifecycleConfiguration = buildLifecycleConfiguration();
  const client = buildS3Client();

  await client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: bucket,
      LifecycleConfiguration: lifecycleConfiguration,
    })
  );

  return lifecycleConfiguration;
}

if (require.main === module) {
  configureAttachmentLifecycle()
    .then((config) => {
      const rule = config.Rules[0];
      const transition = rule.Transitions[0];
      console.log(
        `Configured S3 lifecycle rule "${rule.ID}" for ${rule.Filter.Prefix} after ${transition.Days} days.`
      );
    })
    .catch((error) => {
      console.error('Failed to configure S3 attachment lifecycle:', error.message);
      process.exit(1);
    });
}

module.exports = {
  buildLifecycleConfiguration,
  configureAttachmentLifecycle,
};