/**
 * Fichier app.js principal
 * Gère :
 * 1. Le menu burger
 * 2. L'affichage et les interactions avec la liste des recettes (CRUD SQL)
 * 3. L'affichage et les interactions avec les commentaires (CRUD NoSQL)
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

    // --- 2. SÉLECTION DES ÉLÉMENTS PRINCIPAUX ---
    const recipeListSection = document.getElementById('recipe-list');
    const mainContent = document.querySelector('main .container');

    /**
     * Affiche toutes les recettes sur la page d'accueil
     */
    async function fetchAndDisplayRecipes() {
        const loggedInUserId = localStorage.getItem('sharecook_userId');

        try {
            const response = await fetch('/api/recipes');
            if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
            
            const recipes = await response.json();

            if (!recipeListSection) return;
            recipeListSection.innerHTML = ''; 

            if (recipes.length === 0) {
                recipeListSection.innerHTML = '<p>Aucune recette trouvée pour le moment.</p>';
                return;
            }

            recipes.forEach(recipe => {
                const recipeCard = document.createElement('article');
                recipeCard.className = 'recipe-card';

                // Préparer les boutons d'action (si l'utilisateur est le propriétaire)
                let deleteButtonHtml = '';
                let editButtonHtml = '';

                if (loggedInUserId && loggedInUserId == recipe.user_id) { 
                    editButtonHtml = `<a href="edit-recipe.html?id=${recipe.id}" class="edit-recipe-btn">Modifier</a>`; 
                    deleteButtonHtml = `<button class="delete-recipe-btn" data-recipe-id="${recipe.id}">Supprimer</button>`;
                }

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
     * Affiche la vue détaillée d'une seule recette (SQL)
     * ET ses commentaires (NoSQL)
     */
    async function showRecipeDetail(id) {
        try {
            // --- 1. APPEL SQL (Récupérer la recette) ---
            const resRecipe = await fetch(`/api/recipes/${id}`);
            if (!resRecipe.ok) throw new Error("Recette non trouvée.");
            const recipe = await resRecipe.json();

            // --- 2. APPEL NOSQL (Récupérer les commentaires) ---
            const resComments = await fetch(`/api/recipes/${id}/comments`);
            if (!resComments.ok) throw new Error("Impossible de charger les commentaires.");
            const comments = await resComments.json();

            // --- 3. Vérifier l'état de connexion ---
            const token = localStorage.getItem('sharecook_token');
            const loggedInUserId = localStorage.getItem('sharecook_userId');

            // --- 4. Construire le HTML des commentaires ---
            let commentsHtml = '<ul class="comment-list">';
            if (comments.length > 0) {
                comments.forEach(comment => {
                    // --- Logique d'affichage des boutons ---
                    let actionButtonsHtml = '';
                    if (loggedInUserId && loggedInUserId == comment.userId) {
                        actionButtonsHtml = `
                            <div class="comment-actions">
                                <button class="edit-comment-btn" data-comment-id="${comment._id}">Modifier</button>
                                <button class="delete-comment-btn" data-comment-id="${comment._id}" title="Supprimer">&times;</button>
                            </div>
                        `;
                    }

                    commentsHtml += `
                        <li data-comment-li-id="${comment._id}">
                            ${actionButtonsHtml}
                            <p data-comment-text-id="${comment._id}">${comment.text}</p>
                            <span class="comment-meta">Par : ${comment.username} (le ${new Date(comment.createdAt).toLocaleDateString('fr-FR')})</span>
                        </li>
                    `;
                });
            } else {
                commentsHtml += '<li><p>Soyez le premier à commenter !</p></li>';
            }
            commentsHtml += '</ul>';

            // --- 5. Construire le formulaire de commentaire (si connecté) ---
            let commentFormHtml = '';
            if (token) {
                commentFormHtml = `
                    <h4>Ajouter un commentaire</h4>
                    <form id="comment-form" data-recipe-id="${id}">
                        <div class="form-group">
                            <textarea id="comment-text" placeholder="Votre commentaire..." required></textarea>
                        </div>
                        <button type="submit" class="btn">Envoyer</button>
                    </form>
                `;
            } else {
                commentFormHtml = '<p><a href="login.html">Connectez-vous</a> pour laisser un commentaire.</p>';
            }

            // --- 6. Assembler et injecter le HTML final ---
            if (!mainContent) return; 
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

                    <section class="comments-section">
                        <h3>Commentaires</h3>
                        ${commentsHtml}
                        ${commentFormHtml}
                    </section>
                </div>
            `;
        } catch (error) {
            console.error('Erreur lors de l\'affichage du détail:', error);
            if (mainContent) {
                mainContent.innerHTML = `<p>Impossible de charger cette recette. ${error.message}</p>`;
            }
        }
    }

    // --- 3. GESTION DES ÉVÉNEMENTS ---

    // A. ÉVÉNEMENTS SUR LA PAGE D'ACCUEIL (Liste des recettes)
    if (recipeListSection) {
        fetchAndDisplayRecipes();

        // Délégation d'événement pour les clics sur la liste
        recipeListSection.addEventListener('click', async (e) => {
            
            // CAS 1 : Clic sur "Voir la recette"
            if (e.target.classList.contains('view-recipe-link')) {
                e.preventDefault(); 
                const recipeId = e.target.dataset.recipeId;
                showRecipeDetail(recipeId);
            }

            // CAS 2 : Clic sur "Supprimer" (Recette)
            if (e.target.classList.contains('delete-recipe-btn')) {
                e.preventDefault();
                const recipeId = e.target.dataset.recipeId;
                const token = localStorage.getItem('sharecook_token');

                if (!confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) return;
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
                    e.target.closest('.recipe-card').remove();
                } catch (error) {
                    console.error('Erreur suppression recette:', error);
                    alert(`Erreur: ${error.message}`);
                }
            }
        });
    } // Fin de if (recipeListSection)


    // B. ÉVÉNEMENTS SUR LA VUE DÉTAILLÉE (Formulaires et Clics)
    if (mainContent) {

        // Délégation d'événement pour les soumissions de formulaire
        mainContent.addEventListener('submit', async (e) => {
            
            // CAS 1 : Soumission d'un NOUVEAU commentaire
            if (e.target.id === 'comment-form') {
                e.preventDefault();
                const form = e.target;
                const recipeId = form.dataset.recipeId;
                const token = localStorage.getItem('sharecook_token');
                const text = form.querySelector('#comment-text').value;

                if (!token || !text) {
                    alert("Erreur : Connexion ou texte manquant.");
                    return;
                }

                try {
                    const res = await fetch(`/api/recipes/${recipeId}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ text })
                    });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.message || "Erreur lors de l'envoi");
                    }
                    showRecipeDetail(recipeId); // Recharge la vue détail
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            }

            // CAS 2 : Soumission d'un commentaire MODIFIÉ
            if (e.target.id === 'inline-edit-form') {
                e.preventDefault();
                const form = e.target;
                const commentId = form.dataset.commentId;
                const token = localStorage.getItem('sharecook_token');
                const newText = form.querySelector('.inline-edit-textarea').value;

                if (!token) {
                    alert("Session expirée. Veuillez vous reconnecter.");
                    return;
                }

                try {
                    const res = await fetch(`/api/comments/${commentId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ text: newText })
                    });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.message || 'Erreur lors de la mise à jour');
                    }
                    
                    const data = await res.json();
                    
                    // Mise à jour du DOM sans recharger
                    const li = form.closest('li');
                    li.querySelector(`[data-comment-text-id="${commentId}"]`).textContent = data.newText;
                    form.remove();
                    li.querySelector('p').style.display = 'block';
                    li.querySelector('.comment-actions').style.display = 'flex';
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            }
        }); // Fin du listener 'submit'

        
        // Délégation d'événement pour les CLICS (supprimer/modifier commentaire)
        mainContent.addEventListener('click', async (e) => {
            
            // CAS 3 : Clic sur "Supprimer" (Commentaire)
            if (e.target.classList.contains('delete-comment-btn')) {
                e.preventDefault();
                const commentId = e.target.dataset.commentId;
                const token = localStorage.getItem('sharecook_token');

                if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
                if (!token) {
                    alert("Session expirée. Veuillez vous reconnecter.");
                    return;
                }

                try {
                    const res = await fetch(`/api/comments/${commentId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.message || 'Erreur lors de la suppression');
                    }
                    e.target.closest('li').remove();
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            }

            // CAS 4 : Clic sur "Modifier" (Commentaire)
            else if (e.target.classList.contains('edit-comment-btn')) {
                e.preventDefault();
                const commentId = e.target.dataset.commentId;
                const li = e.target.closest('li');
                const p = li.querySelector(`[data-comment-text-id="${commentId}"]`);
                const originalText = p.textContent;
                
                // Cacher le texte et les boutons
                p.style.display = 'none';
                li.querySelector('.comment-actions').style.display = 'none';

                // Insérer le formulaire de modification
                const editForm = document.createElement('form');
                editForm.id = 'inline-edit-form';
                editForm.dataset.commentId = commentId;
                editForm.innerHTML = `
                    <textarea class="inline-edit-textarea">${originalText}</textarea>
                    <div class="btn-group">
                        <button type"submit" class="btn-save">Enregistrer</button>
                        <button type="button" class="btn-cancel">Annuler</button>
                    </div>
                `;
                p.after(editForm);
            }

            // CAS 5 : Clic sur "Annuler" la modification
            else if (e.target.classList.contains('btn-cancel')) {
                e.preventDefault();
                const li = e.target.closest('li');
                
                // Remettre tout comme avant
                li.querySelector('#inline-edit-form').remove();
                li.querySelector('p').style.display = 'block';
                li.querySelector('.comment-actions').style.display = 'flex';
            }
        }); // Fin du listener 'click'

    } // Fin de if (mainContent)

}); // Fin de DOMContentLoaded