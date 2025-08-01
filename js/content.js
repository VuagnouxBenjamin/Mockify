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
    const storageKey = `protectionMode_${hostname}`;
    
    if (items[storageKey]) {
        addProtectionMessage();
        changeFavicon();
    }
});

// Écouter les mises à jour du stockage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    const hostname = window.location.hostname;
    const storageKey = `protectionMode_${hostname}`;
    
    if (changes[storageKey]) {
        if (changes[storageKey].newValue) {
            addProtectionMessage();
            changeFavicon();
        } else {
            removeProtectionMessage();
            restoreFavicon();
        }
    }
});