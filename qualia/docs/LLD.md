# Qualia - Low-Level Design (LLD)

> **Historical document.** This specification is not the active schema or API contract. Follow [Product Scope](./PRODUCT_SCOPE.md) and [Change Record](./CHANGE_RECORD.md) for new work.

## 1. Database Schema Design

### 1.1 Entity Relationship Diagram (ERD) Overview

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │──────<│   FormCycle  │>──────│   Question   │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                       │
       │                      │                       │
       │               ┌──────▼──────┐                │
       │               │  Submission │                │
       │               └──────┬──────┘                │
       │                      │                       │
       └──────────────────────┴───────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   SubmissionAnswer │
                    └────────────────────┘
```

### 1.2 Core Tables

**Technology**: SQLAlchemy 2.0+ with async support, Alembic for migrations

#### 1.2.1 Users Table
**Fields**:
- `id` (UUID, primary key)
- `email` (String, unique, indexed)
- `username` (String, unique)
- `password_hash` (String)
- `first_name`, `last_name` (String)
- `role` (Enum: admin, reviewer, viewer, indexed)
- `is_active`, `is_email_verified` (Boolean)
- `last_login`, `created_at`, `updated_at` (DateTime with timezone)

**Relationships**:
- Has many: form_cycles_created, submissions, assignments

**Indexes**: email, role, is_active

#### 1.2.2 FormCycle Table
**Fields**:
- `id` (UUID, primary key)
- `title`, `description` (String, Text)
- `status` (Enum: draft, active, closed, archived, indexed)
- `created_by_id` (UUID, foreign key to users, indexed)
- `submission_deadline` (DateTime, indexed)
- `is_published` (Boolean, default False)
- `version` (Integer, default 1)
- `created_at`, `updated_at` (DateTime)

**Relationships**:
- Belongs to: User (created_by)
- Has many: sections, questions, assignments, submissions (cascade delete)

**Indexes**: status, created_by_id, submission_deadline

#### 1.2.3 Sections Table
**Fields**:
- `id` (UUID, primary key)
- `form_cycle_id` (UUID, foreign key, cascade delete)
- `title`, `description` (String, Text)
- `display_order` (Integer)
- `created_at`, `updated_at` (DateTime)

**Relationships**:
- Belongs to: FormCycle
- Has many: questions

**Indexes**: form_cycle_id, (form_cycle_id, display_order)

#### 1.2.4 Questions Table
**Fields**:
- `id` (UUID, primary key)
- `section_id`, `form_cycle_id` (UUID, foreign keys, cascade delete)
- `question_type` (Enum: short_text, long_text, single_choice, multiple_choice, dropdown, rating, yes_no_na, file_upload)
- `question_text`, `description` (Text)
- `is_required` (Boolean, default False)
- `display_order`, `version` (Integer)
- `config` (JSONB) - Question-specific settings (options, min/max, labels)
- `conditional_logic` (JSONB) - Show/hide rules based on other answers
- `created_at`, `updated_at` (DateTime)

**Configuration Examples**:
- Rating: `{"min": 1, "max": 5, "labels": {"1": "Poor", "5": "Excellent"}}`
- Choice: `{"options": ["Option A", "Option B"], "allow_other": true}`

**Conditional Logic Example**:
```json
{"show_if": {"type": "all", "conditions": [{"question_id": "uuid", "operator": "equals", "value": "Yes"}]}}
```

**Relationships**:
- Belongs to: Section, FormCycle
- Has many: submission_answers

**Indexes**: section_id, form_cycle_id, (section_id, display_order), question_type

#### 1.2.5 FormAssignments Table
**Fields**:
- `id` (UUID, primary key)
- `form_cycle_id`, `assigned_to`, `assigned_by` (UUID, foreign keys)
- `assigned_at` (DateTime)

**Constraints**: UNIQUE(form_cycle_id, assigned_to)

**Indexes**: form_cycle_id, assigned_to

#### 1.2.6 Submissions Table
**Fields**:
- `id` (UUID, primary key)
- `form_cycle_id`, `submitted_by` (UUID, foreign keys, cascade delete)
- `status` (Enum: not_started, in_progress, submitted)
- `started_at`, `submitted_at`, `last_saved_at` (DateTime)
- `is_late` (Boolean, default False)
- `created_at`, `updated_at` (DateTime)

**Constraints**: UNIQUE(form_cycle_id, submitted_by)

**Indexes**: form_cycle_id, submitted_by, status, submitted_at

#### 1.2.7 SubmissionAnswers Table
**Fields**:
- `id` (UUID, primary key)
- `submission_id`, `question_id` (UUID, foreign keys, cascade delete)
- **Polymorphic answer fields** (based on question_type):
  - `text_answer` (Text) - for short_text, long_text
  - `choice_answers` (JSONB Array) - for single/multiple choice, dropdown
  - `rating_answer` (Integer) - for rating
  - `boolean_answer` (Boolean) - for yes_no_na
  - `file_ids` (JSONB Array) - for file_upload
- `created_at`, `updated_at` (DateTime)

**Constraints**: UNIQUE(submission_id, question_id)

**Indexes**: submission_id, question_id

#### 1.2.8 Files Table
**Fields**:
- `id` (UUID, primary key)
- `uploaded_by` (UUID, foreign key to users)
- `file_name` (String)
- `file_size` (BigInt, bytes)
- `mime_type` (String)
- `storage_path` (Text) - S3 key or local path
- `storage_type` (Enum: s3, local)
- `is_public` (Boolean, default False)
- `created_at` (DateTime)

**Indexes**: uploaded_by, created_at

#### 1.2.9 AIReports Table
**Fields**:
- `id` (UUID, primary key)
- `form_cycle_id`, `generated_by` (UUID, foreign keys)
- `status` (Enum: pending, processing, completed, failed)
- **AI Processing Results**:
  - `executive_summary`, `recommendations` (Text)
  - `total_issues`, `critical_issues`, `minor_issues` (Integer)
  - `deduplicated_issues` (JSONB) - Merged issues with reviewer counts
  - `conflicting_opinions` (JSONB) - Array of conflicts
  - `issue_clusters` (JSONB) - Thematic clusters
  - `recurring_patterns` (JSONB) - Cross-cycle issue tracking
- **Metadata**:
  - `processing_time_seconds` (Integer)
  - `ai_model_used` (String) - e.g., "gpt-4o"
  - `ai_cost_usd` (Decimal)
- `pdf_file_id`, `docx_file_id` (UUID, foreign keys to files)
- `created_at`, `updated_at` (DateTime)

**Indexes**: form_cycle_id, status, created_at

#### 1.2.10 IssueRegistry Table (Recurring Pattern Tracking)
**Fields**:
- `id` (UUID, primary key)
- `title` (String, max 500)
- `description` (Text)
- `category` (String) - e.g., "Performance", "UI/UX", "API"
- `severity` (Enum: critical, high, medium, low)
- `status` (Enum: known, resolved, regressed, ignored)
- `first_seen_cycle_id`, `last_seen_cycle_id` (UUID, foreign keys)
- `occurrence_count` (Integer, default 1)
- `embedding` (Vector[1536]) - OpenAI embedding for similarity matching
- `created_at`, `updated_at` (DateTime)

**Indexes**:
- status, category, first_seen_cycle_id
- Vector similarity index (pgvector ivfflat with cosine distance)

**Note**: Requires pgvector extension for vector similarity search

#### 1.2.11 AuditLogs Table
**Fields**:
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key, nullable)
- `action` (String) - e.g., "form_created", "submission_deleted"
- `resource_type`, `resource_id` (String, UUID) - e.g., "form_cycle"
- `changes` (JSONB) - Before/after values
- `ip_address` (INET)
- `user_agent` (Text)
- `created_at` (DateTime)

**Indexes**: user_id, action, (resource_type, resource_id), created_at

---

## 2. API Specification

### 2.1 API Versioning
- **Base URL**: `/api/v1/`
- **Versioning Strategy**: URL-based (e.g., `/api/v1/`, `/api/v2/`)
- **Content Type**: `application/json`
- **Authentication**: JWT Bearer token in `Authorization` header
- **Framework**: FastAPI with automatic OpenAPI/Swagger documentation
- **Validation**: Pydantic models for request/response validation

### 2.2 Authentication Endpoints

#### POST `/api/v1/auth/register/`
**Request Body**:
```json
{
  "email": "reviewer@example.com",
  "username": "john_doe",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "role": "reviewer"
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "uuid",
    "email": "reviewer@example.com",
    "username": "john_doe",
    "role": "reviewer"
  },
  "message": "Registration successful. Please verify your email."
}
```

#### POST `/api/v1/auth/login/`
**Request Body**:
```json
{
  "email": "reviewer@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "reviewer@example.com",
    "username": "john_doe",
    "role": "reviewer",
    "full_name": "John Doe"
  },
  "expires_in": 1800
}
```

#### POST `/api/v1/auth/refresh/`
**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 1800
}
```

