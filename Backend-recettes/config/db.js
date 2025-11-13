// On importe "dotenv" pour charger les variables d'environnement
require('dotenv').config();

// On importe mysql2 et on utilise la version "promise"
const mysql = require('mysql2/promise');

// On crée un "pool" de connexions. C'est plus performant.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// On exporte le pool pour l'utiliser dans nos routes
module.exports = pool;