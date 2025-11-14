const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Notre gardien de sécurité
const { getCommentsCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');
const db = require('../config/db'); // <- AJOUT : On a besoin de MySQL pour le POST

/**
 * GET /api/comments/recipe/:recipeId
 * Récupère tous les commentaires pour une recette (PUBLIQUE)
 * (Anciennement GET /api/recipes/:id/comments)
 */
router.get('/recipe/:recipeId', async (req, res) => {
    try {
        const { recipeId } = req.params; // <- Changé de 'id' à 'recipeId'
        const commentsCollection = await getCommentsCollection();

        // On cherche tous les commentaires où recipeId correspond
        const comments = await commentsCollection.find({ recipeId: recipeId }).sort({ createdAt: -1 }).toArray();

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (get comments)." });
    }
});

/**
 * POST /api/comments/recipe/:recipeId
 * Poste un nouveau commentaire (PROTÉGÉE)
 * (Anciennement POST /api/recipes/:id/comments)
 */
router.post('/recipe/:recipeId', auth, async (req, res) => {
    try {
        const { recipeId } = req.params; // <- Changé de 'id' à 'recipeId'
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


/**
 * DELETE /api/comments/:commentId
 * Supprime un commentaire. (Route existante)
 */
router.delete('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.auth.userId; 

        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "ID de commentaire invalide." });
        }

        const commentsCollection = await getCommentsCollection();
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé." });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });
        res.status(200).json({ message: "Commentaire supprimé avec succès." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (delete comment)." });
    }
});

/**
 * PUT /api/comments/:commentId
 * Modifie un commentaire. (Route existante)
 */
router.put('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body; 
        const userId = req.auth.userId;

        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "ID de commentaire invalide." });
        }
        if (!text) {
            return res.status(400).json({ message: "Le commentaire ne peut pas être vide." });
        }

        const commentsCollection = await getCommentsCollection();
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé." });
        }

        if (comment.userId !== userId) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        const updateResult = await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $set: { text: text, updatedAt: new Date() } }
        );
        
        if (updateResult.modifiedCount === 0) {
             return res.status(500).json({ message: "La mise à jour a échoué." });
        }

        res.status(200).json({ message: "Commentaire mis à jour.", newText: text });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (update comment)." });
    }
});

module.exports = router;