# Qualia - High-Level Design (HLD)

> **Historical document.** This design describes the previous three-role, AI-platform proposal. The active requirements are in [Product Scope](./PRODUCT_SCOPE.md); use it instead for all new work.

## 1. System Overview

### 1.1 Purpose
Qualia is an internal QA Intelligence Platform designed to replace Google Forms-based QA workflows. It provides a comprehensive solution for creating QA forms, collecting reviewer submissions, analyzing responses, and generating AI-powered consolidated reports.

### 1.2 Key Objectives
- Enable admins to build dynamic, configurable QA forms
- Provide reviewers with an intuitive submission interface
- Aggregate and analyze QA responses intelligently
- Generate consolidated reports using AI-driven deduplication and clustering
- Track recurring issues across QA cycles

### 1.3 User Roles
| Role | Permissions |
|------|-------------|
| **Admin** | Full access: form management, view all submissions, generate AI reports, manage users |
| **Reviewer** | Submit QA forms, view own submission history |
| **Viewer** | Read-only access to aggregated reports and dashboards |

---

## 2. System Architecture

### 2.1 Architecture Pattern
**Microservices-Oriented Monolith** (Modular Monolith)
- Single deployment unit with modular boundaries
- Clear separation of concerns between modules
- Allows future extraction to microservices if needed

### 2.2 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Admin Portal │  │   Reviewer   │  │    Viewer    │          │
│  │   (React)    │  │   Portal     │  │   Portal     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   API Gateway     │
                    │    (FastAPI)      │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┴─────────────────────────────────────┐
│                       Backend Services                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │Form Builder │  │ Submission  │  │  Response   │               │
│  │   Module    │  │   Module    │  │  Dashboard  │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │
│  │AI Engine    │  │   Auth &    │  │   Export    │               │
│  │  Module     │  │   Users     │  │   Service   │               │
│  └─────────────┘  └─────────────┘  └─────────────┘               │
└────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌──────────▼──────────┐
    │   PostgreSQL DB   │         │   AI Service        │
    │  (Primary Store)  │         │  (OpenAI/Claude)    │
    └───────────────────┘         └─────────────────────┘
              │
    ┌─────────▼─────────┐         ┌─────────────────────┐
    │   Redis Cache     │         │   S3/File Storage   │
    │  (Sessions, Jobs) │         │  (Attachments)      │
    └───────────────────┘         └─────────────────────┘