### 2.3 Form Builder Endpoints (Admin Only)

#### GET `/api/v1/forms/`
List all form cycles

**Query Parameters**:
- `status`: Filter by status (draft, active, closed, archived)
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `search`: Search in title/description

**Response** (200 OK):
```json
{
  "count": 50,
  "next": "/api/v1/forms/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "title": "Q2 2026 QA Cycle",
      "description": "Quarterly QA review",
      "status": "active",
      "is_published": true,
      "submission_deadline": "2026-06-30T23:59:59Z",
      "created_by": {
        "id": "uuid",
        "full_name": "Admin User"
      },
      "created_at": "2026-05-01T10:00:00Z",
      "total_questions": 25,
      "total_submissions": 12,
      "total_assignments": 20
    }
  ]
}
```

#### POST `/api/v1/forms/`
Create a new form cycle

**Request Body**:
```json
{
  "title": "Q2 2026 QA Cycle",
  "description": "Quarterly QA review for product release",
  "submission_deadline": "2026-06-30T23:59:59Z"
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Q2 2026 QA Cycle",
  "description": "Quarterly QA review for product release",
  "status": "draft",
  "is_published": false,
  "submission_deadline": "2026-06-30T23:59:59Z",
  "created_by": {
    "id": "uuid",
    "full_name": "Admin User"
  },
  "created_at": "2026-05-20T10:00:00Z",
  "version": 1
}
```

#### GET `/api/v1/forms/{form_id}/`
Get form cycle details with all questions

**Response** (200 OK):
```json
{
  "id": "uuid",
  "title": "Q2 2026 QA Cycle",
  "description": "Quarterly QA review",
  "status": "active",
  "is_published": true,
  "submission_deadline": "2026-06-30T23:59:59Z",
  "sections": [
    {
      "id": "uuid",
      "title": "UI Testing",
      "description": "User interface testing feedback",
      "display_order": 1,
      "questions": [
        {
          "id": "uuid",
          "question_type": "long_text",
          "question_text": "Describe any UI inconsistencies found",
          "description": "Please provide detailed descriptions",
          "is_required": true,
          "display_order": 1,
          "config": {},
          "conditional_logic": null
        },
        {
          "id": "uuid",
          "question_type": "rating",
          "question_text": "Rate the overall UI quality",
          "is_required": true,
          "display_order": 2,
          "config": {
            "min": 1,
            "max": 5,
            "labels": {
              "1": "Poor",
              "3": "Average",
              "5": "Excellent"
            }
          }
        }
      ]
    }
  ],
  "created_at": "2026-05-01T10:00:00Z",
  "total_questions": 25
}
```

#### PUT `/api/v1/forms/{form_id}/`
Update form cycle

**Request Body**:
```json
{
  "title": "Q2 2026 QA Cycle (Updated)",
  "description": "Updated description",
  "submission_deadline": "2026-07-15T23:59:59Z"
}
```

#### POST `/api/v1/forms/{form_id}/sections/`
Add a section to form

**Request Body**:
```json
{
  "title": "Performance Testing",
  "description": "Performance-related questions",
  "display_order": 2
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "title": "Performance Testing",
  "description": "Performance-related questions",
  "display_order": 2,
  "form_cycle_id": "uuid",
  "created_at": "2026-05-20T10:00:00Z"
}
```

#### POST `/api/v1/forms/{form_id}/sections/{section_id}/questions/`
Add a question to section

