# 🔧 DAMXscorp — Gestion de garage

Application web de gestion de garage (clients, véhicules, planification, stock).
**Backend** : Django + Django REST Framework
**Frontend** : React
**Infrastructure** : Docker + Docker Compose

---

## 🚀 Lancer le projet (première fois)

### 1. Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- [Git](https://git-scm.com/) installé

### 2. Cloner le projet
```bash
git clone <url-du-repo>
cd damxscorp
```

### 3. Créer le fichier `.env`
```bash
# Copie le fichier exemple
cp .env.example .env
```
Ouvre ensuite le fichier `.env` et remplace la valeur de `DJANGO_SECRET_KEY` par une vraie clé.
Tu peux en générer une ici : https://djecrety.ir/

### 4. Lancer les containers
```bash
docker-compose up --build
```
La première fois, Docker va télécharger les images et installer les dépendances — ça peut prendre quelques minutes.

### 5. Appliquer les migrations Django (première fois uniquement)
Dans un **deuxième terminal**, pendant que les containers tournent :
```bash
docker-compose exec backend python manage.py migrate
```

### 6. Accéder à l'application
| Service | URL |
|---|---|
| Frontend React | http://localhost:3000 |
| API Django | http://localhost:8000/api/ |
| Admin Django | http://localhost:8000/admin/ |

---

## ▶️ Relancer le projet (fois suivantes)

```bash
docker-compose up
```

## ⏹️ Arrêter le projet

```bash
docker-compose down
```

---

## 🗂️ Structure du projet

```
damxscorp/
├── backend/          → Django (API REST)
│   ├── clients/      → App clients
│   ├── vehicules/    → App véhicules
│   ├── planning/     → App interventions / RDV
│   ├── stock/        → App stock
│   └── referentiels/ → App référentiels (types, marques…)
├── frontend/         → React
│   └── src/
│       ├── pages/    → Pages de l'application
│       ├── components/ → Composants réutilisables
│       └── services/ → Appels API (axios)
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.yml
└── .env.example      → ⚠️ Copier en .env et remplir avant de lancer
```

---

## ❓ Problèmes fréquents

**Django refuse de démarrer** → Vérifie que ton fichier `.env` existe et que `DJANGO_SECRET_KEY` est remplie.

**Port déjà utilisé** → Un autre programme utilise le port 3000 ou 8000. Arrête-le ou change le port dans `docker-compose.yml`.

**Modifications non prises en compte** → Le hot-reload est activé, mais si ça bloque : `docker-compose restart`.
