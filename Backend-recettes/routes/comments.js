const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Notre gardien de sécurité
const { getCommentsCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

/**
 * DELETE /api/comments/:commentId
 * Supprime un commentaire.
 * C'est une route protégée qui vérifie la propriété.
 */
router.delete('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.auth.userId; // ID de l'utilisateur connecté (depuis le token)

        // 1. Valider que l'ID est un ObjectId MongoDB valide
        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "ID de commentaire invalide." });
        }

        const commentsCollection = await getCommentsCollection();

        // 2. Trouver le commentaire pour vérifier le propriétaire
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé." });
        }

        // 3. VÉRIFICATION DE SÉCURITÉ : L'utilisateur est-il le propriétaire ?
        if (comment.userId !== userId) {
            // 403 Forbidden : Vous n'avez pas le droit
            return res.status(403).json({ message: "Action non autorisée." });
        }

        // 4. Supprimer le commentaire
        await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });

        res.status(200).json({ message: "Commentaire supprimé avec succès." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur (delete comment)." });
    }
});

/**
 * PUT /api/comments/:commentId
 * Modifie un commentaire.
 * C'est une route protégée qui vérifie la propriété.
 */
router.put('/:commentId', auth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { text } = req.body; // Le nouveau texte du commentaire
        const userId = req.auth.userId;

        // 1. Valider que l'ID est un ObjectId MongoDB valide
        if (!ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "ID de commentaire invalide." });
        }
        
        // 2. Valider que le nouveau texte n'est pas vide
        if (!text) {
            return res.status(400).json({ message: "Le commentaire ne peut pas être vide." });
        }

        const commentsCollection = await getCommentsCollection();

        // 3. Trouver le commentaire pour vérifier le propriétaire
        const comment = await commentsCollection.findOne({ _id: new ObjectId(commentId) });

        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé." });
        }

        // 4. VÉRIFICATION DE SÉCURITÉ : L'utilisateur est-il le propriétaire ?
        if (comment.userId !== userId) {
            return res.status(403).json({ message: "Action non autorisée." });
        }

        // 5. Mettre à jour le commentaire dans MongoDB
        const updateResult = await commentsCollection.updateOne(
            { _id: new ObjectId(commentId) },
            { $set: { text: text, updatedAt: new Date() } } // Met à jour le texte et ajoute une date de modif
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