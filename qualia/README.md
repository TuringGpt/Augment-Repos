# Qualia — QA Intelligence Platform

Qualia is an internal web application that replaces our Google Forms-based QA workflow. It provides a form builder for admins, a submission interface for reviewers, an admin dashboard to view and analyse responses, and an AI engine that aggregates all reviewer submissions into a single consolidated, deduplicated QA report.

---

## User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access. Manages questions and form cycles, views all submissions, generates AI reports, and configures deadlines. |
| **Reviewer** | Standard access. Fills out QA forms and views their own submission history. |
| **Viewer** | Read-only. Can browse aggregated reports and trend dashboards, but cannot submit forms. |

---

## Modules

### Module 1 — Form Builder

Admins have full control over every question that appears in the QA form.

**Question Types**
- Short text and long text (paragraph)
- Single choice (radio) and multiple choice (checkbox)
- Dropdown selector
- Rating scale — 1 to 5 or 1 to 10
- Yes / No / N/A toggle
- File attachment

**Capabilities**
- Add, edit, delete, and reorder questions via drag-and-drop
- Organise questions into labelled sections (e.g. UI Testing, Performance, API Tests)
- Mark questions as required or optional
- Conditional logic — show or hide questions based on answers to earlier questions
- Question versioning so historical responses remain valid when questions are edited
- Live form preview before publishing

---

### Module 2 — Form Submission

The submission experience for reviewers — clean, section-by-section, and designed to be fast.

- Dashboard showing all open and pending forms assigned to the reviewer
- Auto-save every 30 seconds
- Ability to edit a submission before the admin-set deadline
- Full submission history — reviewers can browse all their past responses
- File and screenshot attachments on any answer
- Status indicators: Not Started, In Progress, Submitted

---

### Module 3 — Admin Response Dashboard

Everything admins need to view, filter, analyse, and export all responses.

- Spreadsheet view with one row per reviewer and one column per question, sortable and filterable
- Individual response view — click any submission to see the full form response for that reviewer
- Per-question statistics including response distribution charts, averages, and word frequency analysis
- Search and filter by reviewer, date, submission status, or keyword
- Export responses to Excel, CSV, and more

---

### Module 4 — AI Aggregation Engine

Once reviewers submit their forms, the AI engine processes every response and generates one intelligent, consolidated QA report automatically — no manual compilation required.

**Holistic Feedback Aggregation**
All individual reviewer responses are compiled into a single master feedback document. The engine collects every point raised, removes duplicates, preserves the count of reviewers who flagged each issue, and produces a clean aggregated report.

**Automatic Duplicate Merging**
The AI uses semantic similarity to detect near-duplicate issues raised by different reviewers and merges them automatically. Each merged group shows the best-phrased version of the issue, the number of reviewers who reported it, and all original phrasings in a collapsed view.

**Conflicting Opinion Detection**
The AI flags responses where reviewers hold directly contradictory opinions on the same test point and surfaces them side by side in the report, along with a conflict severity score.

**Semantic Issue Clustering**
Related feedback points — even across different questions — are automatically grouped into thematic clusters such as Performance Issues, UI/UX Inconsistencies, and Positive Signals. Each cluster includes a generated title, issue count, severity summary, and reviewer consensus score.

**Consolidated Report Generation**
The engine produces a full QA report available in-app, as a downloadable PDF, or as a Word document. The report includes:
- AI-written executive summary
- Total issue counts with critical vs. minor breakdown
- All deduplicated issues grouped by cluster
- Conflicting opinions section
- Per-reviewer contribution breakdown
- Recommendations section

**Recurring Bug Pattern Tracking**
Across multiple QA sessions, Qualia tracks which bugs keep reappearing. It shows warnings when an issue has appeared in multiple past cycles, maintains a persistent issue registry where issues can be flagged as Known, Resolved, or Regressed, and provides a bug recurrence heatmap by module or section.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Python (Django or equivalent) |
| **Frontend** | React.js or Next.js |