# Qualia - Getting Started Guide

> **Historical document.** Its Docker, PostgreSQL, Redis, Celery, and AI setup instructions are not part of the active Form Cycle scope. Refer to [Product Scope](./PRODUCT_SCOPE.md) before changing the development environment.

Quick start guide for developers building the Qualia QA Intelligence Platform from scratch.

## Prerequisites

- **Python**: 3.8+
- **Node.js**: 18+
- **PostgreSQL**: 15+ (with pgvector extension)
- **Redis**: 7+
- **Docker & Docker Compose**: Latest versions

---

## 🚀 Quick Start with Docker

### 1. Clone and Setup

```bash
# Navigate to qualia directory
cd qualia

# Copy environment files
cp .env.example .env
cp frontend/.env.example frontend/.env

# Edit .env files with your API keys and secrets
```

### 2. Start All Services

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Celery)
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### 3. Initialize Database

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create first admin user
docker-compose exec backend python scripts/create_admin.py
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **API Base**: http://localhost:8000/api/v1

---

## 💻 Local Development Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
alembic upgrade head

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Celery Worker (for AI tasks)

```bash
cd backend
celery -A app.worker worker --loglevel=info
```

---

## 📁 Project Structure

### Backend (FastAPI)

```
backend/
├── app/
│   ├── main.py              # FastAPI app initialization
│   ├── core/
│   │   ├── config.py        # Settings (Pydantic)
│   │   ├── database.py      # Async SQLAlchemy
│   │   ├── auth.py          # JWT authentication
│   │   └── security.py      # Password hashing
│   ├── models/              # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── form.py
│   │   ├── submission.py
│   │   └── ai_report.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── user.py
│   │   ├── form.py
│   │   └── submission.py
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/   # Route handlers
│   │       │   ├── auth.py
│   │       │   ├── forms.py
│   │       │   ├── submissions.py
│   │       │   ├── admin.py
│   │       │   └── ai_reports.py
│   │       └── router.py
│   ├── services/            # Business logic
│   │   ├── form_service.py
│   │   ├── submission_service.py
│   │   ├── ai_service.py
│   │   └── export_service.py
│   └── worker.py            # Celery worker
├── alembic/                 # Database migrations
├── requirements.txt
└── Dockerfile
```

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── features/
│   │   ├── admin/
│   │   │   ├── form-builder/
│   │   │   ├── response-dashboard/
│   │   │   └── ai-reports/
│   │   └── reviewer/
│   │       ├── submission/
│   │       └── history/
│   ├── components/          # Shared components
│   ├── services/            # API client
│   ├── store/               # Zustand stores
│   ├── hooks/               # Custom hooks
│   └── utils/
├── package.json
└── Dockerfile
```

---

## 🔑 Key Technologies

### Backend Stack
- **FastAPI** - Modern, fast web framework
- **SQLAlchemy 2.0** - Async ORM
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation
- **python-jose** - JWT tokens
- **passlib** - Password hashing
- **Celery** - Async task queue
- **OpenAI SDK** - AI integration

### Frontend Stack
- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Axios** - HTTP client

---

## 🛠 Development Workflow

### 1. Create a Feature Branch
```bash
git checkout -b feature/form-builder
```

### 2. Backend Development
```bash
# Create new model
touch app/models/new_model.py

# Create migration
alembic revision --autogenerate -m "Add new model"

# Apply migration
alembic upgrade head

# Create Pydantic schema
touch app/schemas/new_model.py

# Create service
touch app/services/new_service.py

# Create API endpoint
# Edit app/api/v1/endpoints/new_endpoint.py

# Test API
http://localhost:8000/docs
```

### 3. Frontend Development
```bash
# Create new feature
mkdir -p src/features/new-feature

# Create components, hooks, services
# Follow feature-based structure

# Test in browser
http://localhost:3000
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
pytest tests/test_forms.py -v
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

---

## 📚 Documentation

- **API Documentation**: Auto-generated at `/docs` and `/redoc`
- **HLD**: High-level system design in `docs/HLD.md`
- **LLD**: Detailed implementation specs in `docs/LLD.md`
- **API Reference**: Quick reference in `docs/API_QUICK_REFERENCE.md`

---

## ⚡ Common Commands

```bash
# Backend
uvicorn app.main:app --reload              # Dev server
alembic revision --autogenerate -m "msg"   # Create migration
alembic upgrade head                        # Apply migrations
celery -A app.worker worker -l info         # Start worker

# Frontend
npm run dev                                 # Dev server
npm run build                              # Production build
npm run lint                               # Lint code

# Docker
docker-compose up -d                       # Start all services
docker-compose logs -f backend             # View logs
docker-compose exec backend bash           # Shell into container
docker-compose down                        # Stop all services
```

---

## 🐛 Troubleshooting

**Database connection error**:
- Check PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL in .env file

**pgvector extension missing**:
```sql
-- Connect to PostgreSQL
psql -U qualia -d qualia_dev
CREATE EXTENSION IF NOT EXISTS vector;
```

**Frontend can't connect to API**:
- Verify VITE_API_BASE_URL in frontend/.env
- Check CORS settings in backend/app/main.py

**Celery tasks not running**:
- Check Redis is running: `docker-compose ps`
- Verify REDIS_URL in .env file

---

## 🎯 Next Steps

1. ✅ Review HLD and LLD documentation
2. 📦 Set up development environment
3. 🗄️ Create database models and migrations
4. 🔐 Implement authentication system
5. 📝 Build form builder module (Phase 2)
6. ✍️ Build submission module (Phase 3)
7. 📊 Build admin dashboard (Phase 4)
8. 🤖 Integrate AI engine (Phase 5)

Refer to the **Implementation Phases** section in LLD.md for the complete 18-week development roadmap.

---

**Need Help?** Check the documentation in `/docs` or ask the team!

**Last Updated**: 2026-05-20
