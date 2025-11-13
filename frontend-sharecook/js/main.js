document.addEventListener('DOMContentLoaded', () => {

    // 1. Vérifier si un token existe
    const token = localStorage.getItem('sharecook_token');
    
    // 2. Sélectionner la liste de liens dans la nav
    const navLinks = document.getElementById('nav-links');

    if (!navLinks) return; // Ne rien faire si la nav n'est pas sur la page

    if (token) {
        // --- CAS 1: L'utilisateur EST connecté ---
        
        // On vide les liens "Se connecter / S'inscrire"
        navLinks.innerHTML = ''; 
        
        // On ajoute les nouveaux liens
        navLinks.innerHTML += '<li><a href="index.html">Accueil</a></li>';
        navLinks.innerHTML += '<li><a href="create-recipe.html">Créer une recette</a></li>';
        
        // On crée un bouton de déconnexion
        const logoutButton = document.createElement('li');
        logoutButton.innerHTML = '<a href="#" id="logout-button">Se déconnecter</a>';
        
        navLinks.appendChild(logoutButton);

        // On ajoute l'événement au clic sur le bouton "logout"
        const logoutLink = document.getElementById('logout-button');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                
                // On supprime le token
                localStorage.removeItem('sharecook_token');
                localStorage.removeItem('sharecook_userId');
                
                // On redirige vers l'accueil
                window.location.href = 'index.html';
            });
        }

    } else {
        // --- CAS 2: L'utilisateur N'EST PAS connecté ---
        
        // On s'assure que les bons liens sont affichés
        navLinks.innerHTML = ''; // Vider au cas où
        navLinks.innerHTML += '<li><a href="index.html">Accueil</a></li>';
        navLinks.innerHTML += '<li><a href="login.html">Se connecter</a></li>';
        navLinks.innerHTML += '<li><a href="register.html">S\'inscrire</a></li>';
    }
});