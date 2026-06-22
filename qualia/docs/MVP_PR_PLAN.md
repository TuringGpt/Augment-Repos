# Form Cycle MVP — Small PR Plan

> This plan is based on the current codebase. It is ordered by dependency and user-visible value. Each numbered item is intentionally small enough to review and merge independently.

## MVP demo outcome

The MVP is ready to show when an admin can create users; a normal user can create a Form Cycle; that owner can build and publish it, assign two users, and review their submissions; each assigned user can only submit and view their own response.

```text
Admin creates users
  → user creates Form Cycle
  → owner adds questions and assigns two users
  → users save/submit own answers
  → owner sees both submissions
  → unrelated user receives 403/404
```

## Current-code facts that drive the order

- Roles are currently `admin`, `reviewer`, and `viewer`; the target is `admin` and `user`.
- `FormCycle.created_by_id` already records the original creator, but endpoints only authorize admins.
- `Submission` is incorrectly unique on `form_cycle_id`, allowing one submission per cycle instead of one per user.
- `assign-reviewer` deliberately rejects assigning a second reviewer.
- Signup validates input but does not create a user.
- Current tests require a manual `PYTHONPATH` and one test fails.
- No migration system or backend dependency manifest is committed.

## Phase 0 — Make change safe

### PR-01 — Add a reproducible backend test command

**Change**

- Add the backend dependency manifest and pytest configuration so `pytest` finds `app` without manually setting `PYTHONPATH`.
- Document one canonical test command.

**Done when**

- A clean checkout can install backend dependencies.
- `pytest` discovers the existing tests from the backend directory and repository root.

**Why first**: every later PR needs a reliable test command.

### PR-02 — Repair the failing existing test/contract

**Change**

- Make question updates preserve the documented empty-object defaults for `config` and `conditional_logic`.
- Do not change behavior outside question updates.

**Done when**

- The existing backend suite is green with no test skipped or weakened.

**Depends on**: PR-01.

### PR-03 — Add migration infrastructure

**Change**

- Add Alembic (or the chosen migration tool), initial configuration, and a baseline migration matching the committed schema.
- Keep the existing SQLite seed script only as local demo data.

**Done when**

- A new database can be created using migrations.
- Running migrations twice is safe.

**Depends on**: PR-01.

## Phase 1 — Identity and authorization foundation

### PR-04 — Migrate to two roles

**Change**

- Replace `reviewer` and `viewer` with `user` in the role enum and seed data.
- Add a data migration mapping existing reviewers to users and defining a safe migration policy for viewers.

**Done when**

- Only `admin` and `user` can be persisted.
- Seeded admin and normal-user accounts can log in.

**Depends on**: PR-03.

### PR-05 — Centralize current-user authentication

**Change**

- Introduce one reusable dependency that validates Bearer token, loads the active user, and exposes the current user to routes.
- Replace duplicate token-parsing code in existing routes.

**Done when**

- Inactive users are rejected consistently.
- Existing protected endpoints keep their intended authentication behavior.

**Depends on**: PR-04.

### PR-06 — Add Form Cycle owner authorization policy

**Change**

- Add reusable policies: `require_admin`, `require_cycle_owner_or_admin`, and `require_assignee`.
- Define owner as `FormCycle.created_by_id` without renaming database fields yet.

**Done when**

- Admin is allowed for every policy.
- A user who created a cycle passes owner checks only for that cycle.
- An unrelated user is denied.

**Depends on**: PR-05.

### PR-07 — Add authorization-policy tests

**Change**

- Add focused tests for admin, owner, assigned user, and unrelated user against the new policy functions.

**Done when**

- Tests prove assignment does not grant Form Cycle edit rights.

**Depends on**: PR-06.

## Phase 2 — Users and Form Cycle ownership

### PR-08 — Implement admin user creation

**Change**

- Replace fake signup behavior with admin-only user creation.
- Persist name/username, email, password hash, `user` role, and active state.

**Done when**

- Admin can create a normal user who can log in.
- Duplicate email/username returns `409`.

**Depends on**: PR-05.

### PR-09 — Add admin user list endpoint

**Change**

- Add paginated `GET /users` for admins with name/email search and active-status filter.

**Done when**

- A normal user receives `403`.
- Password hashes are never returned.

**Depends on**: PR-08.

### PR-10 — Allow normal users to create Form Cycles

**Change**

- Change Form Cycle creation from admin-only to authenticated admin/user.
- Always set `created_by_id` to the current user.

**Done when**

- A normal user creates a cycle and is recorded as its owner.
- An admin can also create a cycle.

**Depends on**: PR-06.

### PR-11 — Add accessible Form Cycle list

**Change**

- Add `GET /form-cycles`.
- Admin sees all; normal user sees owned cycles and assigned cycles, without duplicates.

