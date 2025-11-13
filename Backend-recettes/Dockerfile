# On part d'une version légère de Node.js
FROM node:18-alpine

# On crée un dossier de travail dans le conteneur
WORKDIR /app

# On copie les fichiers de dépendances
COPY package*.json ./

# On installe les dépendances
RUN npm install

# On copie tout le reste du code
COPY . .

# On expose le port 5000 (celui de votre API)
EXPOSE 5000

# La commande pour démarrer le serveur
CMD ["node", "index.js"]