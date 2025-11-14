/**
 * Gère la logique de navigation (ex: menu burger)
 * Ce script est chargé sur toutes les pages.
 */
document.addEventListener('DOMContentLoaded', () => {

    // --- GESTION DU MENU BURGER ---
    const burgerMenu = document.getElementById('burger-menu');
    const navLinks = document.getElementById('nav-links');

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

}); // Fin de DOMContentLoaded