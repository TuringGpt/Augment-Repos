import asyncio
from datetime import UTC, datetime, timedelta
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import _database_url
from app.core.database import Base
from app.core.security import hash_password
from app.models import (
    AIReport,
    AIReportStatus,
    File,
    FormAssignment,
    FormCycle,
    FormCycleStatus,
    Question,
    QuestionType,
    Role,
    Section,
    StorageType,
    Submission,
    SubmissionAnswer,
    SubmissionStatus,
    User,
)


def _sqlite_database_url() -> str:
    database_url = _database_url()
    parsed = urlparse(database_url)
    if parsed.scheme != "sqlite+aiosqlite":
        raise RuntimeError(
            "seed_sqlite.py only supports sqlite+aiosqlite DATABASE_URL values."
        )
    return database_url


async def seed_database() -> str:
    database_url = _sqlite_database_url()
    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)

        now = datetime.now(UTC)

        async with session_factory() as session:
            admin = User(
                email="admin@qualia.local",
                username="admin",
                password_hash=hash_password("admin123"),
                first_name="Ada",
                last_name="Admin",
                role=Role.admin,
                is_active=True,
                is_email_verified=True,
            )
            reviewer = User(
                email="reviewer@qualia.local",
                username="reviewer",
                password_hash=hash_password("reviewer123"),
                first_name="Rita",
                last_name="Reviewer",
                role=Role.reviewer,
                is_active=True,
                is_email_verified=True,
            )
            viewer = User(
                email="viewer@qualia.local",
                username="viewer",
                password_hash=hash_password("viewer123"),
                first_name="Victor",
                last_name="Viewer",
                role=Role.viewer,
                is_active=True,
                is_email_verified=True,
            )
            session.add_all([admin, reviewer, viewer])
            await session.flush()

            form_cycle = FormCycle(
                title="Sprint 24 QA Cycle",
                description="Sample seeded form cycle for local development.",
                created_by_id=admin.id,
                status=FormCycleStatus.active,
                version=1,
                is_published=True,
                submission_deadline=now + timedelta(days=7),
            )
            session.add(form_cycle)
            await session.flush()

            section_ui = Section(
                form_cycle_id=form_cycle.id,
                title="UI Testing",
                display_order=1,
            )
            section_api = Section(
                form_cycle_id=form_cycle.id,
                title="API Testing",
                display_order=2,
            )
            session.add_all([section_ui, section_api])
            await session.flush()

            question_text = Question(
                section_id=section_ui.id,
                form_cycle_id=form_cycle.id,
                question_text="Describe any visual issues you noticed.",
                description="Capture layout, spacing, and contrast problems.",
                question_type=QuestionType.long_text,
                is_required=True,
                config={},
                conditional_logic={},
                display_order=1,
                version=1,
            )
            question_rating = Question(
                section_id=section_api.id,
                form_cycle_id=form_cycle.id,
                question_text="Rate API response consistency.",
                description="1 is poor, 5 is excellent.",
                question_type=QuestionType.rating,
                is_required=True,
                config={"min": 1, "max": 5},
                conditional_logic={},
                display_order=2,
                version=1,
            )
            question_file = Question(
                section_id=section_ui.id,
                form_cycle_id=form_cycle.id,
                question_text="Upload a screenshot if a UI issue was found.",
                description="Attach supporting evidence.",
                question_type=QuestionType.file_upload,
                is_required=False,
                config={"max_files": 3},
                conditional_logic={},
                display_order=3,
                version=1,
            )
            session.add_all([question_text, question_rating, question_file])
            await session.flush()

            session.add(
                FormAssignment(
                    form_cycle_id=form_cycle.id,
                    assigned_to=reviewer.id,
                    assigned_by=admin.id,
                )
            )

            submission = Submission(
                form_cycle_id=form_cycle.id,
                reviewer_id=reviewer.id,
                status=SubmissionStatus.submitted,
                started_at=now - timedelta(hours=2),
                submitted_at=now - timedelta(hours=1),
            )
            session.add(submission)
            await session.flush()

            file_record = File(
                uploaded_by=reviewer.id,
                file_name="checkout-spacing-bug.png",
                file_size=245760,
                mime_type="image/png",
                storage_path=f"pending/{form_cycle.id}/{reviewer.id}/checkout-spacing-bug.png",
                storage_type=StorageType.local,
                is_public=False,
            )
            session.add(file_record)
            await session.flush()

            session.add_all(
                [
                    SubmissionAnswer(
                        submission_id=submission.id,
                        question_id=question_text.id,
                        text_answer="Spacing breaks on the checkout summary when the viewport is narrow.",
                    ),
                    SubmissionAnswer(
                        submission_id=submission.id,
                        question_id=question_rating.id,
                        rating_answer=3,
                    ),
                    SubmissionAnswer(
                        submission_id=submission.id,
                        question_id=question_file.id,
                        file_ids=[str(file_record.id)],
                    ),
                ]
            )
            session.add(
                AIReport(
                    submission_id=submission.id,
                    status=AIReportStatus.complete,
                    provider="openai",
                )
            )
            await session.commit()

        return engine.sync_engine.url.render_as_string(hide_password=True)
    finally:
        await engine.dispose()


def main() -> None:
    database_url = asyncio.run(seed_database())
    print(f"Seeded SQLite database at {database_url}")


if __name__ == "__main__":
    main()
