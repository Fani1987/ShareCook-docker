// Attend que tout le HTML soit chargé
document.addEventListener('DOMContentLoaded', () => {

    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const messageContainer = document.getElementById('message-container');

    // --- LOGIQUE D'INSCRIPTION ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Empêche le rechargement de la page
            
            const username = registerForm.username.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;

            // (Vous pouvez ajouter plus de validation JS ici, comme la correspondance du mot de passe)
            
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Erreur lors de l_inscription.');
                }

                // Succès
                showMessage('Inscription réussie ! Vous allez être redirigé...', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html'; // Redirige vers la page de connexion
                }, 2000);

            } catch (error) {
                showMessage(error.message, 'error');
            }
        });
    }

    // --- LOGIQUE DE CONNEXION (GESTION DU TOKEN) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.message || 'Erreur lors de la connexion.');
                }

                // --- GESTION DU TOKEN (Exemple 1.3) ---
                // Le token est dans data.token
                // On le stocke dans le localStorage
                localStorage.setItem('sharecook_token', data.token);
                localStorage.setItem('sharecook_userId', data.userId);

                // Succès
                showMessage('Connexion réussie ! Vous allez être redirigé...', 'success');
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