const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Connexion à la BDD
const jwt = require('jsonwebtoken'); // Pour créer des tokens JWT

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    // 1. Récupérer les données du corps de la requête
    const { username, email, password } = req.body;

    // 2. Vérification simple des champs
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }

    // 3. Hacher le mot de passe (Exemple 2.3)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Insérer le nouvel utilisateur dans la BDD
    const [result] = await db.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, password_hash]
    );

    // 5. Renvoyer une réponse de succès
    res.status(201).json({ 
      message: "Utilisateur créé avec succès !", 
      userId: result.insertId 
    });

  } catch (error) {
    // Gestion d'erreur (ex: email déjà utilisé)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Cet email est déjà utilisé." });
    }
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la création." });
  }
});


// --- CONNEXION (LOGIN) ---
router.post('/login', async (req, res) => {
  try {
    // 1. Récupérer l'email et le mot de passe du corps de la requête
    const { email, password } = req.body;

    // 2. Vérification simple
    if (!email || !password) {
      return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
    }

    // 3. Chercher l'utilisateur dans la BDD
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];

    // 4. Si l'utilisateur n'existe pas
    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // 5. Comparer le mot de passe fourni avec le hachage dans la BDD
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    // 6. SUCCÈS ! Créer le Token JWT
    const payload = {
      userId: user.id,
      email: user.email
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }     
    );

    // 7. Renvoyer le token ET l'ID au client
    res.status(200).json({
      message: "Connexion réussie !",
      token: token, // <-- VIRGULE CORRIGÉE
      userId: user.id 
    });

  } catch (error)
 {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
});


module.exports = router;