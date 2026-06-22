# Qualia Data Model

> **Target model.** This is the intended data model for the active Form Cycle scope. It is not a description of the current database schema.

## Relationship overview

```text
User ──< FormCycle (owner)
User ──< FormCycleAssignment >── FormCycle
User ──< Submission >── FormCycle
FormCycle ──< Section ──< Question
Submission ──< SubmissionAnswer >── Question
SubmissionAnswer ──< Attachment
User ──< AuditLog
```

## Users

`users` stores all accounts.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | string | Required |
| `email` | string | Required, normalized, unique |
| `password_hash` | string | Required; never return through API |
| `role` | enum | `admin` or `user` only |
| `is_active` | boolean | Inactive users cannot authenticate or act |
| `last_login_at` | timestamp | Nullable |
| `created_at`, `updated_at` | timestamp | Required |

## Form Cycles

`form_cycles` defines a QA cycle.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `owner_id` | UUID | Required FK to `users.id`; original creator |
| `title` | string | Required |
| `description` | text | Nullable |
| `status` | enum | `draft`, `published`, `closed`, `archived` |
| `submission_deadline` | timestamp | Required |
| `published_at`, `closed_at`, `archived_at` | timestamp | Nullable |
| `created_at`, `updated_at` | timestamp | Required |

An owner can manage their own Form Cycles. An admin can manage every Form Cycle. Assignment never changes ownership.

## Sections and questions

`sections` belongs to one Form Cycle.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `form_cycle_id` | UUID | Required FK |
| `title`, `description` | string/text | Title required |
| `display_order` | integer | Unique within Form Cycle |

`questions` belongs to one section and one Form Cycle.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `form_cycle_id`, `section_id` | UUID | Required FKs; must refer to same cycle |
| `question_type` | enum | Supported input type |
| `question_text`, `description` | text | Question text required |
| `is_required` | boolean | Default false |
| `config` | JSON | Validated per question type |
| `display_order` | integer | Unique within section |
| `created_at`, `updated_at` | timestamp | Required |

## Assignments

`form_cycle_assignments` records who may submit to a Form Cycle.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `form_cycle_id` | UUID | Required FK |
| `user_id` | UUID | Required FK |
| `assigned_by_user_id` | UUID | Required FK |
| `assigned_at` | timestamp | Required |

Database constraint:

```text
UNIQUE(form_cycle_id, user_id)
```

Assignment grants the user submission rights only. It does not grant Form Cycle edit, assignment-management, or other-submission access.

## Submissions and answers

`submissions` is a user's response to a Form Cycle.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `form_cycle_id` | UUID | Required FK |
| `submitted_by_user_id` | UUID | Required FK; must be assigned to the cycle |
| `status` | enum | `draft` or `submitted` |
| `started_at`, `last_saved_at`, `submitted_at` | timestamp | `submitted_at` nullable until submit |
| `created_at`, `updated_at` | timestamp | Required |

Database constraint:

```text
UNIQUE(form_cycle_id, submitted_by_user_id)
```

`submission_answers` holds one answer for a question within a submission.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `submission_id`, `question_id` | UUID | Required FKs |
| `text_answer` | text | Text questions |
| `number_answer`, `rating_answer` | number/integer | Number/rating questions |
| `choice_answers` | JSON array | Choice/dropdown questions |
| `boolean_answer` | boolean/null | Yes/no/N/A questions |
| `created_at`, `updated_at` | timestamp | Required |

Database constraint:

```text
UNIQUE(submission_id, question_id)
```

The service layer validates that each answer matches its question type and configuration before saving or submitting.

## Attachments

`attachments` stores file metadata. File bytes live in configured storage outside the relational database.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `submission_id` | UUID | Required FK |
| `submission_answer_id` | UUID | Nullable FK; set for answer-specific file |
| `uploaded_by_user_id` | UUID | Required FK |
| `file_name`, `mime_type`, `file_size` | string/string/integer | Required, validated |
| `storage_key` | string | Required, unique, not exposed as authorization |
| `created_at` | timestamp | Required |

Only the uploading user, the Form Cycle owner, and admins may download an attachment.

## Audit logs

`audit_logs` records security and business events.

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `actor_user_id` | UUID | Nullable FK for system action |
| `action` | string | Required, e.g. `form_cycle.published` |
| `resource_type`, `resource_id` | string/UUID | Required |
| `metadata` | JSON | Safe before/after or contextual data; never passwords/tokens |
| `created_at` | timestamp | Required |

Audit at minimum: user creation/activation/role change, Form Cycle lifecycle changes, assignment changes, submission/reopen events, and attachment actions.

## Required indexes and integrity rules

- Index `form_cycles.owner_id`, `form_cycles.status`, and `form_cycles.submission_deadline`.
- Index assignments by `user_id` and `form_cycle_id`.
- Index submissions by `submitted_by_user_id`, `form_cycle_id`, `status`, and `submitted_at`.
- Enforce that a question's `section_id` belongs to its `form_cycle_id`.
- Enforce that a submission creator is assigned to its Form Cycle.
- Enforce all authorization in the service/API layer, even where a database constraint also exists.
