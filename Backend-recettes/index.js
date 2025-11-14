require('dotenv').config(); // Charge les .env en premier
const express = require('express');
const cors = require('cors');

// Importer nos routes
const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const { getDb } = require('./config/mongodb'); // Importer la connexion MongoDB
const commentsRoutes = require('./routes/comments');

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
// 1. Autoriser les requêtes cross-origine (de votre front-end)
app.use(cors());
// 2. Permettre à Express de lire le JSON du corps des requêtes
app.use(express.json());

// --- Routes ---
// On dit à Express d'utiliser nos routes d'authentification
// Toutes les routes dans 'authRoutes' seront préfixées par /api/auth
app.use('/api/auth', authRoutes);

// Routes des recettes (publiques ET protégées)
app.use('/api/recipes', recipeRoutes);
app.use('/api/comments', commentsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.send('API Recettes Fonctionnelle !');
});

// Fonction de démarrage asynchrone
async function startServer() {
    try {
        await getDb(); // On attend la connexion à MongoDB
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur le port ${PORT}`);
            // c'est Nginx qui gère
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

// Lancer le démarrage
startServer();