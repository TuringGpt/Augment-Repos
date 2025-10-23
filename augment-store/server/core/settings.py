from pathlib import Path
from dotenv import dotenv_values
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

config = {
    **os.environ,  # load evironment system variables
    **dotenv_values(".env"),  # override loaded environment variables with .env file
}


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config.get('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config.get('DEBUG', False) == 'True'

APP_DOMAIN = config.get('APP_DOMAIN', 'http://localhost:8000')
ALLOWED_HOSTS = [
    config.get('ALLOWED_HOSTS', '*')
]

# CORS settings - Allow all localhost origins
CORS_ALLOW_ALL_ORIGINS = config.get('CORS_ALLOW_ALL_ORIGINS', False) == 'True'
CORS_ALLOWED_ORIGINS = [config.get('FRONTEDN_URL', 'http://localhost:3000')]

# Allow all localhost origins using regex pattern
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]

# CORS headers configuration
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
     "corsheaders",
    'rest_framework',
    'drf_spectacular',
    'rest_framework_simplejwt',
    'api',
    'accounts',
    'authentication',
    'mptt',
    'products',
    'storage',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
     "corsheaders.middleware.CorsMiddleware",
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'
AUTH_USER_MODEL = "accounts.User"

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql_psycopg2",
        "NAME": config.get("DATABASE_NAME"),
        "USER": config.get("DATABASE_USER"),
        "PASSWORD": config.get("DATABASE_PASSWORD"),
        "HOST": config.get("DATABASE_HOST"),
        "PORT": config.get("DATABASE_PORT"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'UserAttributeSimilarityValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'MinimumLengthValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'CommonPasswordValidator'
        ),
    },
    {
        'NAME': (
            'django.contrib.auth.password_validation.'
            'NumericPasswordValidator'
        ),
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

FILE_MAX_SIZE = int(config.get("FILE_MAX_SIZE", 1024))
FILE_UPLOAD_STORAGE = config.get("FILE_UPLOAD_STORAGE", "local")  # local | s3

IS_USING_LOCAL_STORAGE = FILE_UPLOAD_STORAGE == "local"



if FILE_UPLOAD_STORAGE == "local":
    MEDIA_ROOT_NAME = "media"
    MEDIA_ROOT = os.path.join(BASE_DIR, MEDIA_ROOT_NAME)
    MEDIA_URL = f"/{MEDIA_ROOT_NAME}/"
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    PUBLIC_MEDIA_LOCATION = "media/public/"
    PRIVATE_MEDIA_LOCATION = "media/private/"
    STATIC_LOCATION = "static/"

    AWS_ACCESS_KEY_ID = config.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = config.get("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = config.get("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = config.get("AWS_S3_REGION_NAME")
    AWS_S3_CUSTOM_DOMAIN = config.get("AWS_S3_CUSTOM_DOMAIN")

    
else:
    PUBLIC_MEDIA_LOCATION = "media/public/"
    PRIVATE_MEDIA_LOCATION = "media/private/"
    STATIC_LOCATION = "static/"

    AWS_ACCESS_KEY_ID = config.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = config.get("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = config.get("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = config.get("AWS_S3_REGION_NAME")
    AWS_S3_CUSTOM_DOMAIN = config.get("AWS_S3_CUSTOM_DOMAIN")
    AWS_S3_FILE_OVERWRITE = False
    AWS_DEFAULT_ACL = "public-read"
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    AWS_PRESIGNED_EXPIRY = int(config.get("AWS_PRESIGNED_EXPIRY", 10))
    FILE_MAX_SIZE = int(config.get("FILE_MAX_SIZE", 1024))


    STATIC_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{STATIC_LOCATION}"
    STATICFILES_STORAGE = "storage.storage_backends.StaticStorage"

    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{PUBLIC_MEDIA_LOCATION}"
    DEFAULT_FILE_STORAGE = "storage.storage_backends.PublicMediaStorage"
    PRIVATE_FILE_STORAGE = "storage.storage_backends.PrivateMediaStorage"

    FILE_UPLOAD_STORAGE = config.get("FILE_UPLOAD_STORAGE", "s3")
    AWS_PRESIGNED_EXPIRY = int(config.get("AWS_PRESIGNED_EXPIRY", 10))
    FILE_MAX_SIZE = int(config.get("FILE_MAX_SIZE", 1024))


# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


REST_FRAMEWORK = {
    # YOUR SETTINGS
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.NamespaceVersioning',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    "NON_FIELD_ERRORS_KEY": "details",
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Augment Store API',
    'DESCRIPTION': 'An E-Commerce API for Augment Store',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': r'/api/v[0-9]',
}