**Done when**

- List results never expose unrelated cycles to a normal user.

**Depends on**: PR-10.

### PR-12 — Apply owner policy to Form Cycle publishing

**Change**

- Allow original creator or admin to publish a cycle.
- Keep assigned users unable to publish.

**Done when**

- Owner can publish; assignee gets `403`.

**Depends on**: PR-06, PR-10.

### PR-13 — Apply owner policy to sections

**Change**

- Change section creation authorization from admin-only to owner-or-admin.

**Done when**

- The owner can create a section; an assignee cannot.

**Depends on**: PR-06.

### PR-14 — Apply owner policy to questions

**Change**

- Change question create, update, and delete authorization from admin-only to owner-or-admin.

**Done when**

- The owner can manage questions; an assignee cannot change a question.

**Depends on**: PR-06.

## Phase 3 — Multi-user assignment and submission MVP

### PR-15 — Fix submission uniqueness for multiple users

**Change**

- Replace `UNIQUE(form_cycle_id)` with `UNIQUE(form_cycle_id, reviewer_id)` in the current schema and migration.
- Keep field names unchanged in this PR to limit scope.

**Done when**

- Two users can have independent submissions to one Form Cycle.
- The same user cannot have two submissions to the same cycle.

**Depends on**: PR-03, PR-04.

### PR-16 — Permit owner-or-admin assignment management

**Change**

- Replace admin-only assignment authorization with owner-or-admin authorization.
- Rename `assign-reviewer` behavior/messages to use `user` terminology while retaining compatibility only if needed.

**Done when**

- Owner can assign users to own cycle; unrelated user cannot.

**Depends on**: PR-06, PR-15.

### PR-17 — Permit multiple assignments

**Change**

- Remove the second-user rejection in assignment logic.
- Create one submission record per assignment using the corrected constraint.

**Done when**

- Owner assigns one user successfully.
- Reassigning the same user returns `409`.

**Depends on**: PR-15, PR-16.

### PR-18 — List a Form Cycle’s assignments

**Change**

- Add `GET /form-cycles/{cycle_id}/assignments` for admin/owner.
- Return assigned user identity and their own submission status only.

**Done when**

- Owner can see assignment progress; assignee cannot enumerate peers.

**Depends on**: PR-17.

### PR-19 — Rename reviewer submission authorization to user submission authorization

**Change**

- Update assigned-form listing, draft autosave, submit, and attachment initialization to use role `user`.
- Preserve the requirement that the user is assigned to the Form Cycle.

**Done when**

- An assigned normal user can list, save, and submit their cycle.

**Depends on**: PR-04, PR-17.

### PR-20 — Add own-submission retrieval

**Change**

- Add `GET /form-cycles/{cycle_id}/my-submission`.
- Return only the caller’s draft/submitted answers and attachment IDs.

**Done when**

- A user can reload a saved draft.
- A user cannot retrieve another user’s answer through this route.

**Depends on**: PR-19.

### PR-21 — Add own-submission history

**Change**

- Add `GET /me/submissions` with status/date pagination for the current user.

**Done when**

- Results contain only the caller’s submissions.

**Depends on**: PR-19.

### PR-22 — Add owner submission list authorization

**Change**

- Allow the Form Cycle owner as well as admin to use the existing submission-list route.
- Keep assignees denied.

**Done when**

- Owner sees all submissions for own cycle; unrelated user receives `403`.

**Depends on**: PR-06, PR-17.

### PR-23 — Add individual submission detail

**Change**

- Add `GET /form-cycles/{cycle_id}/submissions/{submission_id}`.
- Authorize admin, owner, and the submission’s own user only.

**Done when**

- The response includes answers and permitted attachment metadata.
- Cross-user access is denied.

**Depends on**: PR-20, PR-22.

### MVP cut line

After PR-23, the agreed MVP can be demonstrated end-to-end. Do not begin advanced reporting or file redesign before this acceptance scenario is automated:

1. Admin creates two normal users.
2. Normal user creates and publishes a Form Cycle.
3. Owner creates questions and assigns both users.
4. Both users submit distinct answers.
5. Owner sees both submissions.
6. One assigned user cannot view the other’s answers or edit the cycle.

## Phase 4 — MVP hardening

### PR-24 — Validate answer type against question type

**Change**

- Validate answer fields on autosave and submit: option membership, rating range, number/text/boolean compatibility, and file-question rules.

**Done when**

- Invalid answers return `422`; valid answers remain saveable.

**Depends on**: PR-20.

### PR-25 — Add question configuration validation

**Change**

- Validate question `config` when creating/updating a question, including required options and rating bounds.

**Done when**

- Invalid question definitions cannot be published.

**Depends on**: PR-14.

### PR-26 — Add unassign endpoint

