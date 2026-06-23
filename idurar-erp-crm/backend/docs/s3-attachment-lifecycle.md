# S3 attachment lifecycle

IDURAR stores uploaded attachments under the `public/uploads/` key prefix. Run this once for each S3 bucket to move attachments older than 90 days into S3 Standard-Infrequent Access:

```bash
npm run s3:lifecycle:attachments
```

The script uses the existing S3 credentials from `.env` / `.env.local` and accepts either the AWS-style variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME`) or the current DigitalOcean-style variables (`DO_SPACES_KEY`, `DO_SPACES_SECRET`, `REGION`, `DO_SPACES_NAME`, `DO_SPACES_URL`).

## Optional overrides

- `S3_ATTACHMENTS_PREFIX` — defaults to `public/uploads/`.
- `S3_ATTACHMENTS_IA_AFTER_DAYS` — defaults to `90`.
- `S3_ATTACHMENTS_IA_STORAGE_CLASS` — defaults to `STANDARD_IA`.
- `S3_ATTACHMENTS_LIFECYCLE_RULE_ID` — defaults to `idurar-attachments-to-infrequent-access-after-90-days`.

## Simple cost and retrieval behavior

- **Storage gets cheaper after 90 days** because old attachments move from S3 Standard to Standard-IA.
- **Opening an old attachment still works right away**; Standard-IA does not require a restore job like Glacier.
- **Reads cost a little extra** because AWS charges a retrieval fee per GB read from Standard-IA.
- **Very small or short-lived files may not save money** because Standard-IA has a 128 KB minimum billable object size and a 30-day minimum storage charge.

AWS S3 supports the `STANDARD_IA` transition. S3-compatible providers may reject this rule if they do not offer the same storage class.