**Request Body**:
```json
{
  "question_type": "single_choice",
  "question_text": "Did you encounter any performance issues?",
  "description": "Select one option",
  "is_required": true,
  "display_order": 1,
  "config": {
    "options": ["Yes", "No", "Not Tested"],
    "allow_other": false
  },
  "conditional_logic": null
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "question_type": "single_choice",
  "question_text": "Did you encounter any performance issues?",
  "is_required": true,
  "display_order": 1,
  "config": {
    "options": ["Yes", "No", "Not Tested"]
  },
  "section_id": "uuid",
  "created_at": "2026-05-20T10:00:00Z"
}
```

#### PUT `/api/v1/forms/{form_id}/sections/{section_id}/questions/{question_id}/`
Update a question

#### DELETE `/api/v1/forms/{form_id}/sections/{section_id}/questions/{question_id}/`
Delete a question

#### POST `/api/v1/forms/{form_id}/reorder-questions/`
Reorder questions (drag-and-drop support)

**Request Body**:
```json
{
  "questions": [
    {"id": "uuid1", "display_order": 1},
    {"id": "uuid2", "display_order": 2},
    {"id": "uuid3", "display_order": 3}
  ]
}
```

#### POST `/api/v1/forms/{form_cycle_id}/publish`
Publish form and make it available to reviewers

**Response** (200 OK):
```json
{
  "id": "uuid",
  "status": "active",
  "is_published": true
}
```

#### POST `/api/v1/forms/{form_id}/assign/`
Assign form to reviewers