```

### 2.3 Technology Stack

#### Frontend
- **Framework**: React.js 18+ with TypeScript
- **State Management**: Zustand / Redux Toolkit
- **UI Library**: Material-UI (MUI) or Ant Design
- **Form Handling**: React Hook Form + Zod validation
- **Drag & Drop**: react-beautiful-dnd or @dnd-kit
- **Charts**: Recharts or Chart.js
- **Rich Text**: Quill or TipTap

#### Backend
- **Framework**: FastAPI 0.110+ (async Python framework)
- **ORM**: SQLAlchemy 2.0+ with async support
- **Database**: PostgreSQL 15+
- **Migrations**: Alembic
- **Cache**: Redis 7+
- **Task Queue**: Celery with Redis broker (or ARQ for async tasks)
- **API Documentation**: FastAPI built-in (Swagger/ReDoc)
- **Authentication**: JWT (python-jose + passlib)
- **Validation**: Pydantic v2

#### AI & ML
- **LLM Integration**: OpenAI GPT-4 / Anthropic Claude
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Search**: pgvector (PostgreSQL extension) or Pinecone
- **Similarity Detection**: Cosine similarity on embeddings

#### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **ASGI Server**: Uvicorn (production: Gunicorn + Uvicorn workers)
- **Reverse Proxy**: Nginx
- **File Storage**: AWS S3 or MinIO (local development)
- **Monitoring**: Prometheus + Grafana (future)
- **Logging**: Structured logging with Loguru or structlog

---

## 3. Core Modules

### 3.1 Module 1: Form Builder

**Purpose**: Enable admins to create and manage dynamic QA forms

**Key Features**:
- CRUD operations for questions
- Multiple question types (text, radio, checkbox, dropdown, rating, yes/no, file)
- Drag-and-drop question reordering
- Section organization
- Conditional logic (show/hide based on answers)
- Question versioning
- Live form preview

**Key Components**:
- Question Manager
- Section Manager
- Conditional Logic Engine
- Form Version Controller
- Form Preview Renderer

### 3.2 Module 2: Form Submission

**Purpose**: Provide reviewers with a clean submission interface

**Key Features**:
- Form assignment and access control
- Auto-save every 30 seconds
- Draft management
- File/screenshot attachments
- Submission deadline tracking
- Edit before deadline
- Submission history

**Key Components**:
- Submission Controller
- Auto-save Service
- File Upload Handler
- Deadline Manager
- Submission History Tracker

### 3.3 Module 3: Admin Response Dashboard

**Purpose**: Analytics and response management for admins

**Key Features**:
- Spreadsheet view (rows = reviewers, columns = questions)
- Individual response viewer
- Filtering and sorting
- Per-question statistics
- Response distribution charts
- Word frequency analysis
- Keyword search
- Export to Excel/CSV

**Key Components**:
- Response Aggregator
- Statistics Calculator
- Chart Generator
- Export Service (Excel, CSV)
- Search and Filter Engine

### 3.4 Module 4: AI Aggregation Engine

**Purpose**: Intelligent consolidation of all reviewer responses

**Key Features**:
- Holistic feedback aggregation
- Automatic duplicate merging using semantic similarity
- Conflicting opinion detection
- Semantic issue clustering (Performance, UI/UX, etc.)
- Consolidated report generation (in-app, PDF, Word)
- Recurring bug pattern tracking across cycles

**Key Components**:
- Embedding Generator (converts responses to vectors)
- Similarity Matcher (finds duplicate issues)
- Conflict Detector (identifies contradictory opinions)
- Clustering Engine (groups related feedback)
- Report Generator (produces final QA reports)
- Pattern Tracker (tracks issues across cycles)

**AI Workflow**:
1. **Data Collection**: Gather all submissions for a QA cycle
2. **Preprocessing**: Clean and normalize text responses
3. **Embedding Generation**: Convert responses to vector embeddings
4. **Duplicate Detection**: Calculate cosine similarity, merge duplicates (threshold: 0.85+)
5. **Conflict Detection**: Identify contradictory opinions on same test points
6. **Clustering**: Group related issues using clustering algorithms (K-Means/DBSCAN)
7. **Report Generation**: Use LLM to generate executive summary and recommendations
8. **Pattern Analysis**: Compare with historical data to identify recurring issues

---

## 4. Data Flow

### 4.1 Form Creation Flow
```
Admin → Create Form → Add Questions → Configure Sections → Set Conditional Logic
→ Version & Save → Publish → Assign to Reviewers
```

### 4.2 Submission Flow
```
Reviewer → View Assigned Forms → Fill Out Form (auto-save) → Upload Attachments
→ Submit → System Validates → Store in DB → Notify Admin
```

### 4.3 AI Report Generation Flow
```
Admin Triggers Report → System Collects All Submissions → Extract Text Responses
→ Generate Embeddings → Detect Duplicates → Merge Similar Issues
→ Detect Conflicts → Cluster Issues → Generate Report with LLM
→ Format Output (PDF/Word) → Store & Present to Admin
```

---

## 5. Security & Authentication

### 5.1 Authentication
- **Method**: JWT-based authentication
- **Token Lifecycle**: Access token (30 min), Refresh token (7 days)
- **Password Policy**: Min 8 chars, complexity requirements
- **2FA**: Optional (TOTP-based, future enhancement)

### 5.2 Authorization
- **Role-Based Access Control (RBAC)**
  - Admin: All permissions
  - Reviewer: Submit forms, view own submissions
  - Viewer: Read-only access to reports
- **Resource-Level Permissions**: Users can only access assigned forms

### 5.3 Data Security
- **Encryption at Rest**: Database encryption (PostgreSQL)
- **Encryption in Transit**: HTTPS/TLS 1.3
- **File Security**: Pre-signed URLs for S3 attachments (expiry: 1 hour)
- **Input Validation**: Pydantic models for automatic validation
- **SQL Injection Prevention**: ORM-based queries (SQLAlchemy)
- **XSS Prevention**: Content Security Policy headers
- **CORS**: FastAPI CORS middleware with strict origin control

---

## 6. Scalability Considerations

### 6.1 Database Optimization
- Indexing on frequently queried fields (user_id, form_id, submission_date)
- Partitioning for large tables (submissions by date)
- Read replicas for analytics queries
- Connection pooling (pgBouncer)

### 6.2 Caching Strategy
- **Redis Cache Layers**:
  - L1: User sessions and permissions (TTL: 1 hour)
  - L2: Form definitions (TTL: until update)
  - L3: Aggregated statistics (TTL: 5 minutes)
- **CDN**: Static assets and generated reports

### 6.3 Async Processing
- **Celery Tasks**:
  - AI report generation (long-running)
  - Export operations (Excel/CSV generation)
  - Email notifications
  - Embedding generation
- **Task Priority**: High (notifications) > Medium (exports) > Low (analytics)

### 6.4 Load Handling
- **Horizontal Scaling**: Stateless API servers behind load balancer
- **Database**: Master-slave replication
- **File Storage**: S3 with CloudFront CDN
- **Rate Limiting**: 100 requests/min per user

---

## 7. Integration Points

### 7.1 External Services
| Service | Purpose | Provider |
|---------|---------|----------|
| AI/LLM | Report generation, clustering | OpenAI / Anthropic |
| Email | Notifications, alerts | SendGrid / AWS SES |
| File Storage | Attachment storage | AWS S3 / MinIO |
| Analytics | Usage tracking | Mixpanel / Amplitude (optional) |

### 7.2 APIs
- **RESTful API**: Primary interface for frontend
- **WebSocket**: Real-time auto-save and notifications (future)
- **Webhooks**: External integrations (Slack, JIRA) (future)

---

## 8. Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Page Load Time | < 2 seconds | Initial load |
| API Response Time | < 500ms | 95th percentile |
| Form Auto-save | 30 seconds | Background operation |
| Concurrent Users | 100+ | Peak capacity |
| Report Generation | < 2 minutes | For 50 submissions |
| File Upload | < 10MB | Per file limit |
| Database Queries | < 100ms | 90th percentile |

---

## 9. Monitoring & Observability

### 9.1 Metrics to Track
- API response times and error rates
- Database query performance
- Cache hit rates
- Celery task queue depth and processing times
- AI service latency and costs
- User activity patterns

### 9.2 Logging Strategy
- **Application Logs**: Structured JSON logging (INFO, WARNING, ERROR)
- **Access Logs**: Nginx access logs
- **Audit Logs**: User actions (form creation, submission, deletions)
- **Error Tracking**: Sentry for exception monitoring

### 9.3 Alerting
- API error rate > 5%
- Database connection pool exhaustion
- Celery task queue > 1000 pending tasks
- Disk usage > 80%
- Response time degradation

---

## 10. Deployment Architecture

### 10.1 Environment Strategy
- **Development**: Local Docker Compose setup
- **Staging**: Kubernetes cluster (mirrors production)
- **Production**: Kubernetes with auto-scaling

### 10.2 Infrastructure Components
```
┌─────────────────────────────────────────────────┐
│           Load Balancer (AWS ALB)               │
└─────────────────┬───────────────────────────────┘
                  │
    ┌─────────────┴─────────────┐
    │                           │
