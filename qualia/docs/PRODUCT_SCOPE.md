# Product Scope: Form Cycles

## Purpose

Qualia manages internal QA **Form Cycles**. A Form Cycle is created by a user, assigned to one or more users, completed through individual submissions, and reviewed by its owner or an admin.

The initial product focuses on reliable form creation, assignment, submissions, user management, and access control. AI reports, semantic analysis, exports beyond CSV, and advanced analytics are out of scope.

## Roles and permissions

There are exactly two roles.

| Capability | Admin | User |
| --- | :---: | :---: |
| Manage users, roles, and account status | Yes | No |
| Create Form Cycles | Yes | Yes |
| Manage any Form Cycle | Yes | No |
| Manage a Form Cycle they own | Yes | Yes |
| Assign users to a Form Cycle | Yes | Yes, when they own it |
| Complete an assigned Form Cycle | Yes | Yes |
| View any submission | Yes | Yes |
| View submissions to a Form Cycle they own | Yes | Yes |
| View their own submission | Yes | Yes |

The backend must enforce these rules. Hiding a user-interface action is not authorization.

## Core workflow

```text
Admin or user creates Form Cycle
  → owner adds sections and questions
  → owner assigns users
  → owner publishes Form Cycle
  → assigned users save drafts and submit
  → owner reviews submissions to that Form Cycle
  → owner or admin closes/archives it
```

## Data rules

- A Form Cycle has one owner.
- A Form Cycle can have many assigned users.
- An assigned user can have one submission per Form Cycle.
- The submission database constraint is `UNIQUE(form_cycle_id, submitted_by_user_id)`.
- A submission belongs to exactly one Form Cycle and one submitting user.
- A file belongs to a submission/answer and follows that submission's access rules.
- Form Cycle owners can view submissions only for cycles they own; admins can view all.

## Required feature backlog

### Foundation

- [ ] Define and migrate the Form Cycle ownership, assignment, submission, answer, file, and audit schema.
- [ ] Add database migrations and reproducible backend setup.
- [ ] Add centralized authorization policies and integration tests.

### User management

- [ ] Create real user registration/invitation.
- [ ] Add admin user list, search, create, edit, activate/deactivate, role change, and password-reset actions.
- [ ] Implement password change, token refresh, and logout/session invalidation.

### Form Cycles

- [ ] Create, list, view, edit, publish, close, archive, duplicate, and delete Form Cycles.
- [ ] Add section and question CRUD, ordering, and question-configuration validation.
- [ ] Define the policy for edits after publication.

### Assignments and submissions

- [ ] Assign and unassign multiple users from a Form Cycle.
- [ ] Provide assigned-cycle inbox, draft autosave, draft restoration, validation, submit, and reopen flows.
- [ ] Provide submission history and individual submission access based on ownership and role.
- [ ] Validate required answers and question-specific answers before submit.

### Attachments and review

- [ ] Secure upload and download access for attachments.
- [ ] Provide owner and admin submission lists, individual response views, filtering, and CSV export.
- [ ] Add audit logging for user, Form Cycle, assignment, and submission changes.

## Deferred features

- AI aggregation, deduplication, conflict detection, and recurring-issue tracking.
- PDF/Word reporting and advanced analytics.
- Viewer role.
- Redis, Celery, pgvector, and OpenAI integration.
