document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SÉCURITÉ : "Auth Guard" ---
    // On vérifie si l'utilisateur est connecté *avant* de faire quoi que ce soit
    const token = localStorage.getItem('sharecook_token');
    
    if (!token) {
        // Si pas de token, on redirige vers la page de connexion
        alert("Vous devez être connecté pour créer une recette.");
        window.location.href = 'login.html';
        return; // On arrête l'exécution du script
    }

    // --- 2. GESTION DU FORMULAIRE ---
    const form = document.getElementById('create-recipe-form');
    const messageContainer = document.getElementById('message-container');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Récupérer les données du formulaire
            const title = form.title.value;
            const instructions = form.instructions.value;
            const image_url = form.image_url.value;

            try {
                // --- 3. APPEL API SÉCURISÉ (Exemple 1.3 / 2.3) ---
                const res = await fetch('/api/recipes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // C'EST LA LIGNE LA PLUS IMPORTANTE :
                        // On ajoute le token au header de la requête
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                        title,
                        instructions,
                        image_url
                    })
                });

                const data = await res.json();

                if (!res.ok) {
                    // Si l'API renvoie une erreur (ex: token expiré)
                    throw new Error(data.message || 'Erreur lors de la création.');
                }

                // Succès !
                showMessage('Recette créée avec succès ! Redirection...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirige vers l'accueil
                }, 2000);

            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }

    // Fonction utilitaire pour afficher les messages
    function showMessage(message, type) {
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = type; // 'success' ou 'error'
        }
    }
});