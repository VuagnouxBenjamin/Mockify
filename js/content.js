// Fonction pour sauvegarder le favicon original
let originalFavicon = null;

// Fonction pour changer le favicon
function changeFavicon() {
    // Liste des sélecteurs de favicon possibles
    const faviconSelectors = [
        'link[rel="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="alternate icon"]',
        'link[rel="mask-icon"]',
        'link[rel="apple-touch-icon"]',
        'link[class*="favicon"]'
    ];

    // Sauvegarder tous les favicons originaux s'ils ne sont pas déjà sauvegardés
    if (!originalFavicon) {
        originalFavicon = [];
        faviconSelectors.forEach(selector => {
            const icons = document.querySelectorAll(selector);
            icons.forEach(icon => {
                originalFavicon.push({
                    element: icon,
                    href: icon.href,
                    rel: icon.rel,
                    type: icon.type
                });
            });
        });
    }

    // Remplacer tous les favicons existants
    faviconSelectors.forEach(selector => {
        const icons = document.querySelectorAll(selector);
        icons.forEach(icon => {
            icon.href = chrome.runtime.getURL('icons/icon16.png');
            // Conserver le type d'origine si c'est un SVG
            if (!icon.type || !icon.type.includes('svg')) {
                icon.type = 'image/png';
            }
        });
    });

    // Si aucun favicon n'existe, en créer un nouveau
    if (document.querySelectorAll(faviconSelectors.join(',')).length === 0) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = chrome.runtime.getURL('icons/icon16.png');
        document.head.appendChild(favicon);
    }
}

// Fonction pour restaurer le favicon original
function restoreFavicon() {
    if (originalFavicon && Array.isArray(originalFavicon)) {
        originalFavicon.forEach(original => {
            if (original.element) {
                original.element.href = original.href;
                if (original.type) {
                    original.element.type = original.type;
                }
                if (original.rel) {
                    original.element.rel = original.rel;
                }
            }
        });
    }
}

// Fonction pour bloquer les clics sur les liens
function blockLinks(event) {
    if (event.target.tagName === 'A' || event.target.closest('a')) {
        event.preventDefault();
        event.stopPropagation();
    }
}

// Fonction pour bloquer les soumissions de formulaire
function blockSubmits(event) {
    // Bloquer les inputs de type submit
    if (event.target.type === 'submit' || event.target.closest('input[type="submit"]')) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    
    // Bloquer les boutons de type submit (explicite ou implicite)
    if (event.target.tagName === 'BUTTON') {
        const type = event.target.getAttribute('type');
        if (!type || type === 'submit') {  // Les boutons sans type sont submit par défaut
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }
    
    // Bloquer les boutons submit dans l'ascendance
    if (event.target.closest('button[type="submit"]')) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    
    // Bloquer les soumissions de formulaire directes
    if (event.type === 'submit') {
        event.preventDefault();
        event.stopPropagation();
    }
}

// Fonction pour ajouter le message de protection
function addProtectionMessage() {
    // Vérifier si le message existe déjà
    if (!document.getElementById('mockify-protection-message')) {
        // Créer l'élément du message
        const messageDiv = document.createElement('div');
        messageDiv.id = 'mockify-protection-message';
        messageDiv.textContent = 'Protected by Mockify';
        
        // Appliquer les styles
        Object.assign(messageDiv.style, {
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            padding: '5px 10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '12px',
            borderRadius: '4px',
            zIndex: '9999',
            opacity: '0.7',
            pointerEvents: 'none'
        });

        // Ajouter le message au body
        document.body.appendChild(messageDiv);
    }
}

// Fonction pour supprimer le message de protection
function removeProtectionMessage() {
    const messageDiv = document.getElementById('mockify-protection-message');
    if (messageDiv) {
        messageDiv.remove();
    }
}

// Écouter les changements d'état de protection
chrome.storage.local.get(null, function(items) {
    const hostname = window.location.hostname;
    const protectionKey = `protectionMode_${hostname}`;
    const blockLinksKey = 'blockLinksEnabled';
    const blockSubmitsKey = 'blockSubmitsEnabled';
    
    if (items[protectionKey]) {
        addProtectionMessage();
        changeFavicon();
        // Vérifier si le blocage des liens est activé (true par défaut)
        if (items[blockLinksKey] === undefined || items[blockLinksKey]) {
            document.addEventListener('click', blockLinks, true);
        }
        // Vérifier si le blocage des boutons submit est activé (true par défaut)
        if (items[blockSubmitsKey] === undefined || items[blockSubmitsKey]) {
            document.addEventListener('click', blockSubmits, true);
            document.addEventListener('submit', blockSubmits, true);
        }
    }
});

// Écouter les mises à jour du stockage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    const hostname = window.location.hostname;
    const protectionKey = `protectionMode_${hostname}`;
    const blockLinksKey = 'blockLinksEnabled';
    const blockSubmitsKey = 'blockSubmitsEnabled';
    
    // Gérer les changements du mode protection
    if (changes[protectionKey]) {
        if (changes[protectionKey].newValue) {
            addProtectionMessage();
            changeFavicon();
            // Vérifier l'état actuel du blocage des liens et des boutons submit
            chrome.storage.local.get([blockLinksKey, blockSubmitsKey], function(result) {
                if (result[blockLinksKey] === undefined || result[blockLinksKey]) {
                    document.addEventListener('click', blockLinks, true);
                }
                if (result[blockSubmitsKey] === undefined || result[blockSubmitsKey]) {
                    document.addEventListener('click', blockSubmits, true);
                    document.addEventListener('submit', blockSubmits, true);
                }
            });
        } else {
            removeProtectionMessage();
            restoreFavicon();
            document.removeEventListener('click', blockLinks, true);
            document.removeEventListener('click', blockSubmits, true);
            document.removeEventListener('submit', blockSubmits, true);
        }
    }
    
    // Gérer les changements du paramètre de blocage des liens
    if (changes[blockLinksKey]) {
        chrome.storage.local.get([protectionKey], function(result) {
            if (result[protectionKey]) {  // Si le mode protection est actif
                if (changes[blockLinksKey].newValue) {
                    document.addEventListener('click', blockLinks, true);
                } else {
                    document.removeEventListener('click', blockLinks, true);
                }
            }
        });
    }

    // Gérer les changements du paramètre de blocage des boutons submit
    if (changes[blockSubmitsKey]) {
        chrome.storage.local.get([protectionKey], function(result) {
            if (result[protectionKey]) {  // Si le mode protection est actif
                if (changes[blockSubmitsKey].newValue) {
                    document.addEventListener('click', blockSubmits, true);
                    document.addEventListener('submit', blockSubmits, true);
                } else {
                    document.removeEventListener('click', blockSubmits, true);
                    document.removeEventListener('submit', blockSubmits, true);
                }
            }
        });
    }
});