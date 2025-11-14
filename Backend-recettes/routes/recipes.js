// Gestion du CRUD des recettes

const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Notre connexion BDD
const auth = require('../middleware/auth'); // Notre "gardien"
// On supprime les imports de MongoDB, ils n'ont plus rien à faire ici

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

    const [rows] = await db.query("SELECT * FROM recipes WHERE id = ?", [id]);
    const recipe = rows[0];

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée." });
    }

    if (recipe.user_id !== userId) {
      return res.status(403).json({ message: "Action non autorisée (pas le propriétaire)." });
    }

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

    const [rows] = await db.query("SELECT user_id FROM recipes WHERE id = ?", [id]);
    const recipe = rows[0];

    if (!recipe) {
      return res.status(404).json({ message: "Recette non trouvée." });
    }

    if (recipe.user_id !== userId) {
      return res.status(403).json({ message: "Action non autorisée (pas le propriétaire)." });
    }

    await db.query("DELETE FROM recipes WHERE id = ?", [id]);

    res.status(200).json({ message: "Recette supprimée !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur (delete)." });
  }
});

// LES ROUTES DE COMMENTAIRES ONT ÉTÉ SUPPRIMÉES D'ICI

module.exports = router;