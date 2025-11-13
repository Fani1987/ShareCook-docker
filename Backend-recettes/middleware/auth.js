const jwt = require('jsonwebtoken');

// Le middleware est une simple fonction
module.exports = (req, res, next) => {
  try {
    // 1. Récupérer le token du header 'Authorization'
    // Le header ressemble à "Bearer VOTRE_LONG_TOKEN"
    const token = req.headers.authorization.split(' ')[1];

    // 2. Décoder et vérifier le token avec votre clé secrète
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Extraire l'ID utilisateur du token décodé
    const userId = decodedToken.userId;

    // 4. Attacher l'ID utilisateur à l'objet 'req'
    // pour que vos routes suivantes puissent y accéder
    req.auth = {
      userId: userId
    };

    // 5. Tout est bon, on passe à la suite (la route)
    next();

  } catch (error) {
    // Si le header n'existe pas, si le token n'est pas bon, etc.
    res.status(401).json({ message: 'Authentification échouée !' });
  }
};