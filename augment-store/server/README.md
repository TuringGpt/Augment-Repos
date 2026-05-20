# Augment Store Server

A Django REST Framework-based backend API for the Augment Store e-commerce application.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Available Commands](#available-commands)

## Overview

This is a Django REST Framework API server that provides endpoints for the Augment Store e-commerce platform. It includes:

- **Authentication**: JWT-based authentication with token refresh
- **User Management**: Custom user model with account management
- **API**: RESTful API with comprehensive documentation
- **Database**: PostgreSQL for robust data management
- **API Documentation**: Swagger/OpenAPI documentation

### Tech Stack

- **Framework**: Django 5.2.7
- **API**: Django REST Framework 3.16.1
- **Authentication**: djangorestframework-simplejwt
- **Documentation**: drf-spectacular
- **Database**: PostgreSQL
- **Environment**: python-dotenv

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **pip** - Python package manager (comes with Python)
- **PostgreSQL 12+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git** - [Download Git](https://git-scm.com/downloads)

### Verify Installation

```bash
python --version
pip --version
psql --version
```

## Installation

### 1. Navigate to the Server Directory

```bash
cd augment-store/server
```

### 2. Create a Virtual Environment

It's recommended to use a virtual environment to isolate project dependencies.

**On macOS/Linux:**
```bash
python3 -m venv env
source env/bin/activate
```

**On Windows:**
```bash
python -m venv env
env\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will install all required packages including:
- Django
- Django REST Framework
- djangorestframework-simplejwt (JWT authentication)
- drf-spectacular (API documentation)
- python-dotenv (environment variables)
- And other dependencies

## Configuration

### 1. Set Up PostgreSQL Database

Before configuring the Django application, you need to create a PostgreSQL database:

**On macOS/Linux:**
```bash
# Start PostgreSQL service (if not already running)
brew services start postgresql

# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE augment_store;
CREATE USER postgres WITH PASSWORD 'postgres';
ALTER ROLE postgres SET client_encoding TO 'utf8';
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET default_transaction_deferrable TO on;
ALTER ROLE postgres SET default_transaction_isolation TO 'read committed';
ALTER ROLE postgres SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE augment_store TO postgres;
\q
```

**On Windows:**
```bash
# Open pgAdmin (installed with PostgreSQL)
# Or use psql command line:
psql -U postgres

# Then run the same SQL commands as above
```

### 2. Create Environment File

Copy the example environment file and create your own `.env` file:

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit the `.env` file and set the following variables:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True

# Token Expiration (in minutes)
ACCESS_TOKEN_EXPIRATION_TIME_IN_MINUTES=30
REFRESH_TOKEN_EXPIRATION_TIME_IN_MINUTES=60

# Database Configuration
DATABASE_NAME=augment_store
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
```

**Important**:
- Generate a secure `SECRET_KEY` for production. You can use Django's built-in utility:
  ```bash
  python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
  ```
- Set `DEBUG=False` in production
- Update database credentials to match your PostgreSQL setup
- Ensure PostgreSQL is running before running migrations

### 4. Install PostgreSQL Python Driver

The PostgreSQL driver is included in requirements.txt, but ensure it's installed:

```bash
pip install psycopg2
```

If you encounter issues, try:
```bash
pip install psycopg2-binary
```

### 5. Database Setup

Run migrations to set up the database:

```bash
python manage.py migrate
```

This will apply all migrations to your PostgreSQL database.

### 6. Create a Superuser (Admin Account)

Create an admin account to access the Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to enter:
- Username
- Email
- Password

## Running the Server

### Start the Development Server

```bash
python manage.py runserver
```

The server will start at `http://localhost:8000`

### Access the Application

- **API Root**: http://localhost:8000/api/v1/
- **Swagger Documentation**: http://localhost:8000/
- **Django Admin**: http://localhost:8000/admin/

### Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

## API Documentation

### Swagger UI

The API documentation is automatically generated and available at:

```
http://localhost:8000/
```

This provides an interactive interface to:
- View all available endpoints
- See request/response schemas
- Test API endpoints directly

### API Endpoints

The API is organized under `/api/v1/` namespace. Available endpoints include:

- **Authentication**: User login, token refresh, registration
- **Accounts**: User profile management
- **API**: Main application endpoints

## Project Structure

```
augment-store/server/
├── manage.py                 # Django management script
├── requirements.txt          # Python dependencies
├── .env.example             # Environment variables template
│
├── core/                    # Django project settings
│   ├── settings.py          # Project settings (PostgreSQL config)
│   ├── urls.py              # URL routing
│   ├── wsgi.py              # WSGI configuration
│   └── asgi.py              # ASGI configuration
│
├── accounts/                # User account management app
│   ├── models.py            # Custom User model
│   ├── views.py             # Account views
│   ├── serializers.py       # Data serializers
│   └── migrations/          # Database migrations
│
├── authentication/          # Authentication app
│   ├── views.py             # Auth endpoints
│   ├── serializers.py       # Auth serializers
│   ├── urls.py              # Auth URLs
│   └── migrations/          # Database migrations
│
└── api/                     # Main API app
    ├── models.py            # API models
    ├── views.py             # API views
    ├── serializers.py       # API serializers
    ├── urls.py              # API URLs
    └── migrations/          # Database migrations
```



## Development Workflow

### 1. Activate Virtual Environment

Ensure you activate the virtual environment before making any changes:

If use are using venv
```bash
source env/bin/activate
```

Else use the appropriate command for your virtual environment manager

### 2. Start the Server

```bash
python manage.py runserver
```

### 3. Access Admin Panel

Navigate to `http://localhost:8000/admin/` and log in with your superuser credentials.

### 4. Make Changes

Edit your models, views, or serializers as needed.

### 5. Create Migrations (if you modified models)

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Test Your Changes

```bash
python manage.py test
```

## Connecting to Frontend

The frontend (React application) should be configured to connect to this backend:

1. **Frontend API URL**: `http://localhost:8000/api/v1/`
2. **Update `.env` in `augment-store/client/`**:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1
   ```

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, run the server on a different port:

```bash
python manage.py runserver 8001
```

### PostgreSQL Connection Issues

If you get a PostgreSQL connection error:

1. **Verify PostgreSQL is running:**
   ```bash
   # macOS
   brew services list | grep postgresql

   # Linux
   sudo systemctl status postgresql
   ```

2. **Check database credentials in `.env`:**
   - Ensure `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, and `DATABASE_PASSWORD` are correct
   - Default PostgreSQL port is `5432`

3. **Verify the database exists:**
   ```bash
   psql -U postgres -h localhost -c "SELECT datname FROM pg_database WHERE datname='augment_store';"
   ```

4. **Recreate the database if needed:**
   ```bash
   psql -U postgres
   DROP DATABASE augment_store;
   CREATE DATABASE augment_store;
   GRANT ALL PRIVILEGES ON DATABASE augment_store TO postgres;
   \q
   ```

### Database Migration Issues

If you encounter migration errors:

```bash
# Check migration status
python manage.py showmigrations

# Rollback migrations (if needed)
python manage.py migrate app_name zero

# Run migrations again
python manage.py migrate
```

### Virtual Environment Issues

If you have issues with the virtual environment:

```bash
# Deactivate current environment
deactivate

# Remove the env folder
rm -rf env

# Create a new virtual environment
python3 -m venv env
source env/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## Next Steps

1. ✅ Set up the server following this guide
2. 📝 Review the API documentation at `http://localhost:8000/`
3. 🔧 Customize models and endpoints as needed
4. 🧪 Write tests for your endpoints
5. 🚀 Deploy to production when ready

## Support

For issues or questions:
- Check the [Django Documentation](https://docs.djangoproject.com/)
- Review [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- Check the project's GitHub issues

## License

This project is part of the Augment Store e-commerce platform.

