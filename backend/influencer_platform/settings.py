import os
import platform
from pathlib import Path
from decouple import config
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Detect OS for platform-specific defaults
IS_MACOS = platform.system() == 'Darwin'
IS_WINDOWS = platform.system() == 'Windows'
IS_RENDER = 'RENDER' in os.environ

# Define a persistent data directory
# On Render: use /data (persistent disk mount)
# On macOS/Windows (local dev): use BASE_DIR / 'data'
if IS_RENDER:
    _default_data_dir = '/data'
else:
    _default_data_dir = str(BASE_DIR / 'data')
DATA_DIR = Path(config('DATA_DIR', default=_default_data_dir))

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)



# Application definition

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
]

LOCAL_APPS = [
    'accounts',
    'collaborations',
    'payments',
    'social_media',
    'support',
    'landing',
    'ecommerce',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'influencer_platform.urls'

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

WSGI_APPLICATION = 'influencer_platform.wsgi.application'


# Database Configuration — PostgreSQL only
DATABASE_URL = config('DATABASE_URL', default='')

# SSL is required for remote databases (Render, RDS) but not for local dev
_db_ssl_require = not (IS_MACOS or IS_WINDOWS) or IS_RENDER
_db_sslmode_default = 'require' if IS_RENDER else 'disable' if (IS_MACOS or IS_WINDOWS) else 'prefer'

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=_db_ssl_require,
        )
    }
else:
    _db_sslmode = config('DB_SSLMODE', default=_db_sslmode_default)
    _db_options = {}
    if _db_sslmode != 'disable':
        _db_options['sslmode'] = _db_sslmode

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': config('DB_NAME', default='postgres'),
            'USER': config('DB_USER', default='postgres'),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default='localhost'),
            'PORT': config('DB_PORT', default='5432'),
        }
    }
    if _db_options:
        DATABASES['default']['OPTIONS'] = _db_options


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

MEDIA_URL = '/media/'
# Ensure Media is stored on the Persistent Disk
MEDIA_ROOT = DATA_DIR / 'media'
# Create media root if it doesn't exist (safe for read-only build environments)
try:
    if not os.path.exists(MEDIA_ROOT):
        os.makedirs(MEDIA_ROOT, exist_ok=True)
except OSError:
    # This might happen during Render build time when /data is not mounted
    pass

# Razorpay
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='rzp_test_XXXXXXXXXXXXXXXX')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='XXXXXXXXXXXXXXXXXXXXXXXX')
RAZORPAY_WEBHOOK_SECRET = config('RAZORPAY_WEBHOOK_SECRET', default='')

# Shiprocket
SHIPROCKET_EMAIL = config('SHIPROCKET_EMAIL', default='')
SHIPROCKET_PASSWORD = config('SHIPROCKET_PASSWORD', default='')

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
    ),
    'DEFAULT_PAGINATION_CLASS': 'influencer_platform.pagination.FlexiblePageNumberPagination',
    'PAGE_SIZE': 10,
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings
CORS_ALLOW_ALL_ORIGINS = True  # For dev, restrict in production
CORS_ALLOW_CREDENTIALS = True

# Stripe Settings
STRIPE_PUBLIC_KEY = config('STRIPE_PUBLISHABLE_KEY', default='')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='')

# Celery Settings
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Email Settings
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='')

# Final Production Security & Host validation
ALLOWED_HOSTS = [
    'collabo-backend-uyi4.onrender.com',
    'collabo-backend-y2de.onrender.com',
    '.onrender.com',
    'localhost',
    '127.0.0.1',
    'testserver',
    '13.206.88.135',
    'ec2-13-206-88-135.ap-south-1.compute.amazonaws.com',
    'collabo.co.in',
    'www.collabo.co.in',
]

# CORS & CSRF Configuration
CORS_ALLOW_ALL_ORIGINS = True  # Fallback for flexibility
CORS_ALLOWED_ORIGINS = [
    "https://collabo-4q46.vercel.app",
    "https://collabo-backend-uyi4.onrender.com",
    "http://localhost:3000",
    "http://collabo.co.in",
    "https://collabo.co.in",
    "http://www.collabo.co.in",
    "https://www.collabo.co.in",
    "http://13.206.88.135",
]
CSRF_TRUSTED_ORIGINS = [
    "https://collabo-4q46.vercel.app",
    "https://*.onrender.com",
    "http://collabo.co.in",
    "https://collabo.co.in",
    "http://www.collabo.co.in",
    "https://www.collabo.co.in",
    "http://13.206.88.135",
]


# Security settings for production
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
else:
    # Always set proxy header on Render environments
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')




# Frontend URL for password reset links, etc.
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')

# Gupshup WhatsApp / SMS
GUPSHUP_API_KEY = config('GUPSHUP_API_KEY', default='')
GUPSHUP_SOURCE_NUMBER = config('GUPSHUP_SOURCE_NUMBER', default='')
GUPSHUP_APP_NAME = config('GUPSHUP_APP_NAME', default='')