┌───▼────┐                  ┌───▼────┐
│ Web    │                  │ Web    │
│ Server │                  │ Server │
│ (Nginx)│                  │ (Nginx)│
└───┬────┘                  └───┬────┘
    │                           │
┌───▼────────┐          ┌───────▼────┐
│ FastAPI    │          │ FastAPI    │
│ (Uvicorn)  │          │ (Uvicorn)  │
└───┬────────┘          └───┬────────┘
    │                       │
    └───────────┬───────────┘
                │
    ┌───────────▼────────────┐
    │   PostgreSQL Primary   │
    │   (RDS Multi-AZ)       │
    └────────────────────────┘
```

### 10.3 Backup Strategy
- **Database**: Automated daily backups, 30-day retention
- **Files**: S3 versioning enabled
- **Configuration**: Infrastructure as Code (Terraform/CloudFormation)

---

## 11. Future Enhancements

### Phase 2 Features
- Real-time collaboration on forms
- Advanced analytics and trend analysis
- Integration with JIRA for bug tracking
- Slack/Teams notifications
- Multi-language support

### Phase 3 Features
- Mobile app for reviewers
- Offline form submission
- Advanced AI features (sentiment analysis, priority scoring)
- Custom report templates
- API for third-party integrations

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Time to create QA form | < 15 minutes |
| Time to submit QA form | < 20 minutes |
| Time to generate AI report | < 2 minutes |
| User satisfaction score | > 4/5 |
| System uptime | 99.5% |
| Bug detection improvement | 30% increase vs. Google Forms |

---

**Document Version**: 1.0
**Last Updated**: 2026-05-20
**Author**: System Design Team