**Request Body**:
```json
{
  "user_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response** (200 OK):
```json
{
  "message": "Form assigned to 3 reviewers",
  "assignments": [
    {
      "user_id": "uuid1",
      "user_name": "John Doe",
      "assigned_at": "2026-05-20T10:30:00Z"
    }
  ]
}
```

### 2.4 Submission Endpoints (Reviewer)

#### GET `/api/v1/submissions/my-assignments/`
Get all forms assigned to current user

**Response** (200 OK):
```json
{
  "results": [
    {
      "form_cycle": {
        "id": "uuid",
        "title": "Q2 2026 QA Cycle",
        "description": "Quarterly QA review",
        "submission_deadline": "2026-06-30T23:59:59Z"
      },
      "submission": {
        "id": "uuid",
        "status": "in_progress",
        "started_at": "2026-05-20T09:00:00Z",
        "last_saved_at": "2026-05-20T09:15:00Z",
        "progress_percentage": 40
      },
      "is_late": false,
      "days_remaining": 41
    }
  ]
}
```

#### GET `/api/v1/submissions/{submission_id}/`
Get submission details with all answers

**Response** (200 OK):
```json
{
  "id": "uuid",
  "form_cycle": {
    "id": "uuid",
    "title": "Q2 2026 QA Cycle",
    "sections": [
      {
        "id": "uuid",
        "title": "UI Testing",
        "questions": [
          {
            "id": "uuid",
            "question_type": "long_text",
            "question_text": "Describe any UI inconsistencies",
            "is_required": true
          }
        ]
      }
    ]
  },
  "answers": [
    {
      "question_id": "uuid",
      "text_answer": "Found several UI inconsistencies in the dashboard...",
      "updated_at": "2026-05-20T09:15:00Z"
    }
  ],
  "status": "in_progress",
  "last_saved_at": "2026-05-20T09:15:00Z"
}
```

#### POST `/api/v1/submissions/{submission_id}/save/`
Auto-save submission (called every 30 seconds)

**Request Body**:
```json
{
  "answers": [
    {
      "question_id": "uuid",
      "text_answer": "Partial answer being typed..."
    },
    {
      "question_id": "uuid2",
      "rating_answer": 4
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "message": "Answers saved successfully",
  "last_saved_at": "2026-05-20T09:16:00Z"
}
```

#### POST `/api/v1/forms/{form_cycle_id}/submit`
Final submission

**Headers**:
```http
Authorization: Bearer <reviewer_access_token>
```

**Response** (200 OK):
```json
{
  "submission_id": "uuid",
  "status": "submitted"
}
```

**Error Response** (400 Bad Request):
```json
{
  "detail": "Required questions are missing answers"
}
```

#### GET `/api/v1/submissions/my-history/`
Get submission history for current user

**Query Parameters**:
- `status`: Filter by status
- `page`: Page number
- `page_size`: Items per page

**Response** (200 OK):
```json
{
  "count": 15,
  "results": [
    {
      "id": "uuid",
      "form_cycle": {
        "id": "uuid",
        "title": "Q1 2026 QA Cycle"
      },
      "status": "submitted",
      "submitted_at": "2026-03-31T18:00:00Z",
      "is_late": false
    }
  ]
}
```

### 2.5 File Upload Endpoints

#### POST `/api/v1/files/upload/`
Upload file attachment

**Request**: Multipart form data
- `file`: File to upload (max 10MB)
- `submission_id`: Optional UUID
- `question_id`: Optional UUID

**Response** (201 Created):
```json
{
  "id": "uuid",
  "file_name": "screenshot.png",
  "file_size": 245678,
  "mime_type": "image/png",
  "url": "https://s3.amazonaws.com/bucket/files/uuid.png",
  "created_at": "2026-05-20T09:20:00Z"
}
```

### 2.6 Admin Dashboard Endpoints

#### GET `/api/v1/admin/forms/{form_id}/responses/`
Get all responses for a form (spreadsheet view)

**Query Parameters**:
- `status`: Filter by submission status
- `search`: Search in reviewer names or answers
- `export`: Set to `csv` or `excel` to export

**Response** (200 OK):
```json
{
  "form_cycle": {
    "id": "uuid",
    "title": "Q2 2026 QA Cycle"
  },
  "columns": [
    {"field": "reviewer_name", "label": "Reviewer"},
    {"field": "submission_status", "label": "Status"},
    {"field": "submitted_at", "label": "Submitted At"},
    {"field": "q_uuid1", "label": "Question 1: Describe UI issues", "type": "long_text"},
    {"field": "q_uuid2", "label": "Question 2: Rate UI", "type": "rating"}
  ],
  "rows": [
    {
      "reviewer_name": "John Doe",
      "submission_status": "submitted",
      "submitted_at": "2026-05-20T18:00:00Z",
      "q_uuid1": "Found several UI inconsistencies...",
      "q_uuid2": 4
    }
  ],
  "total_submissions": 12,
  "total_assigned": 20,
  "completion_rate": 60
}
```

#### GET `/api/v1/admin/forms/{form_id}/responses/{submission_id}/`
Get individual submission details

**Response** (200 OK):
```json
{
  "id": "uuid",
  "reviewer": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com"
  },
  "status": "submitted",
  "submitted_at": "2026-05-20T18:00:00Z",
  "is_late": false,
  "answers": [
    {
      "question": {
        "id": "uuid",
        "question_text": "Describe any UI inconsistencies",
        "question_type": "long_text"
      },
      "text_answer": "Found several UI inconsistencies in the dashboard...",
      "attachments": [
        {
          "id": "uuid",
          "file_name": "screenshot.png",
          "url": "https://s3.amazonaws.com/..."
        }
      ]
    }
  ]
}
```

#### GET `/api/v1/admin/forms/{form_id}/statistics/`
Get per-question statistics

**Response** (200 OK):
```json
{
  "form_cycle_id": "uuid",
  "total_submissions": 12,
  "questions_statistics": [
    {
      "question_id": "uuid",
      "question_text": "Rate the overall UI quality",
      "question_type": "rating",
      "response_count": 12,
      "response_rate": 100,
      "statistics": {
        "average": 4.2,
        "median": 4,
        "mode": 5,
        "distribution": {
          "1": 0,
          "2": 1,
          "3": 2,
          "4": 5,
          "5": 4
        }
      }
    },
    {
      "question_id": "uuid2",
      "question_text": "Describe any UI inconsistencies",
      "question_type": "long_text",
      "response_count": 12,
      "response_rate": 100,
      "statistics": {
        "word_frequency": {
          "dashboard": 8,
          "button": 6,
          "alignment": 5
        },
        "avg_word_count": 45
      }
    }
  ]
}
```

#### GET `/api/v1/admin/forms/{form_id}/export/`
Export responses

**Query Parameters**:
- `format`: `csv` or `excel`

**Response**: File download (application/octet-stream)

### 2.7 AI Report Endpoints

#### POST `/api/v1/ai-reports/generate/`
Trigger AI report generation

**Request Body**:
```json
{
  "form_cycle_id": "uuid",
  "options": {
    "include_conflicts": true,
    "include_clustering": true,
    "include_recurring_patterns": true,
    "similarity_threshold": 0.85
  }
}
```

**Response** (202 Accepted):
```json
{
  "message": "AI report generation started",
  "report_id": "uuid",
  "status": "processing",
  "estimated_completion_time": "2026-05-20T10:05:00Z"
}
```

#### GET `/api/v1/ai-reports/{report_id}/`
Get AI report details

**Response** (200 OK):
```json
{
  "id": "uuid",
  "form_cycle": {
    "id": "uuid",
    "title": "Q2 2026 QA Cycle"
  },
  "status": "completed",
  "generated_by": {
    "id": "uuid",
    "full_name": "Admin User"
  },
  "executive_summary": "The Q2 2026 QA cycle identified 45 unique issues across 12 reviewer submissions...",
  "total_issues": 45,
  "critical_issues": 8,
  "minor_issues": 37,
  "deduplicated_issues": [
    {
      "issue_id": "gen_uuid",
      "title": "Dashboard alignment issues",
      "description": "Multiple reviewers reported alignment problems in the dashboard",
      "severity": "medium",
      "reviewer_count": 5,
      "merged_from": [
        {
          "reviewer": "John Doe",
          "original_text": "The dashboard buttons are misaligned"
        },
        {
          "reviewer": "Jane Smith",
          "original_text": "Dashboard has alignment problems"
        }
      ],
      "category": "UI/UX"
    }
  ],
  "conflicting_opinions": [
    {
      "question": "Is the new navigation intuitive?",
      "conflict_severity": "high",
      "opinions": [
        {
          "opinion": "positive",
          "reviewer_count": 7,
          "sample_responses": ["Very intuitive", "Easy to navigate"]
        },
        {
          "opinion": "negative",
          "reviewer_count": 5,
          "sample_responses": ["Confusing", "Hard to find features"]
        }
      ]
    }
  ],
  "issue_clusters": [
    {
      "cluster_name": "Performance Issues",
      "issue_count": 12,
      "severity_summary": {
        "critical": 3,
        "high": 5,
        "medium": 4
      },
      "consensus_score": 0.85,
      "issues": [
        {
          "title": "Slow page load times",
          "reviewer_count": 8
        }
      ]
    }
  ],
  "recurring_patterns": [
    {
      "issue_id": "uuid",
      "title": "Login page timeout",
      "first_seen": "Q4 2025 QA Cycle",
      "occurrence_count": 3,
      "status": "regressed",
      "history": [
        {"cycle": "Q4 2025", "status": "known"},
        {"cycle": "Q1 2026", "status": "resolved"},
        {"cycle": "Q2 2026", "status": "regressed"}
      ]
    }
  ],
  "recommendations": "Based on the analysis, we recommend prioritizing the 8 critical issues...",
  "processing_time_seconds": 87,
  "ai_model_used": "gpt-4o",
  "ai_cost_usd": 0.45,
  "created_at": "2026-05-20T10:00:00Z",
  "pdf_url": "https://s3.amazonaws.com/reports/uuid.pdf",
  "docx_url": "https://s3.amazonaws.com/reports/uuid.docx"
}
```

#### GET `/api/v1/ai-reports/{report_id}/status/`
Check report generation status

**Response** (200 OK):
```json
{
  "report_id": "uuid",
  "status": "processing",
  "progress_percentage": 65,
  "current_step": "Clustering issues",
  "estimated_completion_time": "2026-05-20T10:05:00Z"
}
```

#### GET `/api/v1/ai-reports/{report_id}/download/{format}/`
Download report in specified format

**Path Parameters**:
- `format`: `pdf` or `docx`

**Response**: File download

---

## 3. Component Design

### 3.1 Frontend Component Architecture

#### 3.1.1 Component Hierarchy

```
App
├── AuthProvider
├── Router
│   ├── PublicRoutes
│   │   ├── Login
│   │   ├── Register
│   │   └── ForgotPassword
│   │
│   ├── AdminRoutes (Protected)
│   │   ├── AdminLayout
│   │   │   ├── Sidebar
│   │   │   ├── TopBar
│   │   │   └── Outlet
│   │   │       ├── AdminDashboard
│   │   │       ├── FormBuilder
│   │   │       │   ├── FormList
│   │   │       │   ├── FormEditor
│   │   │       │   │   ├── SectionManager
│   │   │       │   │   ├── QuestionEditor
│   │   │       │   │   │   ├── QuestionTypeSelector
│   │   │       │   │   │   ├── ConditionalLogicBuilder
│   │   │       │   │   │   └── QuestionConfigPanel
│   │   │       │   │   └── DragDropReorder
│   │   │       │   └── FormPreview
│   │   │       ├── ResponseDashboard
│   │   │       │   ├── ResponseSpreadsheet
│   │   │       │   ├── ResponseDetail
│   │   │       │   ├── StatisticsPanel
│   │   │       │   └── ExportButton
│   │   │       └── AIReports
│   │   │           ├── ReportList
│   │   │           ├── ReportViewer
│   │   │           │   ├── ExecutiveSummary
│   │   │           │   ├── IssueList
│   │   │           │   ├── ConflictPanel
│   │   │           │   ├── ClusterView
│   │   │           │   └── RecurringPatterns
│   │   │           └── GenerateReportButton
│   │   │
│   ├── ReviewerRoutes (Protected)
│   │   ├── ReviewerLayout
│   │   │   ├── TopBar
│   │   │   └── Outlet
│   │   │       ├── ReviewerDashboard
│   │   │       │   └── AssignedFormsList
│   │   │       ├── FormSubmission
│   │   │       │   ├── ProgressIndicator
│   │   │       │   ├── SectionNavigation
│   │   │       │   ├── QuestionRenderer
│   │   │       │   │   ├── TextInput
│   │   │       │   │   ├── LongTextInput
│   │   │       │   │   ├── RadioGroup
│   │   │       │   │   ├── CheckboxGroup
│   │   │       │   │   ├── Dropdown
│   │   │       │   │   ├── RatingScale
│   │   │       │   │   ├── YesNoToggle
│   │   │       │   │   └── FileUpload
│   │   │       │   ├── AutoSaveIndicator
│   │   │       │   └── SubmitButton
│   │   │       └── SubmissionHistory
│   │   │
│   └── ViewerRoutes (Protected)
│       └── ViewerLayout
│           ├── TopBar
│           └── Outlet
│               ├── ReportsList
│               └── ReportViewer
│
└── NotificationProvider
```

#### 3.1.2 Key React Components

**FormEditor Component** (Admin)
```typescript
// src/features/admin/form-builder/FormEditor.tsx
interface FormEditorProps {
  formId?: string; // undefined for new forms
}

const FormEditor: React.FC<FormEditorProps> = ({ formId }) => {
  const [formData, setFormData] = useState<FormCycle | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Load form data if editing
  useEffect(() => {
    if (formId) {
      loadFormData(formId);
    }
  }, [formId]);

  const handleAddSection = () => { /* ... */ };
  const handleAddQuestion = () => { /* ... */ };
  const handleReorderQuestions = (result: DropResult) => { /* ... */ };

  return (
    <Box>
      <FormHeader form={formData} onSave={handleSave} />
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <SectionList
            sections={sections}
            onSelect={setSelectedSection}
            onAdd={handleAddSection}
          />
        </Grid>
        <Grid item xs={6}>
          <QuestionEditor
            sectionId={selectedSection}
            onReorder={handleReorderQuestions}
          />
        </Grid>
        <Grid item xs={3}>
          <FormPreview formId={formId} />
        </Grid>
      </Grid>
    </Box>
  );
};
```

**QuestionRenderer Component** (Reviewer)
```typescript
// src/features/reviewer/submission/QuestionRenderer.tsx
interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  isVisible: boolean; // based on conditional logic
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  isVisible
}) => {
  if (!isVisible) return null;

  const renderInput = () => {
    switch (question.question_type) {
      case 'short_text':
        return <TextField value={value} onChange={(e) => onChange(e.target.value)} />;

      case 'long_text':
        return <TextField multiline rows={4} value={value} onChange={(e) => onChange(e.target.value)} />;

      case 'single_choice':
        return (
          <RadioGroup value={value} onChange={(e) => onChange(e.target.value)}>
            {question.config.options.map(opt => (
              <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
            ))}
          </RadioGroup>
        );

      case 'rating':
        return (
          <Rating
            value={value}
            onChange={(e, newValue) => onChange(newValue)}
            max={question.config.max}
          />
        );

      case 'file_upload':
        return <FileUploadComponent value={value} onChange={onChange} />;

      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <Box mb={3}>
      <Typography variant="h6">
        {question.question_text}
        {question.is_required && <span style={{color: 'red'}}> *</span>}
      </Typography>
      {question.description && (
        <Typography variant="body2" color="textSecondary">{question.description}</Typography>
      )}
      {renderInput()}
    </Box>
  );
};
```

**AutoSave Hook**
```typescript
// src/hooks/useAutoSave.ts
interface UseAutoSaveOptions {
  submissionId: string;
  onSave: (data: any) => Promise<void>;
  interval?: number; // milliseconds, default 30000
}

export const useAutoSave = ({ submissionId, onSave, interval = 30000 }: UseAutoSaveOptions) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const dataRef = useRef<any>(null);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (dataRef.current) {
        setIsSaving(true);
        try {
          await onSave(dataRef.current);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onSave, interval]);

  const updateData = (newData: any) => {
    dataRef.current = newData;
  };

  return { lastSaved, isSaving, updateData };
};
```

### 3.2 Backend Architecture (FastAPI)

**Framework**: FastAPI with async/await support
**ORM**: SQLAlchemy 2.0+ with async engine
**Validation**: Pydantic v2 models for request/response schemas
**Dependency Injection**: FastAPI's built-in DI system
**Database Sessions**: Async session per request

#### 3.2.1 Service Layer Pattern

**FormService** - Form management operations
- `create_form_with_structure()` - Create form with sections and questions in transaction
- `publish_form()` - Validate and publish form
- `assign_form_to_reviewers()` - Bulk assign forms to users
- `list_forms()` - List with filtering, pagination
- `get_form_detail()` - Load form with all relationships

**SubmissionService** - Submission operations
- `get_or_create_submission()` - Initialize submission for reviewer
- `save_answers()` - Auto-save submission answers (upsert logic)
- `submit_submission()` - Validate required fields and submit
- `get_submission_history()` - Reviewer's past submissions

**AIService** - AI-powered analysis
- `generate_embeddings()` - OpenAI embedding generation
- `find_duplicates()` - Cosine similarity matching (threshold: 0.85)
- `detect_conflicts()` - LLM-based conflict detection
- `cluster_issues()` - DBSCAN clustering on embeddings
- `generate_executive_summary()` - GPT-4 summary generation

**ReportService** - Report generation (Celery task)
- `generate_ai_report_task()` - Async task for full report generation
- `export_to_pdf()` - PDF generation with ReportLab
- `export_to_excel()` - Excel export with openpyxl

#### 3.2.2 API Router Pattern

**Structure**:
```
app/api/v1/
├── endpoints/
│   ├── auth.py          # Login, register, refresh token
│   ├── forms.py         # Form CRUD, publish, assign
│   ├── submissions.py   # Submission CRUD, auto-save, submit
│   ├── admin.py         # Admin dashboard, statistics
│   ├── ai_reports.py    # AI report generation and download
│   └── files.py         # File upload/download
└── router.py            # Main router aggregation
```

**Key Patterns**:
- Dependency injection for database session (`Depends(get_db)`)
- Authentication via dependency (`Depends(get_current_user)`)
- Role-based access with custom dependencies (`get_current_admin_user`)
- Pydantic models for request/response validation
- HTTPException for error handling
- OpenAPI automatic documentation

**Example Endpoint Pattern**:
```
POST /api/v1/forms/
- Dependencies: AsyncSession, Admin User
- Request: FormCreate (Pydantic model)
- Response: FormResponse (201 Created)
- Error: 400 Bad Request, 401 Unauthorized, 403 Forbidden
```

#### 3.2.3 AI Service

```python
# qualia/backend/ai/services.py
import openai
import numpy as np
from typing import List, Dict, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import DBSCAN

