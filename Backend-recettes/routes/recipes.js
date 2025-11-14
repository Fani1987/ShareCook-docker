// Gestion du CRUD des recettes

const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Notre connexion BDD
const auth = require('../middleware/auth'); // Notre "gardien"
const { getCommentsCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

// --- ROUTES PUBLIQUES (Lecture seule) ---

/**
 * GET /api/recipes
 * Récupère toutes les recettes (pour la page d'accueil)
 */
router.get('/', async (req, res) => {
  try {
    // On sélectionne toutes les recettes ET le nom d'utilisateur de l'auteur
    const [recipes] = await db.query(
      "SELECT r.*, u.username FROM recipes r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC"
    );
    res.status(200).json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (get all)." });
  }
});

/**
 * GET /api/recipes/:id
 * Récupère une recette spécifique par son ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT r.*, u.username FROM recipes r JOIN users u ON r.user_id = u.id WHERE r.id = ?",
      [id]
    );
    const recipe = rows[0];

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée." });
    }
    res.status(200).json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (get one)." });
  }
});


// --- ROUTES PROTÉGÉES (Nécessitent un Token JWT) ---
// Le middleware 'auth' est appliqué à toutes les routes ci-dessous

/**
 * POST /api/recipes
 * Crée une nouvelle recette
 */
router.post('/', auth, async (req, res) => {
  try {
    const { title, instructions, image_url } = req.body;
    // On récupère l'ID de l'utilisateur grâce au middleware 'auth'
    const userId = req.auth.userId; 

    if (!title || !instructions) {
      return res.status(400).json({ message: "Titre et instructions requis." });
    }

    const [result] = await db.query(
      "INSERT INTO recipes (title, instructions, image_url, user_id) VALUES (?, ?, ?, ?)",
      [title, instructions, image_url, userId]
    );

    res.status(201).json({ message: "Recette créée !", recipeId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (create)." });
  }
});

/**
 * PUT /api/recipes/:id
 * Met à jour une recette (uniquement si on est le propriétaire)
 */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, instructions, image_url } = req.body;
    const userId = req.auth.userId;

    // 1. Vérifier si la recette existe et qui est le propriétaire
    const [rows] = await db.query("SELECT * FROM recipes WHERE id = ?", [id]);
    const recipe = rows[0];

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée." });
    }

    // 2. VÉRIFICATION DE PROPRIÉTÉ
    if (recipe.user_id !== userId) {
      return res.status(403).json({ message: "Action non autorisée (pas le propriétaire)." });
    }

    // 3. Mettre à jour la recette
    await db.query(
      "UPDATE recipes SET title = ?, instructions = ?, image_url = ? WHERE id = ?",
      [title, instructions, image_url, id]
    );

    res.status(200).json({ message: "Recette mise à jour !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (update)." });
  }
});

/**
 * DELETE /api/recipes/:id
 * Supprime une recette (uniquement si on est le propriétaire)
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    // 1. Vérifier le propriétaire
    const [rows] = await db.query("SELECT user_id FROM recipes WHERE id = ?", [id]);
    const recipe = rows[0];

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée." });
    }

    // 2. VÉRIFICATION DE PROPRIÉTÉ
    if (recipe.user_id !== userId) {
      return res.status(403).json({ message: "Action non autorisée (pas le propriétaire)." });
    }

    // 3. Supprimer la recette
    await db.query("DELETE FROM recipes WHERE id = ?", [id]);

    res.status(200).json({ message: "Recette supprimée !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (delete)." });
  }
});

// --- NOUVELLES ROUTES POUR LES COMMENTAIRES (NoSQL) ---

/**
 * GET /api/recipes/:id/comments
 * Récupère tous les commentaires pour une recette (PUBLIQUE)
 */
router.get('/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const commentsCollection = await getCommentsCollection();

        // On cherche tous les commentaires où recipeId correspond
        const comments = await commentsCollection.find({ recipeId: id }).sort({ createdAt: -1 }).toArray();

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (get comments)." });
    }
});

/**
 * POST /api/recipes/:id/comments
 * Poste un nouveau commentaire (PROTÉGÉE)
 */
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { id: recipeId } = req.params;
        const { text } = req.body;
        const userId = req.auth.userId; // Récupéré du middleware 'auth'

        if (!text) {
            return res.status(400).json({ message: "Le commentaire ne peut pas être vide." });
        }

        // --- LOGIQUE HYBRIDE (SQL + NoSQL) ---
        // 1. Lire dans MySQL pour obtenir le nom d'utilisateur
        const [rows] = await db.query("SELECT username FROM users WHERE id = ?", [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        const username = rows[0].username;

        // 2. Préparer le document NoSQL
        const commentDocument = {
            recipeId: recipeId,
            userId: userId,
            username: username, // Stocké pour un affichage facile
            text: text,
            createdAt: new Date()
        };

        // 3. Écrire dans MongoDB
        const commentsCollection = await getCommentsCollection();
        await commentsCollection.insertOne(commentDocument);

        res.status(201).json({ message: "Commentaire ajouté !", comment: commentDocument });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (post comment)." });
    }
});

module.exports = router;