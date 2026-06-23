"""Baseline schema migration."""

from alembic import op
import sqlalchemy as sa


revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role_enum = sa.Enum("reviewer", "admin", "viewer", name="user_role_enum")
    form_cycle_status_enum = sa.Enum("draft", "active", "closed", "archived", name="form_cycle_status_enum")
    question_type_enum = sa.Enum(
        "short_text",
        "long_text",
        "number",
        "single_choice",
        "multiple_choice",
        "dropdown",
        "rating",
        "yes_no_na",
        "file_upload",
        name="question_type_enum",
    )
    submission_status_enum = sa.Enum("started", "submitted", "draft", name="submission_status_enum")
    file_storage_type_enum = sa.Enum("s3", "local", name="file_storage_type_enum")
    ai_report_status_enum = sa.Enum("pending", "completed", "failed", name="ai_report_status_enum")

    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("first_name", sa.String(length=255), nullable=True),
        sa.Column("last_name", sa.String(length=255), nullable=True),
        sa.Column("role", user_role_enum, server_default=sa.text("'viewer'"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_email_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index(op.f("ix_users_is_active"), "users", ["is_active"], unique=False)
    op.create_index(op.f("ix_users_role"), "users", ["role"], unique=False)

    op.create_table(
        "form_cycles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("created_by_id", sa.Uuid(), nullable=False),
        sa.Column("status", form_cycle_status_enum, server_default=sa.text("'draft'"), nullable=False),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("submission_deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_form_cycles_created_by_id"), "form_cycles", ["created_by_id"], unique=False)
    op.create_index(op.f("ix_form_cycles_is_published"), "form_cycles", ["is_published"], unique=False)
    op.create_index(op.f("ix_form_cycles_status"), "form_cycles", ["status"], unique=False)
    op.create_index(op.f("ix_form_cycles_submission_deadline"), "form_cycles", ["submission_deadline"], unique=False)

    op.create_table(
        "files",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("uploaded_by", sa.Uuid(), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=True),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("storage_type", file_storage_type_enum, server_default=sa.text("'local'"), nullable=False),
        sa.Column("is_public", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_files_created_at"), "files", ["created_at"], unique=False)
    op.create_index(op.f("ix_files_uploaded_by"), "files", ["uploaded_by"], unique=False)

    op.create_table(
        "form_assignments",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("form_cycle_id", sa.Uuid(), nullable=False),
        sa.Column("assigned_to", sa.Uuid(), nullable=False),
        sa.Column("assigned_by", sa.Uuid(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["assigned_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["assigned_to"], ["users.id"]),
        sa.ForeignKeyConstraint(["form_cycle_id"], ["form_cycles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_cycle_id", "assigned_to", name="uq_form_assignment_form_cycle_assigned_to"),
    )
    op.create_index(op.f("ix_form_assignments_assigned_by"), "form_assignments", ["assigned_by"], unique=False)
    op.create_index(op.f("ix_form_assignments_assigned_to"), "form_assignments", ["assigned_to"], unique=False)
    op.create_index(op.f("ix_form_assignments_form_cycle_id"), "form_assignments", ["form_cycle_id"], unique=False)

    op.create_table(
        "sections",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("form_cycle_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.ForeignKeyConstraint(["form_cycle_id"], ["form_cycles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_cycle_id", "display_order", name="uq_section_form_display_order"),
    )
    op.create_index(op.f("ix_sections_form_cycle_id"), "sections", ["form_cycle_id"], unique=False)

    op.create_table(
        "submissions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("form_cycle_id", sa.Uuid(), nullable=False),
        sa.Column("reviewer_id", sa.Uuid(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("status", submission_status_enum, server_default=sa.text("'draft'"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_saved_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["form_cycle_id"], ["form_cycles.id"]),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("form_cycle_id", name="uq_submissions_form_cycle_id"),
    )
    op.create_index(op.f("ix_submissions_form_cycle_id"), "submissions", ["form_cycle_id"], unique=False)
    op.create_index(op.f("ix_submissions_reviewer_id"), "submissions", ["reviewer_id"], unique=False)

    op.create_table(
        "ai_reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("submission_id", sa.Uuid(), nullable=True),
        sa.Column("status", ai_report_status_enum, server_default=sa.text("'pending'"), nullable=False),
        sa.Column("provider", sa.String(length=255), nullable=False),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_ai_reports_submission_id"), "ai_reports", ["submission_id"], unique=False)

    op.create_table(
        "questions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("section_id", sa.Uuid(), nullable=False),
        sa.Column("form_cycle_id", sa.Uuid(), nullable=False),
        sa.Column("question_text", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("question_type", question_type_enum, server_default=sa.text("'number'"), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("config", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("conditional_logic", sa.JSON(), server_default=sa.text("'{}'"), nullable=False),
        sa.Column("display_order", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("version", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.ForeignKeyConstraint(["form_cycle_id"], ["form_cycles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_questions_form_cycle_id"), "questions", ["form_cycle_id"], unique=False)
    op.create_index(op.f("ix_questions_section_id"), "questions", ["section_id"], unique=False)

    op.create_table(
        "submission_answers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("submission_id", sa.Uuid(), nullable=False),
        sa.Column("question_id", sa.Uuid(), nullable=False),
        sa.Column("text_answer", sa.Text(), nullable=True),
        sa.Column("number_answer", sa.Float(), nullable=True),
        sa.Column("choice_answers", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("rating_answer", sa.Integer(), nullable=True),
        sa.Column("boolean_answer", sa.Boolean(), nullable=True),
        sa.Column("file_ids", sa.JSON(), server_default=sa.text("'[]'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["submission_id"], ["submissions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("submission_id", "question_id", name="uq_submission_answer_submission_question"),
    )
    op.create_index(op.f("ix_submission_answers_question_id"), "submission_answers", ["question_id"], unique=False)
    op.create_index(op.f("ix_submission_answers_submission_id"), "submission_answers", ["submission_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_submission_answers_submission_id"), table_name="submission_answers")
    op.drop_index(op.f("ix_submission_answers_question_id"), table_name="submission_answers")
    op.drop_table("submission_answers")

    op.drop_index(op.f("ix_questions_section_id"), table_name="questions")
    op.drop_index(op.f("ix_questions_form_cycle_id"), table_name="questions")
    op.drop_table("questions")

    op.drop_index(op.f("ix_ai_reports_submission_id"), table_name="ai_reports")
    op.drop_table("ai_reports")

    op.drop_index(op.f("ix_submissions_reviewer_id"), table_name="submissions")
    op.drop_index(op.f("ix_submissions_form_cycle_id"), table_name="submissions")
    op.drop_table("submissions")

    op.drop_index(op.f("ix_sections_form_cycle_id"), table_name="sections")
    op.drop_table("sections")

    op.drop_index(op.f("ix_form_assignments_form_cycle_id"), table_name="form_assignments")
    op.drop_index(op.f("ix_form_assignments_assigned_to"), table_name="form_assignments")
    op.drop_index(op.f("ix_form_assignments_assigned_by"), table_name="form_assignments")
    op.drop_table("form_assignments")

    op.drop_index(op.f("ix_files_uploaded_by"), table_name="files")
    op.drop_index(op.f("ix_files_created_at"), table_name="files")
    op.drop_table("files")

    op.drop_index(op.f("ix_form_cycles_submission_deadline"), table_name="form_cycles")
    op.drop_index(op.f("ix_form_cycles_status"), table_name="form_cycles")
    op.drop_index(op.f("ix_form_cycles_is_published"), table_name="form_cycles")
    op.drop_index(op.f("ix_form_cycles_created_by_id"), table_name="form_cycles")
    op.drop_table("form_cycles")

    op.drop_index(op.f("ix_users_role"), table_name="users")
    op.drop_index(op.f("ix_users_is_active"), table_name="users")
    op.drop_table("users")
