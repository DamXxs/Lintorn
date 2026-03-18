import os
from pathlib import Path
from dotenv import load_dotenv

# =============================================================================
# CHARGEMENT DU FICHIER .env
# =============================================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# Cherche le .env dans le dossier backend/
dotenv_path = BASE_DIR / '.env'
load_dotenv(dotenv_path)

# =============================================================================
# SÉCURITÉ — SECRET_KEY OBLIGATOIRE
# Si la clé est absente du .env, Django plante immédiatement avec un message clair.
# =============================================================================
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')

if not SECRET_KEY:
    raise ValueError(
        "\n\n❌ ERREUR : DJANGO_SECRET_KEY est manquante !\n"
        "   → Crée le fichier damxscorp/backend/.env\n"
        "   → Ajoute cette ligne : DJANGO_SECRET_KEY=une-clé-secrète-longue\n"
        "   → Tu peux générer une clé avec : python -c \"import secrets; print(secrets.token_urlsafe(50))\"\n"
    )

# =============================================================================
# MODE DEBUG
# En dev local, on laisse True. Penser à False en production.
# =============================================================================
DEBUG = True

# =============================================================================
# HÔTES AUTORISÉS (localhost uniquement)
# =============================================================================
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'backend', '0.0.0.0']

# =============================================================================
# APPLICATIONS INSTALLÉES
# =============================================================================
INSTALLED_APPS = [

    # Tes apps métier
    'clients',
    'fournisseurs',
    'planning',
    'referentiels',
    'stock',
    'vehicules',

    # Apps tierces
    'corsheaders',
    'rest_framework',

    # Apps Django par défaut
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

# =============================================================================
# MIDDLEWARE
# L'ordre est important — CorsMiddleware doit être EN PREMIER
# =============================================================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # ← CORS en 1er obligatoire
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',       # ← CSRF actif
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'damxscorp.urls'

# =============================================================================
# TEMPLATES
# =============================================================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
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

# =============================================================================
# BASE DE DONNÉES — SQLite en développement
# =============================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# =============================================================================
# INTERNATIONALISATION
# =============================================================================
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Europe/Paris'
USE_I18N = True
USE_TZ = True

# =============================================================================
# FICHIERS STATIQUES
# =============================================================================
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# =============================================================================
# CORS — Autorise uniquement le frontend React en dev local
# =============================================================================
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

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

# =============================================================================
# CSRF — Origines de confiance pour les requêtes cross-origin
# =============================================================================
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

CSRF_COOKIE_SECURE = False       # False en HTTP local (True uniquement en HTTPS)
SESSION_COOKIE_SECURE = False    # Idem
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'