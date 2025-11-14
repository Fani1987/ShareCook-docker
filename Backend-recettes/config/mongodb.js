const { MongoClient } = require('mongodb');

// L'URL de connexion utilise le nom de service défini dans docker-compose.yml
const url = 'mongodb://db-nosql:27017';
const client = new MongoClient(url);

let db;

async function connectDB() {
    try {
        await client.connect();
        console.log('Connecté avec succès à MongoDB');
        db = client.db('sharecook_comments_db'); // Nom de votre base de données NoSQL
        return db;
    } catch (e) {
        console.error('Impossible de se connecter à MongoDB', e);
        process.exit(1);
    }
}

// Exporte une fonction pour obtenir la base de données (et la connexion si elle n'existe pas)
const getDb = async () => {
    if (db) return db;
    return await connectDB();
};

// Exporte une fonction pour obtenir directement la collection
const getCommentsCollection = async () => {
    const database = await getDb();
    return database.collection('comments');
};

module.exports = { getCommentsCollection, getDb };