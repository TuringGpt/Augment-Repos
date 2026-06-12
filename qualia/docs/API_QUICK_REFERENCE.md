# Qualia API Quick Reference

Quick reference guide for the most commonly used API endpoints.

## Base URL
```
http://localhost:8000/api/v1/
```

## Authentication
All endpoints except `/auth/*` require JWT authentication.

**Header**:
```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication

### Login
```http
POST /auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Register
```http
POST /auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "reviewer"
}
```

### Refresh Token
```http
POST /auth/refresh/
Content-Type: application/json

{
  "refresh_token": "<refresh_token>"
}
```

---

## 📝 Forms (Admin)

### List Forms
```http
GET /forms/?status=active&page=1&page_size=20
```

### Create Form
```http
POST /forms/
Content-Type: application/json

{
  "title": "Q2 2026 QA Cycle",
  "description": "Quarterly QA review",
  "submission_deadline": "2026-06-30T23:59:59Z"
}
```

### Get Form Details
```http
GET /forms/{form_id}/
```

### Add Section
```http
POST /forms/{form_id}/sections/
Content-Type: application/json

{
  "title": "UI Testing",
  "description": "UI-related questions",
  "display_order": 1
}
```

### Add Question
```http
POST /forms/{form_id}/sections/{section_id}/questions/
Content-Type: application/json

{
  "question_type": "single_choice",
  "question_text": "Did you find any UI issues?",
  "is_required": true,
  "display_order": 1,
  "config": {
    "options": ["Yes", "No", "Not Tested"]
  }
}
```

### Publish Form
```http
POST /forms/{form_id}/publish/
```

Response:
```json
{
  "id": "uuid",
  "status": "active",
  "is_published": true
}
```

### Assign to Reviewers
```http
POST /forms/{form_id}/assign/
Content-Type: application/json

{
  "user_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## ✍️ Submissions (Reviewer)

### Get My Assignments
```http
GET /submissions/my-assignments/
```

### Get Submission
```http
GET /submissions/{submission_id}/
```

### Auto-Save Answers
```http
POST /submissions/{submission_id}/save/
Content-Type: application/json

{
  "answers": [
    {
      "question_id": "uuid",
      "text_answer": "My answer text..."
    },
    {
      "question_id": "uuid2",
      "rating_answer": 4
    }
  ]
}
```

### Submit Form
```http
POST /forms/{form_cycle_id}/submit
Authorization: Bearer <reviewer_access_token>
```

### Get Submission History
```http
GET /submissions/my-history/?page=1
```

---

## 📊 Admin Dashboard

### Get All Responses (Spreadsheet View)
```http
GET /admin/forms/{form_id}/responses/?status=submitted
```

### Get Individual Response
```http
GET /admin/forms/{form_id}/responses/{submission_id}/
```

### Get Statistics
```http
GET /admin/forms/{form_id}/statistics/
```

### Export to Excel
```http
GET /admin/forms/{form_id}/export/?format=excel
```

### Export to CSV
```http
GET /admin/forms/{form_id}/export/?format=csv
```

---

## 🤖 AI Reports

### Generate Report
```http
POST /ai-reports/generate/
Content-Type: application/json

{
  "form_cycle_id": "uuid",
  "options": {
    "include_conflicts": true,
    "include_clustering": true,
    "similarity_threshold": 0.85
  }
}
```

### Check Report Status
```http
GET /ai-reports/{report_id}/status/
```

### Get Report
```http
GET /ai-reports/{report_id}/
```

### Download PDF
```http
GET /ai-reports/{report_id}/download/pdf/
```

### Download DOCX
```http
GET /ai-reports/{report_id}/download/docx/
```

---

## 📁 File Upload

### Upload File
```http
POST /files/upload/
Content-Type: multipart/form-data

file: <binary>
submission_id: "uuid" (optional)
question_id: "uuid" (optional)
```

---

## 📋 Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 202 | Accepted (async operation started) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🔍 Common Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `page` | Page number | `?page=2` |
| `page_size` | Items per page (max 100) | `?page_size=50` |
| `search` | Search query | `?search=performance` |
| `status` | Filter by status | `?status=submitted` |
| `sort` | Sort field | `?sort=-created_at` |

---

## 🎯 Question Types

| Type | Description | Answer Field |
|------|-------------|--------------|
| `short_text` | Single line text | `text_answer` |
| `long_text` | Multi-line text | `text_answer` |
| `single_choice` | Radio buttons | `choice_answers` (array with 1 item) |
| `multiple_choice` | Checkboxes | `choice_answers` (array) |
| `dropdown` | Select dropdown | `choice_answers` (array with 1 item) |
| `rating` | Rating scale | `rating_answer` (integer) |
| `yes_no_na` | Toggle | `boolean_answer` (true/false/null) |
| `file_upload` | File attachment | `file_ids` (array of UUIDs) |

---

## 🛡️ Permission Matrix

| Endpoint | Admin | Reviewer | Viewer |
|----------|-------|----------|--------|
| Create/Edit Forms | ✅ | ❌ | ❌ |
| View Forms | ✅ | ✅ (assigned) | ✅ |
| Submit Forms | ✅ | ✅ | ❌ |
| View All Responses | ✅ | ❌ | ❌ |
| View Own Responses | ✅ | ✅ | ❌ |
| Generate AI Reports | ✅ | ❌ | ❌ |
| View AI Reports | ✅ | ❌ | ✅ |
| Export Data | ✅ | ❌ | ❌ |

---

**Last Updated**: 2026-05-20
