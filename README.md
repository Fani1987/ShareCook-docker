# 🍲 ShareCook - Application de Partage de Recettes

**ShareCook** est une application web complète permettant aux utilisateurs de partager, consulter et gérer des recettes de cuisine.

Ce projet a été réalisé dans le cadre du Titre Professionnel **Développeur Web et Web Mobile (DWWM)**. Il démontre la mise en œuvre d'une architecture **CRUD complète**, sécurisée et conteneurisée.

---

## 🚀 Fonctionnalités Clés

### 🔒 Sécurité & Authentification

* **Inscription & Connexion** sécurisées.
* **Hachage des mots de passe** avec `bcrypt`.
* **Authentification par Token JWT** (JSON Web Token).
* **Auth Guards** : Protection des routes Front-end (redirection si non connecté) et Back-end (middleware de vérification).

### 🍳 Gestion des Recettes (CRUD)

* **Create** : Ajout de recettes avec titre, instructions et image.
* **Read** : Affichage dynamique de la liste et vue détaillée d'une recette.
* **Update** : Modification d'une recette (réservé au propriétaire).
* **Delete** : Suppression d'une recette (réservé au propriétaire).

### 📱 Interface Utilisateur

Approche **Mobile First**.
Design **Responsive** (adapté mobile, tablette, desktop).
Menu de navigation dynamique ("Burger menu" sur mobile).

---

## 🛠️ Stack Technique

Ce projet repose sur une architecture moderne et découplée :

* **Front-End :** HTML5, CSS3, JavaScript (ES6+, API Fetch).
* **Back-End :** Node.js, Express.js.
* **Base de Données :** MySQL 8.0 (Relationnel, moteur InnoDB).
* **DevOps & Infrastructure :**
  * **Docker & Docker Compose** : Orchestration des services.
  * **Nginx** : Serveur web et Reverse Proxy (gestion du routage `/api`).

---

## 🏗️ Architecture Docker

L'application est divisée en 3 conteneurs interconnectés :

1. **`db` (MySQL)** : Stocke les utilisateurs et les recettes. Les données sont persistantes via un volume Docker.
2. **`api` (Node.js)** : Le serveur Back-end. Il n'est pas exposé directement ; il communique uniquement au sein du réseau Docker.
3. **`web` (Nginx)** : Le point d'entrée unique. Il sert les fichiers statiques (Front-end) sur le port `80` et redirige les requêtes commençant par `/api` vers le conteneur Node.js.

---

## ⚙️ Installation et Démarrage

### Prérequis

* [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et lancé.
* [Git](https://git-scm.com/) installé.

### 1. Cloner le projet

bash
git clone [https://github.com/votre-pseudo/sharecook-docker.git](https://github.com/votre-pseudo/ShareCook-docker.git)
cd sharecook-docker

### 2.Configuration (.env)

Le projet utilise un fichier .env pour gérer les ports et les secrets. Un fichier .env est déjà configuré par défaut, mais vous pouvez le modifier selon vos besoins :

Ports exposés sur votre machine hôte
PORT_WEB=8081   # Accès au site
PORT_DB=3308    # Accès BDD direct (optionnel)

Configuration interne
DB_ROOT_PASSWORD=root
DB_NAME=sharecook_db
JWT_SECRET=votre_secret_jwt_complexe

### 3.Lancer l'application

Une seule commande suffit pour construire les images, lancer la base de données, l'API et le serveur web :

Bash
docker-compose up --build
(La première construction peut prendre quelques minutes.)

---

## 🖥️ Utilisation

Une fois les conteneurs lancés :

 .Accéder au site : Ouvrez [http://localhost:8081](http://localhost:8081) dans votre navigateur.

 .Base de données : Les tables sont créées automatiquement au premier lancement via le fichier init.sql.

---

## 🌳 Workflow Git

Ce projet suit un flux de travail professionnel :

 .main : Branche de production stable. Ne contient que du code testé et fonctionnel.

 .develop : Branche d'intégration pour le développement des nouvelles fonctionnalités.

Pour contribuer :

 1.Créez une branche depuis develop (ex: git checkout -b feature/ajout-commentaires).

 2.Développez et testez.

 3.Fusionnez sur develop.

---

👤 Auteur
Estefania Cachada Capitão

Projet réalisé pour le Titre Professionnel Développeur Web et Web Mobile.