class AIService:
    """AI-powered analysis and report generation"""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
        self.embedding_model = "text-embedding-3-small"

    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for text responses"""
        response = self.client.embeddings.create(
            model=self.embedding_model,
            input=texts
        )
        embeddings = np.array([item.embedding for item in response.data])
        return embeddings

    def find_duplicates(
        self,
        responses: List[Dict],
        threshold: float = 0.85
    ) -> List[Dict]:
        """
        Find and merge duplicate/similar responses
        """
        texts = [r['text'] for r in responses]
        embeddings = self.generate_embeddings(texts)

        # Calculate pairwise cosine similarity
        similarity_matrix = cosine_similarity(embeddings)

        # Group similar responses
        merged_groups = []
        processed = set()

        for i in range(len(responses)):
            if i in processed:
                continue

            similar_indices = np.where(similarity_matrix[i] >= threshold)[0]
            group = {
                'primary_response': responses[i],
                'merged_from': [responses[j] for j in similar_indices if j != i],
                'reviewer_count': len(similar_indices),
                'similarity_scores': similarity_matrix[i][similar_indices].tolist()
            }
            merged_groups.append(group)
            processed.update(similar_indices)

        return merged_groups

    def detect_conflicts(
        self,
        question: Question,
        responses: List[Dict]
    ) -> Optional[Dict]:
        """
        Detect conflicting opinions using LLM
        """
        prompt = f"""
        Question: {question.question_text}

        Responses from different reviewers:
        {chr(10).join([f"- {r['text']}" for r in responses])}

        Analyze if there are conflicting opinions. Return JSON:
        {{
            "has_conflict": boolean,
            "conflict_severity": "low" | "medium" | "high",
            "positive_opinions": [list of responses],
            "negative_opinions": [list of responses]
        }}
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        return json.loads(response.choices[0].message.content)

    def cluster_issues(
        self,
        issues: List[Dict],
        min_cluster_size: int = 2
    ) -> List[Dict]:
        """
        Cluster related issues using DBSCAN
        """
        texts = [issue['description'] for issue in issues]
        embeddings = self.generate_embeddings(texts)

        # DBSCAN clustering
        clustering = DBSCAN(eps=0.3, min_samples=min_cluster_size, metric='cosine')
        labels = clustering.fit_predict(embeddings)

        # Group issues by cluster
        clusters = {}
        for idx, label in enumerate(labels):
            if label == -1:  # Noise/outliers
                continue
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(issues[idx])

        # Generate cluster names using LLM
        cluster_results = []
        for label, cluster_issues in clusters.items():
            cluster_name = self._generate_cluster_name(cluster_issues)
            cluster_results.append({
                'cluster_name': cluster_name,
                'issues': cluster_issues,
                'issue_count': len(cluster_issues)
            })

        return cluster_results

    def _generate_cluster_name(self, issues: List[Dict]) -> str:
        """Generate a thematic name for a cluster"""
        issue_texts = "\n".join([f"- {issue['description']}" for issue in issues[:5]])

        prompt = f"""
        Given these related issues, generate a short thematic category name (2-4 words):
        {issue_texts}

        Return only the category name, nothing else.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10
        )

        return response.choices[0].message.content.strip()

    def generate_executive_summary(
        self,
        form_title: str,
        total_submissions: int,
        deduplicated_issues: List[Dict],
        clusters: List[Dict]
    ) -> str:
        """
        Generate executive summary for the QA report
        """
        prompt = f"""
        Generate a concise executive summary for this QA cycle:

        Form: {form_title}
        Total Submissions: {total_submissions}
        Total Unique Issues: {len(deduplicated_issues)}
        Issue Categories: {', '.join([c['cluster_name'] for c in clusters])}

        Write a 2-3 paragraph executive summary highlighting:
        1. Overall assessment
        2. Key findings and issue areas
        3. Priority recommendations

        Be professional and concise.
        """

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )

        return response.choices[0].message.content
```

#### 3.2.3 AI Report Generation Workflow

**Async Task** (Celery/ARQ):
1. **Initialize** - Set report status to 'processing'
2. **Collect Data** - Load all submitted responses with relationships
3. **Generate Embeddings** - Convert text responses to vectors (OpenAI)
4. **Find Duplicates** - Calculate cosine similarity, merge similar issues (threshold: 0.85)
5. **Detect Conflicts** - Use LLM to identify contradictory opinions
6. **Cluster Issues** - DBSCAN clustering on embeddings, generate cluster names
7. **Check Recurring Patterns** - Compare with issue_registry using vector search
8. **Generate Summary** - LLM-powered executive summary and recommendations
9. **Calculate Metrics** - Count issues by severity
10. **Export Reports** - Generate PDF and DOCX files
11. **Update Status** - Mark as 'completed' or 'failed'

**Estimated Processing Time**: 1-2 minutes for 50 submissions

**AI Costs**: ~$0.10-$0.50 per report (depends on submission count and text length)

---

## 4. Conditional Logic Engine

### 4.1 Conditional Logic Schema

```json
{
  "show_if": {
    "type": "all" | "any",  // all = AND, any = OR
    "conditions": [
      {
        "question_id": "uuid",
        "operator": "equals" | "not_equals" | "contains" | "greater_than" | "less_than",
        "value": "expected_value"
      }
    ]
  }
}
```

### 4.2 Conditional Logic Evaluator

```typescript
// src/utils/conditionalLogic.ts
interface Condition {
  question_id: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

interface ConditionalLogic {
  show_if: {
    type: 'all' | 'any';
    conditions: Condition[];
  };
}

export const evaluateCondition = (
  condition: Condition,
  answers: Record<string, any>
): boolean => {
  const answer = answers[condition.question_id];

  if (answer === undefined || answer === null) return false;

  switch (condition.operator) {
    case 'equals':
      return answer === condition.value;

    case 'not_equals':
      return answer !== condition.value;

    case 'contains':
      if (Array.isArray(answer)) {
        return answer.includes(condition.value);
      }
      return String(answer).includes(String(condition.value));

    case 'greater_than':
      return Number(answer) > Number(condition.value);

    case 'less_than':
      return Number(answer) < Number(condition.value);

    default:
      return false;
  }
};

export const evaluateConditionalLogic = (
  logic: ConditionalLogic | null,
  answers: Record<string, any>
): boolean => {
  if (!logic || !logic.show_if) return true; // No conditions = always show

  const { type, conditions } = logic.show_if;

  if (type === 'all') {
    return conditions.every(cond => evaluateCondition(cond, answers));
  } else {
    return conditions.some(cond => evaluateCondition(cond, answers));
  }
};
```

---

## 5. Export Service

### 5.1 Excel Export

```python
# qualia/backend/exports/services.py
import openpyxl
from openpyxl.styles import Font, PatternFill
from io import BytesIO

class ExportService:
    @staticmethod
    def export_to_excel(form_cycle: FormCycle) -> BytesIO:
        """
        Export form responses to Excel
        """
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Responses"

        # Get all submissions
        submissions = Submission.objects.filter(
            form_cycle=form_cycle,
            status='submitted'
        ).select_related('submitted_by').prefetch_related('answers__question')

        # Get all questions
        questions = form_cycle.questions.order_by('display_order')

        # Header row
        headers = ['Reviewer', 'Email', 'Submitted At', 'Status']
        headers.extend([q.question_text[:50] for q in questions])

        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")

        # Data rows
        for row_num, submission in enumerate(submissions, 2):
            ws.cell(row=row_num, column=1, value=submission.submitted_by.full_name)
            ws.cell(row=row_num, column=2, value=submission.submitted_by.email)
            ws.cell(row=row_num, column=3, value=submission.submitted_at)
            ws.cell(row=row_num, column=4, value=submission.status)

            # Answers
            answers_dict = {
                str(ans.question_id): ans
                for ans in submission.answers.all()
            }

            for col_num, question in enumerate(questions, 5):
                answer = answers_dict.get(str(question.id))
                if answer:
                    value = get_answer_display_value(answer)
                    ws.cell(row=row_num, column=col_num, value=value)

        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                if cell.value:
                    max_length = max(max_length, len(str(cell.value)))
            ws.column_dimensions[column_letter].width = min(max_length + 2, 50)

        # Save to BytesIO
        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer

def get_answer_display_value(answer: SubmissionAnswer) -> str:
    """Convert answer object to display string"""
    if answer.text_answer:
        return answer.text_answer
    elif answer.rating_answer is not None:
        return str(answer.rating_answer)
    elif answer.choice_answers:
        return ', '.join(answer.choice_answers)
    elif answer.boolean_answer is not None:
        return 'Yes' if answer.boolean_answer else 'No'
    elif answer.file_ids:
        return f"{len(answer.file_ids)} file(s) attached"
    return ''
```

### 5.2 PDF Report Export

```python
# qualia/backend/exports/pdf_service.py
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table
from io import BytesIO

class PDFReportService:
    @staticmethod
    def generate_ai_report_pdf(report: AIReport) -> BytesIO:
        """
        Generate PDF version of AI report
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor='#1976D2'
        )
        story.append(Paragraph(f"QA Report: {report.form_cycle.title}", title_style))
        story.append(Spacer(1, 0.3*inch))

        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Paragraph(report.executive_summary, styles['BodyText']))
        story.append(Spacer(1, 0.2*inch))

        # Issue Overview
        story.append(Paragraph("Issue Overview", styles['Heading2']))
        overview_data = [
            ['Metric', 'Count'],
            ['Total Unique Issues', str(report.total_issues)],
            ['Critical Issues', str(report.critical_issues)],
            ['Minor Issues', str(report.minor_issues)]
        ]
        overview_table = Table(overview_data)
        story.append(overview_table)
        story.append(Spacer(1, 0.2*inch))

        # Deduplicated Issues
        story.append(Paragraph("Deduplicated Issues", styles['Heading2']))
        for idx, issue in enumerate(report.deduplicated_issues, 1):
            story.append(Paragraph(
                f"{idx}. {issue['title']} (Reported by {issue['reviewer_count']} reviewers)",
                styles['Heading3']
            ))
            story.append(Paragraph(issue['description'], styles['BodyText']))
            story.append(Spacer(1, 0.1*inch))

        story.append(PageBreak())

        # Issue Clusters
        story.append(Paragraph("Issue Clusters", styles['Heading2']))
        for cluster in report.issue_clusters:
            story.append(Paragraph(cluster['cluster_name'], styles['Heading3']))
            story.append(Paragraph(
                f"{cluster['issue_count']} issues in this category",
                styles['BodyText']
            ))
            story.append(Spacer(1, 0.1*inch))

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

