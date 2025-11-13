/**
 * Fichier app.js principal
 * Gère :
 * 1. Le menu burger
 * 2. L'affichage et les interactions avec la liste des recettes
 */

// Attend que tout le HTML soit chargé
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. GESTION DU MENU BURGER ---
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.getElementById('nav-links');

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // --- 2. LOGIQUE DES RECETTES (AFFICHAGE ET ACTIONS) ---
    const recipeListSection = document.getElementById('recipe-list');
    const mainContent = document.querySelector('main .container');

    /**
     * Affiche toutes les recettes sur la page d'accueil
     */
    async function fetchAndDisplayRecipes() {
        // On récupère l'ID de l'utilisateur connecté pour afficher les boutons d'action
        const loggedInUserId = localStorage.getItem('sharecook_userId');

        try {
            const response = await fetch('/api/recipes');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const recipes = await response.json();

            if (!recipeListSection) return; // Quitter si on n'est pas sur la bonne page
            
            recipeListSection.innerHTML = ''; // Vider la section

            if (recipes.length === 0) {
                recipeListSection.innerHTML = '<p>Aucune recette trouvée pour le moment.</p>';
                return;
            }

            recipes.forEach(recipe => {
                const recipeCard = document.createElement('article');
                recipeCard.className = 'recipe-card';

                // Préparer les boutons d'action (si l'utilisateur est le propriétaire)
                let deleteButtonHtml = '';
                let editButtonHtml = ''; // <-- Ligne ajoutée

                // On compare l'ID stocké (string) avec l'ID de la recette (nombre)
                if (loggedInUserId && loggedInUserId == recipe.user_id) { 
                    // On ajoute le lien de modification
                    editButtonHtml = `<a href="edit-recipe.html?id=${recipe.id}" class="edit-recipe-btn">Modifier</a>`; 
                    
                    // On ajoute le bouton de suppression
                    deleteButtonHtml = `<button class="delete-recipe-btn" data-recipe-id="${recipe.id}">Supprimer</button>`;
                }

                // Générer le HTML de la carte
                recipeCard.innerHTML = `
                    <img src="${recipe.image_url || 'https://via.placeholder.com/300x200?text=Recette'}" alt="Image de ${recipe.title}">
                    <div class="recipe-card-content">
                        <h3>${recipe.title}</h3>
                        <p>Par : <strong>${recipe.username}</strong></p>
                        <div class="card-actions">
                            <a href="#" class="view-recipe-link" data-recipe-id="${recipe.id}">Voir la recette</a>
                            
                            <div class="admin-actions">
                                ${editButtonHtml}
                                ${deleteButtonHtml}
                            </div>
                        </div>
                    </div>
                `;
                recipeListSection.appendChild(recipeCard);
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des recettes:', error);
            if (recipeListSection) {
                recipeListSection.innerHTML = '<p>Impossible de charger les recettes. Vérifiez que le serveur back-end est démarré.</p>';
            }
        }
    }

    /**
     * Affiche la vue détaillée d'une seule recette
     */
    async function showRecipeDetail(id) {
        try {
            const response = await fetch(`/api/recipes/${id}`);
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const recipe = await response.json();

            if (!mainContent) return; // Quitter si on n'a pas de conteneur

            // Remplacer le contenu de <main> par la vue détail
            mainContent.innerHTML = `
                <div class="recipe-detail-container">
                    <a href="index.html" class="back-link">&larr; Revenir à la liste</a>
                    <h2>${recipe.title}</h2>
                    <p class="recipe-meta">Par : <strong>${recipe.username}</strong> | Posté le ${new Date(recipe.created_at).toLocaleDateString('fr-FR')}</p>
                    <img src="${recipe.image_url || 'https://via.placeholder.com/800x400?text=Recette'}" alt="Image de ${recipe.title}">
                    <h3>Instructions :</h3>
                    <div class="recipe-instructions">
                        ${recipe.instructions.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Erreur lors de l\'affichage du détail:', error);
            if (mainContent) {
                mainContent.innerHTML = '<p>Impossible de charger cette recette.</p>';
            }
        }
    }

    // --- 3. GESTION DES ÉVÉNEMENTS ---

    // On appelle la fonction d'affichage si on est sur la page d'accueil
    if (recipeListSection) {
        fetchAndDisplayRecipes();

        // On utilise la DÉLÉGATION D'ÉVÉNEMENT pour tous les clics sur la liste
        recipeListSection.addEventListener('click', async (e) => {
            
            // CAS 1 : Clic sur "Voir la recette"
            if (e.target.classList.contains('view-recipe-link')) {
                e.preventDefault(); // Annule le clic par défaut (le href="#")
                const recipeId = e.target.dataset.recipeId;
                showRecipeDetail(recipeId);
            }

            // CAS 2 : Clic sur "Supprimer"
            if (e.target.classList.contains('delete-recipe-btn')) {
                e.preventDefault();
                const recipeId = e.target.dataset.recipeId;
                const token = localStorage.getItem('sharecook_token');

                if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
                    return;
                }

                if (!token) {
                    alert("Vous devez être connecté pour faire cela.");
                    return;
                }

                try {
                    const res = await fetch(`/api/recipes/${recipeId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.message || 'Erreur lors de la suppression');
                    }

                    // Succès : retirer la carte du DOM
                    e.target.closest('.recipe-card').remove();

                } catch (error) {
                    console.error('Erreur suppression:', error);
                    alert(`Erreur: ${error.message}`);
                }
            }
        });
    }

}); // Fin de DOMContentLoaded