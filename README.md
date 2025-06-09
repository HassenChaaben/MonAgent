# Assistant IA avec Interface Web

Un assistant IA interactif construit avec FastAPI et React, offrant une interface utilisateur moderne et des capacités de traitement de langage naturel avancées.

## Technologies Utilisées

- **Backend**: Python/FastAPI
- **Frontend**: React
- **Base de données**: SQLite
- **Communication en temps réel**: Server-Sent Events (SSE)

## Prérequis

- Python 3.9+
- Node.js 16+
- npm ou yarn

## Installation

1. Cloner le repository :

```bash
git clone [URL_DU_REPO]
cd HassenV1
```

2. Installation du backend :

```bash
pip install -r requirements.txt
```

3. Installation du frontend :

```bash
cd frontend
npm install
cd ..
```

## Configuration

1. Copier le fichier de configuration exemple :

```bash
cp config/config.example.toml config/config.toml
```

2. Modifier le fichier `config/config.toml` selon vos besoins.

## Démarrage

### En développement

Utiliser le script start.bat (Windows) :

```bash
start.bat
```

Ou démarrer manuellement :

```bash
# Terminal 1 - Backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm start
```

### En production

Suivre les instructions dans le guide de déploiement.

## Structure du Projet

- `app/` - Code source du backend
- `frontend/` - Code source du frontend
- `config/` - Fichiers de configuration
- `data/` - Base de données et fichiers de données
- `logs/` - Logs d'application

## Fonctionnalités

- Interface utilisateur interactive
- Traitement de langage naturel
- Gestion de projets
- Communication en temps réel
- Historique des conversations
- Gestion des fichiers

## Contribution

Les contributions sont les bienvenues ! Voir `CONTRIBUTING.md` pour les directives.

## Licence

[Votre type de licence]