```python
# tests/test_ai_service.py
import pytest
from qualia.backend.ai.services import AIService

@pytest.fixture
def ai_service():
    return AIService(api_key="test_key", model="gpt-4o")

def test_find_duplicates(ai_service):
    responses = [
        {'text': 'The dashboard has alignment issues'},
        {'text': 'Dashboard alignment problems found'},
        {'text': 'Login page is slow'}
    ]

    duplicates = ai_service.find_duplicates(responses, threshold=0.85)

    # First two should be merged
    assert len(duplicates) == 2
    assert duplicates[0]['reviewer_count'] == 2

def test_cluster_issues(ai_service):
    issues = [
        {'description': 'Slow page load'},
        {'description': 'Performance degradation'},
        {'description': 'Button misaligned'},
        {'description': 'UI spacing issues'}
    ]

    clusters = ai_service.cluster_issues(issues, min_cluster_size=2)

    # Should have 2 clusters: Performance and UI
    assert len(clusters) == 2
```

```typescript
// src/utils/__tests__/conditionalLogic.test.ts
import { evaluateCondition, evaluateConditionalLogic } from '../conditionalLogic';

describe('Conditional Logic', () => {
  test('evaluates equals condition', () => {
    const condition = {
      question_id: 'q1',
      operator: 'equals' as const,
      value: 'Yes'
    };
    const answers = { q1: 'Yes' };

    expect(evaluateCondition(condition, answers)).toBe(true);
  });

  test('evaluates complex AND logic', () => {
    const logic = {
      show_if: {
        type: 'all' as const,
        conditions: [
          { question_id: 'q1', operator: 'equals' as const, value: 'Yes' },
          { question_id: 'q2', operator: 'greater_than' as const, value: 3 }
        ]
      }
    };
    const answers = { q1: 'Yes', q2: 5 };

    expect(evaluateConditionalLogic(logic, answers)).toBe(true);
  });
});
```

