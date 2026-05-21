# Qualia Documentation

This directory contains comprehensive design documentation for the Qualia QA Intelligence Platform.

## 📚 Documentation Index

### 1. [Getting Started Guide](./GETTING_STARTED.md) ⭐ **START HERE**
**Purpose**: Quick start guide for developers building Qualia from scratch

**Contents**:
- Prerequisites and setup
- Docker quick start
- Local development setup
- Project structure overview
- Development workflow
- Common commands and troubleshooting

**Target Audience**: All developers joining the project

---

### 2. [High-Level Design (HLD)](./HLD.md)
**Purpose**: System architecture and design overview

**Contents**:
- System overview and objectives
- Architecture patterns and component diagrams
- Technology stack: FastAPI, SQLAlchemy, React, OpenAI
- Core module descriptions (Form Builder, Submission, Dashboard, AI Engine)
- Data flow diagrams
- Security and authentication strategy
- Scalability considerations
- Performance requirements
- Deployment architecture

**Target Audience**: Technical leads, architects, stakeholders

---

### 3. [Low-Level Design (LLD)](./LLD.md)
**Purpose**: Detailed implementation specifications

**Contents**:
- **Database Schema**: 11 tables with fields, relationships, and indexes
- **API Specifications**: 40+ FastAPI endpoints with request/response examples
- **Backend Architecture**: Service layer, dependency injection, async patterns
- **Frontend Components**: React component hierarchy
- **AI Workflow**: Embedding generation, deduplication, clustering
- **Deployment**: Docker Compose, environment variables
- **Implementation Phases**: 18-week development timeline

**Target Audience**: Developers, QA engineers, DevOps

---

### 4. [API Quick Reference](./API_QUICK_REFERENCE.md)
**Purpose**: Quick lookup for common API endpoints

**Contents**:
- Authentication endpoints
- Form management endpoints
- Submission endpoints
- Admin dashboard endpoints
- AI report endpoints
- Response codes and permissions matrix

**Target Audience**: Frontend and backend developers

---

## 🚀 Quick Start Guide

### For Developers (New to Project)

1. **[Start Here: Getting Started Guide](./GETTING_STARTED.md)** 📖
2. **Read the HLD** for system architecture overview
3. **Review the LLD** for your specific module (forms/submissions/AI)
4. **Use API Quick Reference** while developing

### For Project Managers

1. **Review the HLD** (Sections 1, 3, 11) for system capabilities and scope
2. **Check Implementation Phases** in LLD for the 18-week timeline
3. **Reference Success Metrics** in HLD for project goals

### For Stakeholders

1. **Read System Overview** in HLD (Section 1)
2. **Review Core Modules** in HLD (Section 3) - the 4 main features
3. **Check Future Enhancements** in HLD (Section 11) for roadmap

---

## 📋 Project Status

- **Status**: Ready to Start Development ✅
- **Current Phase**: Design Complete - Ready for Implementation
- **Next Phase**: Foundation (Weeks 1-3) - Setup FastAPI + Database
- **Technology**: FastAPI + React + PostgreSQL + OpenAI
- **Last Updated**: 2026-05-20

**This is a brand new application being built from scratch - no migration needed!**

---

## 🔑 Key Features

### Module 1: Form Builder
Dynamic QA form creation with 8 question types, conditional logic, drag-and-drop, and live preview

### Module 2: Form Submission  
Clean submission interface with auto-save, file uploads, and deadline tracking

### Module 3: Admin Dashboard
Comprehensive response analytics with spreadsheet view, statistics, charts, and export capabilities

### Module 4: AI Aggregation Engine
Intelligent report generation with:
- Automatic duplicate detection using semantic similarity
- Conflicting opinion identification
- Thematic issue clustering
- Recurring pattern tracking across QA cycles
- Executive summary generation

---

## 🛠 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Material-UI, Zustand |
| **Backend** | FastAPI 0.110+, SQLAlchemy 2.0 (async), PostgreSQL 15+ |
| **Validation** | Pydantic v2 |
| **AI/ML** | OpenAI GPT-4, text-embedding-3-small, pgvector |
| **Cache** | Redis 7+ |
| **Task Queue** | Celery / ARQ |
| **File Storage** | AWS S3 / MinIO |
| **DevOps** | Docker, Docker Compose, Nginx, Uvicorn |

---

## 📊 Database Overview

**Core Tables**:
- `users` - User management with role-based access
- `form_cycles` - QA form definitions
- `sections` - Form section organization
- `questions` - Dynamic questions with config and conditional logic
- `submissions` - Reviewer submissions
- `submission_answers` - Polymorphic answer storage
- `ai_reports` - Generated AI reports with structured data
- `issue_registry` - Recurring pattern tracking with vector embeddings
- `files` - File attachment management
- `audit_logs` - System activity tracking

**Total Tables**: 11 core tables + migrations

---

## 🔐 Security Features

- JWT-based authentication with token refresh
- Role-based access control (Admin, Reviewer, Viewer)
- Resource-level permissions
- Encryption at rest and in transit (TLS 1.3)
- Pre-signed URLs for file access
- Input validation and SQL injection prevention
- XSS protection with CSP headers
- Audit logging for all critical actions

---

## 📈 Performance Targets

| Metric | Target |
|--------|--------|
| Page Load Time | < 2 seconds |
| API Response Time | < 500ms (95th percentile) |
| AI Report Generation | < 2 minutes (50 submissions) |
| Concurrent Users | 100+ |
| Database Queries | < 100ms (90th percentile) |
| System Uptime | 99.5% |

---

## 🗓 Implementation Timeline

**Total Duration**: 18 weeks

1. **Foundation** (Weeks 1-3): Database, auth, basic structure
2. **Form Builder** (Weeks 4-6): Full form creation capabilities
3. **Submission** (Weeks 7-9): Reviewer interface and auto-save
4. **Dashboard** (Weeks 10-11): Admin analytics and export
5. **AI Engine** (Weeks 12-15): AI-powered report generation
6. **Testing** (Weeks 16-17): Comprehensive testing and optimization
7. **Deployment** (Week 18): Production launch and monitoring

---

## 📞 Contact & Support

For questions about this documentation or the Qualia project:

- **Design Questions**: Contact the Architecture Team
- **Implementation Issues**: Contact the Development Team
- **Project Timeline**: Contact the Project Manager

---

## 📝 Document Maintenance

These documents should be updated when:
- Architecture decisions change
- New features are added
- API contracts are modified
- Database schema changes
- Technology stack updates

**Version Control**: All design documents are version controlled in Git

---

**Documentation Version**: 1.0  
**Created**: 2026-05-20  
**Last Updated**: 2026-05-20
