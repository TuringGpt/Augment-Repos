# Qualia

Qualia is an internal QA form-cycle application. Users create **Form Cycles**, assign people to complete them, collect submissions, and review the resulting answers.

The active product scope targets two roles:

| Role | Access |
| --- | --- |
| **Admin** | Manages every user, Form Cycle, assignment, and submission. |
| **User** | Creates and manages their own Form Cycles, completes assigned cycles, and sees only their own submissions or submissions to cycles they own. |

This is the target access model for the Form Cycle MVP. The current backend still contains legacy `admin`, `reviewer`, and `viewer` roles while that transition is in progress:

- An admin can access every record.
- A user who owns a Form Cycle can manage it and view submissions made to it.
- An assigned user can create, save, submit, and view submissions for their assigned Form Cycle.
- A user cannot view another user's submission unless they own that Form Cycle.

## Current product direction

The immediate goal is a reliable Form Cycle workflow, not AI reporting:

1. Admin manages users.
2. Admin or user creates a Form Cycle.
3. The owner assigns users and publishes the cycle.
4. Assigned users save drafts and submit answers before the deadline.
5. The owner reviews submissions to that cycle; admins can review all submissions.

See [Product Scope](docs/PRODUCT_SCOPE.md) for the authoritative feature scope and [Change Record](docs/CHANGE_RECORD.md) for the changes agreed during the current review.

## Documentation status

The legacy architecture docs at `qualia/docs/HLD.md` and `qualia/docs/LLD.md` describe an earlier, broader AI-platform proposal. Use `qualia/backend/setup.md` for the current backend setup, and treat the legacy docs as historical context only.