### 6.2 Integration Tests

```python
# tests/test_submission_flow.py
from django.test import TestCase
from qualia.backend.forms.models import FormCycle, Question
from qualia.backend.submissions.services import SubmissionService

class SubmissionFlowTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            role='reviewer'
        )
        self.form = FormCycle.objects.create(
            title='Test Form',
            created_by=self.user,
            status='active'
        )
        self.question = Question.objects.create(
            form_cycle=self.form,
            question_type='short_text',
            question_text='Test question',
            is_required=True
        )

    def test_submission_creation(self):
        submission = SubmissionService.get_or_create_submission(
            self.form.id,
            self.user
        )

        assert submission.status == 'in_progress'
        assert submission.submitted_by == self.user

    def test_auto_save(self):
        submission = SubmissionService.get_or_create_submission(
            self.form.id,
            self.user
        )

        answers = [
            {
                'question_id': str(self.question.id),
                'text_answer': 'Test answer'
            }
        ]

        updated = SubmissionService.save_answers(str(submission.id), answers)

        assert updated.answers.count() == 1
        assert updated.last_saved_at is not None

    def test_validation_on_submit(self):
        submission = SubmissionService.get_or_create_submission(
            self.form.id,
            self.user
        )

        # Try to submit without required answer
        with self.assertRaises(ValidationError):
            SubmissionService.submit_submission(str(submission.id), [])
```