**Change**

- Add owner/admin unassignment for users who have not submitted.
- Define a conflict response if a submitted assignment is removed.

**Done when**

- Owner can remove an unstarted/draft assignment without corrupting data.

**Depends on**: PR-18.

### PR-27 — Add Form Cycle update endpoint

**Change**

- Add owner/admin `PATCH /form-cycles/{cycle_id}` for title, description, and deadline.
- Lock or explicitly reject prohibited changes after publication.

**Done when**

- Assignees cannot update Form Cycle metadata.

**Depends on**: PR-06.

### PR-28 — Add Form Cycle close endpoint

**Change**

- Add owner/admin close transition and reject subsequent saves/submissions.

**Done when**

- A closed cycle cannot accept draft updates or submissions.

**Depends on**: PR-12.

### PR-29 — Add submission reopen endpoint

**Change**

- Let owner/admin reopen a submitted response before the deadline.

**Done when**

- Reopened user can edit own draft; other users remain unable to edit it.

**Depends on**: PR-23, PR-28.

### PR-30 — Add section update endpoint

**Change**

- Add owner/admin update for section title and display order.

**Done when**

- Ordering remains unique within a Form Cycle.

**Depends on**: PR-13.

### PR-31 — Add section delete endpoint

**Change**

- Add owner/admin section deletion with explicit behavior for its questions and existing answers.

**Done when**

- Deletion cannot leave orphaned questions or answers.

**Depends on**: PR-30.

### PR-32 — Add Form Cycle archive/delete endpoints

**Change**

- Add owner/admin archive; permit deletion only for draft or archived cycles.

**Done when**

- Lifecycle transitions are enforced and audited in tests.

**Depends on**: PR-28.

## Phase 5 — Attachments, review, and admin operations

### PR-33 — Link files to submissions and answers

**Change**

- Add explicit `submission_id` and optional `submission_answer_id` to files/attachments.
- Backfill current pending-file associations where possible.

**Done when**

- File ownership does not depend on parsing `storage_path`.

**Depends on**: PR-20.

### PR-34 — Add attachment download endpoint

**Change**

- Add download authorization for uploader, Form Cycle owner, and admin.

**Done when**

- An unrelated user cannot download an attachment.

**Depends on**: PR-33.

### PR-35 — Add Form Cycle summary endpoint

**Change**

- Add owner/admin counts for assigned, draft, submitted, overdue, and unstarted users.

**Done when**

- Counts match assignment and submission records.

**Depends on**: PR-18, PR-22.

### PR-36 — Add CSV export

**Change**

- Add owner/admin CSV export for one Form Cycle’s submissions and answers.

**Done when**

- CSV contains only authorized cycle data and uses stable question columns.

**Depends on**: PR-23.

### PR-37 — Add user activation/deactivation

**Change**

- Add admin-only activate/deactivate endpoint and prevent deactivating the final active admin.

**Done when**

- Deactivated user cannot log in or act.

**Depends on**: PR-09.

### PR-38 — Add audit log model and write service

**Change**

- Add audit records for user lifecycle, cycle lifecycle, assignment, and submission actions.

**Done when**

- Each tracked mutation writes actor, action, resource, and timestamp.

**Depends on**: PR-03.

### PR-39 — Add admin audit-log read endpoint

**Change**

- Add paginated/filterable admin-only audit-log endpoint.

**Done when**

- Normal users cannot access logs.

**Depends on**: PR-38.

## Phase 6 — Deferred cleanup and non-MVP work

### PR-40 — Remove AI report model and seed data

**Change**

- Remove the unused AI report model and demo seed data, with migration.

**Done when**

- No active code imports or creates AI report records.

**Depends on**: PR-03.

### PR-41 — Add refresh-token endpoint

**Change**

- Implement refresh-token verification and access-token rotation.

**Done when**

- A refresh token cannot be used as an access token and expired refresh tokens are rejected.

**Depends on**: PR-05.

### PR-42 — Add password-reset workflow

**Change**

- Add reset-token persistence, request/reset endpoints, expiry, and one-time use.

**Done when**

- Reset does not disclose whether an email exists.

**Depends on**: PR-08.

### PR-43 — Integrate the frontend with the MVP contract

**Change**

- Update frontend role names, Form Cycle routes, owner controls, assignment UI, and own-submission views to the completed API contract.

**Done when**

- The MVP demo can be run from the browser without direct API calls.

**Depends on**: PR-23.

## PR rules

- One behavior change per PR; no unrelated formatting or lockfile rewrites.
- Every endpoint PR includes success, unauthenticated, unauthorized, and cross-user tests.
- Every schema PR includes a forward migration and a data-migration strategy.
- Do not add AI, Redis, Celery, pgvector, or report-generation work before the MVP cut line.
