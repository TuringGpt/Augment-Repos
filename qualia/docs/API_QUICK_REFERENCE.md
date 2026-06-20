# Qualia API Reference

> **Target contract.** This document specifies the Form Cycle API to build. It supersedes the previous API proposal and may describe endpoints not yet implemented.

## Conventions

- Base URL: `/api/v1`
- Protected routes require `Authorization: Bearer <access_token>`.
- IDs are UUIDs.
- Dates use ISO 8601 UTC timestamps.
- The API enforces authorization. User-interface visibility is not a security control.
- Roles are `admin` and `user` only.

### Standard error body

```json
{
  "detail": "You do not have permission to view this submission",
  "code": "submission_access_denied"
}
```

| Status | Meaning |
| --- | --- |
| `400` | Invalid workflow state, deadline, or incomplete submission |
| `401` | Missing, expired, or invalid token |
| `403` | Authenticated but not authorized |
| `404` | Resource does not exist or must not be disclosed |
| `409` | Duplicate assignment/submission or conflicting update |
| `422` | Invalid request body |

## Authorization rules

| Actor | Form Cycle definition | Submissions |
| --- | --- | --- |
| Admin | Manage every Form Cycle | View/manage every submission |
| Original creator | Manage only Form Cycles they created | View submissions to their own Form Cycles |
| Assigned user | Read published questions only | Create, save, submit, and view only their own submission |
| Unrelated user | No access | No access |

Assignment grants submission access only. It never grants permission to edit a Form Cycle.

## Authentication and current user

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Authenticate and receive tokens |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for an access token |
| `POST` | `/auth/logout` | Authenticated | End the current session |
| `POST` | `/auth/forgot-password` | Public | Start password reset |
| `POST` | `/auth/reset-password` | Public | Reset password using reset token |
| `GET` | `/me` | Authenticated | Return current user |
| `PATCH` | `/me` | Authenticated | Update own display name/email |
| `PATCH` | `/me/password` | Authenticated | Change own password |

### Login

```http
POST /api/v1/auth/login
```

```json
{
  "email": "anya@example.com",
  "password": "example-password"
}
```

```json
{
  "access_token": "jwt",
  "refresh_token": "jwt",
  "user": {
    "id": "uuid",
    "name": "Anya Shah",
    "email": "anya@example.com",
    "role": "user",
    "is_active": true
  }
}
```

## Admin user management

All routes in this section require `admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/users` | List users; supports `search`, `role`, `is_active`, `page`, `page_size` |
| `POST` | `/users` | Create or invite a user |
| `GET` | `/users/{user_id}` | Get user details |
| `PATCH` | `/users/{user_id}` | Update name, email, or role |
| `POST` | `/users/{user_id}/activate` | Activate account |
| `POST` | `/users/{user_id}/deactivate` | Deactivate account |
| `POST` | `/users/{user_id}/reset-password` | Start/reset password process |

```json
{
  "name": "Kiran Patel",
  "email": "kiran@example.com",
  "role": "user"
}
```

