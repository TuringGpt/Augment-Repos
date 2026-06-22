# Change Record

## 2026-06-20 — Form Cycle scope reset

This record documents the active product decisions made after reviewing the existing backend and documentation.

### Agreed changes

1. The central domain term remains **Form Cycle**. Do not rename it to Form.
2. The product has two roles only: `admin` and `user`.
3. Both admins and users can create Form Cycles.
4. A user manages only Form Cycles they own. An admin manages every Form Cycle.
5. A user can view their own submissions and submissions submitted to Form Cycles they own.
6. A user must not view another user's submission to a Form Cycle they do not own.
7. An admin can view every submission.
8. A Form Cycle supports multiple assigned users and multiple submissions: one submission per assigned user.
9. User management is an admin capability.
10. The immediate scope includes AI reporting and the former viewer role.

### Existing backend items to retain

- FastAPI application and async SQLAlchemy foundation.
- Form Cycle, section, question, assignment, submission, answer, and file concepts.
- JWT login, password hashing, draft autosave, submission, and local file-upload foundations.

### Existing backend items requiring change

- Replace the three-role model (`admin`, `reviewer`, `viewer`) with `admin` and `user`.
- Make signup create a real user; the current endpoint only returns a success-shaped response.
- Change submission uniqueness from `UNIQUE(form_cycle_id)` to `UNIQUE(form_cycle_id, submitted_by_user_id)`.
- Remove assignment logic that prevents a second user from being assigned to the same Form Cycle.
- Add ownership-based authorization to every Form Cycle, submission, and file action.
- Add draft-answer retrieval, user management, form-cycle lifecycle operations, migrations, and test configuration.

### Removed from active scope

- Viewer role and viewer dashboards.
- AI reports, embeddings, semantic clustering, duplicate/conflict detection, and recurring-bug tracking.
- Redis, Celery, pgvector, and OpenAI dependencies.
- The prior API and infrastructure promises in the historical documents.

### Documentation effect

`PRODUCT_SCOPE.md` is now the active product requirements document. The earlier HLD, LLD, API reference, and getting-started guide remain historical until they are rewritten to match this scope.
