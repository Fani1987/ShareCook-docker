import { showMessage } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. RÉCUPÉRER LES ÉLÉMENTS ET L'ÉTAT ---
    const token = localStorage.getItem('sharecook_token');
    const loggedInUserId = localStorage.getItem('sharecook_userId');
    
    const form = document.getElementById('edit-recipe-form');
    const messageContainer = document.getElementById('message-container');
    
    // On sélectionne les champs du formulaire pour les pré-remplir
    const titleField = document.getElementById('title');
    const imageUrlField = document.getElementById('image_url');
    const instructionsField = document.getElementById('instructions');

    // --- 2. RÉCUPÉRER L'ID DE LA RECETTE DEPUIS L'URL ---
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    // --- 3. SÉCURITÉ ("Auth Guard") ---
    if (!token) {
        alert("Vous devez être connecté pour modifier une recette.");
        window.location.href = 'login.html';
        return;
    }
    if (!recipeId) {
        alert("Aucune recette sélectionnée.");
        window.location.href = 'index.html';
        return;
    }

    // --- 4. FONCTION POUR PRÉ-REMPLIR LE FORMULAIRE ---
    async function populateForm() {
        try {
            // 4a. Récupérer les données de la recette
            const res = await fetch(`/api/recipes/${recipeId}`);
            if (!res.ok) throw new Error("Recette non trouvée.");
            const recipe = await res.json();

            // 4b. VÉRIFICATION DE PROPRIÉTÉ (!)
            // On vérifie que l'utilisateur connecté est bien le propriétaire
            if (loggedInUserId != recipe.user_id) {
                alert("Action non autorisée. Vous n'êtes pas l'auteur de cette recette.");
                window.location.href = 'index.html';
                return;
            }

            // 4c. Remplir les champs du formulaire
            titleField.value = recipe.title;
            imageUrlField.value = recipe.image_url;
            instructionsField.value = recipe.instructions;

        } catch (error) {
            showMessage(error.message, 'error');
        }
    }

    // On appelle la fonction de remplissage au chargement de la page
    populateForm();

    // --- 5. GESTION DE LA SOUMISSION (ENVOI DU 'PUT') ---
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Récupérer les *nouvelles* données du formulaire
            const updatedData = {
                title: titleField.value,
                instructions: instructionsField.value,
                image_url: imageUrlField.value
            };

            try {
                // 5a. APPEL API SÉCURISÉ (PUT)
                const res = await fetch(`/api/recipes/${recipeId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // On inclut le token
                    },
                    body: JSON.stringify(updatedData)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Erreur lors de la mise à jour.');

                // 5b. Succès !
                showMessage('Recette mise à jour avec succès ! Redirection...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html'; // Redirige vers l'accueil
                }, 2000);

            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }
});