---

## 7. Deployment Configuration

### 7.1 Docker Compose (Development)

**Services**:
- **db**: PostgreSQL 15 with pgvector extension
- **redis**: Redis 7 for caching and Celery broker
- **backend**: FastAPI with Uvicorn (hot reload)
- **celery**: Celery worker for async tasks
- **frontend**: React with Vite dev server

**Key Configuration**:
```yaml
backend:
  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  environment:
    - DATABASE_URL=postgresql+asyncpg://qualia:password@db:5432/qualia_dev
    - REDIS_URL=redis://redis:6379/0
    - OPENAI_API_KEY=${OPENAI_API_KEY}

celery:
  command: celery -A app.worker worker -l info

frontend:
  command: npm run dev
  environment:
    - VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Note**: Full docker-compose.yml file will include all services with proper networking and volumes

### 7.2 Environment Variables

**Backend (.env)**:
```bash
# Database (asyncpg driver for async SQLAlchemy)
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/qualia

# Redis
REDIS_URL=redis://localhost:6379/0

# FastAPI
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# JWT
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Services
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o

# File Storage (S3 or MinIO)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=qualia-files
AWS_S3_REGION_NAME=us-east-1

# Email (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_FROM=noreply@qualia.app
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-password
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 8. Implementation Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Database schema setup
- [ ] Authentication system (JWT)
- [ ] User management (CRUD)
- [ ] Basic project structure (frontend + backend)
- [ ] Development environment (Docker)

### Phase 2: Form Builder (Weeks 4-6)
- [ ] Form cycle management
- [ ] Section management
- [ ] Question CRUD operations
- [ ] Question type implementations
- [ ] Drag-and-drop reordering
- [ ] Form preview
- [ ] Conditional logic engine

### Phase 3: Submission Module (Weeks 7-9)
- [ ] Form assignment system
- [ ] Submission creation and retrieval
- [ ] Auto-save functionality
- [ ] Question rendering components
- [ ] File upload integration
- [ ] Form validation
- [ ] Submission history

### Phase 4: Admin Dashboard (Weeks 10-11)
- [ ] Response spreadsheet view
- [ ] Individual response viewer
- [ ] Filtering and search
- [ ] Statistics calculator
- [ ] Chart visualizations
- [ ] Excel/CSV export

### Phase 5: AI Engine (Weeks 12-15)
- [ ] OpenAI integration
- [ ] Embedding generation
- [ ] Duplicate detection algorithm
- [ ] Conflict detection
- [ ] Issue clustering
- [ ] Report generation
- [ ] PDF/DOCX export
- [ ] Recurring pattern tracking

### Phase 6: Polish & Testing (Weeks 16-17)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] Performance optimization
- [ ] Security audit
- [ ] UI/UX refinements

### Phase 7: Deployment (Week 18)
- [ ] Production environment setup
- [ ] CI/CD pipeline
- [ ] Monitoring and logging
- [ ] Documentation
- [ ] User training materials

---

**Document Version**: 1.0
**Last Updated**: 2026-05-20
**Author**: Engineering Team
