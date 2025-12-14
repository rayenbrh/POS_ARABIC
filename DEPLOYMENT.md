# Guide de Déploiement - Single Service

Cette application est configurée pour un déploiement monolithique où le backend Express sert à la fois l'API et le frontend React.

## Structure

```
backend/
 ├─ server.js          # Serve Express (API + Frontend)
 ├─ public/            # Fichiers statiques du frontend (générés par build)
 ├─ routes/            # Routes API
 ├─ controllers/       # Contrôleurs API
 ├─ models/            # Modèles MongoDB
 └─ package.json

frontend/
 ├─ src/               # Code source React
 └─ vite.config.js     # Config Vite (build vers backend/public)
```

## Build et Déploiement

### 1. Build du Frontend

```bash
cd frontend
npm install
npm run build
```

Le build génère les fichiers dans `backend/public/`

### 2. Démarrage du Serveur

```bash
cd backend
npm install
npm start
```

Le serveur écoute sur `process.env.PORT` (par défaut 5000)

### 3. Déploiement sur Hostinger EasyPanel

1. **Créer un seul service** dans EasyPanel
2. **Point d'entrée**: `backend/server.js`
3. **Commande de démarrage**: `npm start`
4. **Port**: Configurer selon votre environnement (EasyPanel le gère automatiquement)
5. **Variables d'environnement**:
   - `PORT` (optionnel, par défaut 5000)
   - `MONGODB_URI` (requis)
   - `JWT_SECRET` (requis)
   - Autres variables selon votre configuration

### 4. Structure des Routes

- **API**: `/api/*` → Routes Express
- **Frontend**: `/*` → React App (index.html)
- **Assets**: `/assets/*` → Fichiers statiques (JS, CSS, images)

### 5. React Router

Le serveur retourne `index.html` pour toutes les routes non-API, permettant à React Router de gérer la navigation côté client.

## Commandes Utiles

```bash
# Build frontend uniquement
cd frontend && npm run build

# Build depuis backend (build frontend puis démarre)
cd backend && npm run build:frontend

# Démarrage en développement (backend uniquement)
cd backend && npm run dev

# Démarrage en production
cd backend && npm start
```

## Notes Importantes

- ✅ Pas de CORS nécessaire (même origine)
- ✅ Pas de proxy nécessaire
- ✅ Pas de sous-domaine API
- ✅ Un seul service à déployer
- ✅ Build du frontend avant déploiement

