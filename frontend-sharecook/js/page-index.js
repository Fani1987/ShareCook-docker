/**
 * Gère TOUTE la logique de la page d'accueil (index.html)
 */
import { sanitizeHTML } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {

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

                let deleteButtonHtml = '';
                let editButtonHtml = '';

                if (loggedInUserId && loggedInUserId == recipe.user_id) { 
                    editButtonHtml = `<a href="edit-recipe.html?id=${recipe.id}" class="edit-recipe-btn">Modifier</a>`; 
                    deleteButtonHtml = `<button class="delete-recipe-btn" data-recipe-id="${recipe.id}">Supprimer</button>`;
                }
                
                const safeTitle = sanitizeHTML(recipe.title);
                const safeUsername = sanitizeHTML(recipe.username);
                const safeImgUrl = recipe.image_url ? sanitizeHTML(recipe.image_url) : 'https://via.placeholder.com/300x200?text=Recette';
                const safeAlt = `Image de ${safeTitle}`;

                recipeCard.innerHTML = `
                    <img src="${safeImgUrl}" alt="${safeAlt}">
                    <div class="recipe-card-content">
                        <h3>${safeTitle}</h3>
                        <p>Par : <strong>${safeUsername}</strong></p>
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
            const resRecipe = await fetch(`/api/recipes/${id}`);
            if (!resRecipe.ok) throw new Error("Recette non trouvée.");
            const recipe = await resRecipe.json();

            // --- CORRECTION URL ---
            const resComments = await fetch(`/api/comments/recipe/${id}`);
            if (!resComments.ok) throw new Error("Impossible de charger les commentaires.");
            const comments = await resComments.json();

            const token = localStorage.getItem('sharecook_token');
            const loggedInUserId = localStorage.getItem('sharecook_userId');

            let commentsHtml = '<ul class="comment-list">';
            if (comments.length > 0) {
                comments.forEach(comment => {
                    let actionButtonsHtml = '';
                    if (loggedInUserId && loggedInUserId == comment.userId) {
                        actionButtonsHtml = `
                            <div class="comment-actions">
                                <button class="edit-comment-btn" data-comment-id="${comment._id}">Modifier</button>
                                <button class="delete-comment-btn" data-comment-id="${comment._id}" title="Supprimer">&times;</button>
                            </div>
                        `;
                    }
                    
                    const safeCommentText = sanitizeHTML(comment.text);
                    const safeCommentUser = sanitizeHTML(comment.username);

                    commentsHtml += `
                        <li data-comment-li-id="${comment._id}">
                            ${actionButtonsHtml}
                            <p data-comment-text-id="${comment._id}">${safeCommentText}</p>
                            <span class="comment-meta">Par : ${safeCommentUser} (le ${new Date(comment.createdAt).toLocaleDateString('fr-FR')})</span>
                        </li>
                    `;
                });
            } else {
                commentsHtml += '<li><p>Soyez le premier à commenter !</p></li>';
            }
            commentsHtml += '</ul>';
            
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

            const safeTitle = sanitizeHTML(recipe.title);
            const safeUsername = sanitizeHTML(recipe.username);
            const safeInstructions = sanitizeHTML(recipe.instructions).replace(/\n/g, '<br>');
            const safeImgUrl = recipe.image_url ? sanitizeHTML(recipe.image_url) : 'https://via.placeholder.com/800x400?text=Recette';
            const safeAlt = `Image de ${safeTitle}`;

            if (!mainContent) return; 
            mainContent.innerHTML = `
                <div class="recipe-detail-container">
                    <a href="index.html" class="back-link">&larr; Revenir à la liste</a>
                    <h2>${safeTitle}</h2>
                    <p class="recipe-meta">Par : <strong>${safeUsername}</strong> | Posté le ${new Date(recipe.created_at).toLocaleDateString('fr-FR')}</p>
                    <img src="${safeImgUrl}" alt="${safeAlt}">
                    
                    <h3>Instructions :</h3>
                    <div class="recipe-instructions">
                        ${safeInstructions}
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

        recipeListSection.addEventListener('click', async (e) => {
            
            if (e.target.classList.contains('view-recipe-link')) {
                e.preventDefault(); 
                const recipeId = e.target.dataset.recipeId;
                showRecipeDetail(recipeId);
            }

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
        
        mainContent.addEventListener('submit', async (e) => {
            
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
                    // --- CORRECTION URL ---
                    const res = await fetch(`/api/comments/recipe/${recipeId}`, {
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
                    showRecipeDetail(recipeId);
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            }

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
                    
                    const li = form.closest('li');
                    li.querySelector(`[data-comment-text-id="${commentId}"]`).textContent = data.newText;
                    form.remove();
                    li.querySelector('p').style.display = 'block';
                    li.querySelector('.comment-actions').style.display = 'flex';
                } catch (error) {
                    alert(`Erreur: ${error.message}`);
                }
            }
        }); 

        mainContent.addEventListener('click', async (e) => {
            
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

            else if (e.target.classList.contains('edit-comment-btn')) {
                e.preventDefault();
                const commentId = e.target.dataset.commentId;
                const li = e.target.closest('li');
                const p = li.querySelector(`[data-comment-text-id="${commentId}"]`);
                const originalText = p.textContent;
                
                p.style.display = 'none';
                li.querySelector('.comment-actions').style.display = 'none';

                const editForm = document.createElement('form');
                editForm.id = 'inline-edit-form';
                editForm.dataset.commentId = commentId;
                editForm.innerHTML = `
                    <textarea class="inline-edit-textarea">${sanitizeHTML(originalText)}</textarea>
                    <div class="btn-group">
                        <button type"submit" class="btn-save">Enregistrer</button>
                        <button type="button" class="btn-cancel">Annuler</button>
                    </div>
                `;
                p.after(editForm);
            }

            else if (e.target.classList.contains('btn-cancel')) {
                e.preventDefault();
                const li = e.target.closest('li');
                
                li.querySelector('#inline-edit-form').remove();
                li.querySelector('p').style.display = 'block';
                li.querySelector('.comment-actions').style.display = 'flex';
            }
        }); 

    } // Fin de if (mainContent)

}); // Fin de DOMContentLoaded