## Form Cycles

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/form-cycles` | Authenticated | Admin receives all; user receives owned and assigned cycles |
| `POST` | `/form-cycles` | Admin or user | Create a Form Cycle; caller becomes original creator |
| `GET` | `/form-cycles/{cycle_id}` | Admin, owner, or assigned user | Read permitted Form Cycle view |
| `PATCH` | `/form-cycles/{cycle_id}` | Admin or owner | Update title, description, deadline |
| `DELETE` | `/form-cycles/{cycle_id}` | Admin or owner | Delete a draft/archived Form Cycle |
| `POST` | `/form-cycles/{cycle_id}/publish` | Admin or owner | Publish a draft |
| `POST` | `/form-cycles/{cycle_id}/close` | Admin or owner | Close submissions |
| `POST` | `/form-cycles/{cycle_id}/archive` | Admin or owner | Archive a closed cycle |
| `POST` | `/form-cycles/{cycle_id}/duplicate` | Admin or owner | Create a new draft copy |

### Create Form Cycle

```json
{
  "title": "Website QA — June 2026",
  "description": "Release validation",
  "submission_deadline": "2026-06-30T18:30:00Z"
}
```

### Lifecycle

```text
draft → published → closed → archived
```

Only the owner or an admin may transition lifecycle state. Assigned users can read a published cycle but cannot alter its definition or lifecycle.

## Sections and questions

All routes in this section require an admin or the original creator of the Form Cycle.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/form-cycles/{cycle_id}/sections` | List ordered sections and questions |
| `POST` | `/form-cycles/{cycle_id}/sections` | Create section |
| `PATCH` | `/form-cycles/{cycle_id}/sections/{section_id}` | Update or reorder section |
| `DELETE` | `/form-cycles/{cycle_id}/sections/{section_id}` | Delete section |
| `POST` | `/form-cycles/{cycle_id}/sections/{section_id}/questions` | Create question |
| `PATCH` | `/form-cycles/{cycle_id}/sections/{section_id}/questions/{question_id}` | Update or reorder question |
| `DELETE` | `/form-cycles/{cycle_id}/sections/{section_id}/questions/{question_id}` | Delete question |

Supported `question_type` values: `short_text`, `long_text`, `number`, `single_choice`, `multiple_choice`, `dropdown`, `rating`, `yes_no_na`, and `file_upload`.

```json
{
  "question_type": "rating",
  "question_text": "How stable was login?",
  "description": "Rate from 1 to 5",
  "is_required": true,
  "display_order": 1,
  "config": { "min": 1, "max": 5 }
}
```

## Assignments

All routes require an admin or the original creator of the Form Cycle.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/form-cycles/{cycle_id}/assignments` | List assigned users and submission status |
| `POST` | `/form-cycles/{cycle_id}/assignments` | Assign one or more users |
| `DELETE` | `/form-cycles/{cycle_id}/assignments/{user_id}` | Unassign a user who has not submitted |

```json
{
  "user_ids": ["user-uuid-1", "user-uuid-2"]
}
```

An assignment is unique per `(form_cycle_id, user_id)`.

## Assigned cycles and own submissions

These endpoints are for the authenticated user. They must never return another user's answers.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/me/assigned-form-cycles` | List active Form Cycles assigned to current user |
| `GET` | `/me/submissions` | List current user's submissions |
| `GET` | `/form-cycles/{cycle_id}/my-submission` | Get current user's draft/submission |
| `PATCH` | `/form-cycles/{cycle_id}/my-submission` | Create/update own draft answers |
| `POST` | `/form-cycles/{cycle_id}/my-submission/submit` | Submit own draft |

```json
{
  "answers": [
    { "question_id": "question-uuid-1", "rating_answer": 4 },
    {
      "question_id": "question-uuid-2",
      "text_answer": "Login worked, but the error message was unclear."
    }
  ]
}
```

Submission is rejected after the deadline, after the cycle is closed, or when required answers are missing.

## Submission review

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/form-cycles/{cycle_id}/submissions` | Admin or owner | List submissions to a Form Cycle |
| `GET` | `/form-cycles/{cycle_id}/submissions/{submission_id}` | Admin, owner, or submission owner | Read a submission |
| `POST` | `/form-cycles/{cycle_id}/submissions/{submission_id}/reopen` | Admin or owner | Reopen a submitted response |

The list supports `status`, `user_id`, `sort`, `page`, and `page_size` query parameters.

## Attachments

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/form-cycles/{cycle_id}/my-submission/attachments` | Assigned user | Initialize own attachment upload |
| `POST` | `/attachments/{attachment_id}/content` | Uploading user | Upload file bytes |
| `GET` | `/attachments/{attachment_id}/download` | Uploader, owner, or admin | Download file |

Attachments follow the access rules of their submission. The API validates size, MIME type, ownership, and submission state.

## Reports and audit

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/form-cycles/{cycle_id}/summary` | Admin or owner | Completion/count summary |
| `GET` | `/form-cycles/{cycle_id}/exports/csv` | Admin or owner | Download Form Cycle responses as CSV |
| `GET` | `/audit-logs` | Admin | View audit logs |
