/**
 * Fichier d'utilitaires (fonctions partagées)
 */

/**
 * Affiche un message de succès ou d'erreur dans le conteneur #message-container
 * @param {string} message - Le texte à afficher
 * @param {string} type - 'success' (vert) ou 'error' (rouge)
 */
export function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    if (messageContainer) {
        messageContainer.textContent = message;
        messageContainer.className = type; // Applique la classe .success ou .error
    }
}

/**
 * "Nettoie" une chaîne de caractères pour empêcher les attaques XSS.
 * Remplace <, >, & par leurs équivalents HTML sécurisés.
 * @param {string} str - La chaîne à nettoyer
 * @returns {string} - La chaîne nettoyée
 */
export function sanitizeHTML(str) {
    if (!str) return ''; // Gère le cas où str est null ou undefined
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}