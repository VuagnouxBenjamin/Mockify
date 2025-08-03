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
    const element = event.target.tagName === 'A' ? event.target : event.target.closest('a');
    if (element) {
        event.preventDefault();
        event.stopPropagation();
    }
}

// Fonction pour bloquer les soumissions de formulaire et tous les boutons
function blockSubmits(event) {
    let element = null;
    
    // Bloquer les inputs de type submit
    if (event.target.type === 'submit') {
        element = event.target;
    } else if (event.target.closest('input[type="submit"]')) {
        element = event.target.closest('input[type="submit"]');
    }
    
    // Bloquer tous les boutons
    if (!element && event.target.tagName === 'BUTTON') {
        element = event.target;
    } else if (!element && event.target.closest('button')) {
        element = event.target.closest('button');
    }
    
    if (element || event.type === 'submit') {
        event.preventDefault();
        event.stopPropagation();
    }
}

// Fonction pour ajouter le message de protection
function addProtectionMessage(snapshotName) {
    // Vérifier si le message existe déjà
    let messageDiv = document.getElementById('mockify-protection-message');
    
    if (!messageDiv) {
        // Créer l'élément du message
        messageDiv = document.createElement('div');
        messageDiv.id = 'mockify-protection-message';
        
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

    // Mettre à jour le texte du message
    messageDiv.textContent = snapshotName ? 
        `Currently viewing ${snapshotName} - Mockify` : 
        'Protected by Mockify';
}

// Fonction pour supprimer le message de protection
function removeProtectionMessage() {
    const messageDiv = document.getElementById('mockify-protection-message');
    if (messageDiv) {
        messageDiv.remove();
    }
}

// Fonction pour appliquer le style du curseur
function applyCursorStyle(element) {
    if (element) {
        element.style.cursor = 'not-allowed';
    }
}

// Fonction pour restaurer le style du curseur par défaut
function restoreCursorStyle(element) {
    if (element) {
        element.style.cursor = '';
    }
}

// Fonction pour gérer le survol des liens
function handleLinkHover(event) {
    const element = event.target.tagName === 'A' ? event.target : event.target.closest('a');
    if (element) {
        chrome.storage.local.get(['blockLinksEnabled', 'disableCursorEnabled'], function(result) {
            // Vérifier si le blocage des liens et le curseur sont activés
            if ((result.blockLinksEnabled === undefined || result.blockLinksEnabled) && result.disableCursorEnabled) {
                applyCursorStyle(element);
            } else {
                restoreCursorStyle(element);
            }
        });
    }
}

// Fonction pour gérer la sortie de survol des liens
function handleLinkMouseOut(event) {
    const element = event.target.tagName === 'A' ? event.target : event.target.closest('a');
    if (element) {
        restoreCursorStyle(element);
    }
}

// Fonction pour gérer le survol des boutons
function handleSubmitHover(event) {
    let element = null;
    
    if (event.target.type === 'submit') {
        element = event.target;
    } else if (event.target.closest('input[type="submit"]')) {
        element = event.target.closest('input[type="submit"]');
    } else if (event.target.tagName === 'BUTTON') {
        element = event.target;
    } else if (event.target.closest('button')) {
        element = event.target.closest('button');
    }
    
    if (element) {
        chrome.storage.local.get(['blockSubmitsEnabled', 'disableCursorEnabled'], function(result) {
            // Vérifier si le blocage des boutons et le curseur sont activés
            if ((result.blockSubmitsEnabled === undefined || result.blockSubmitsEnabled) && result.disableCursorEnabled) {
                applyCursorStyle(element);
            } else {
                restoreCursorStyle(element);
            }
        });
    }
}

// Fonction pour gérer la sortie de survol des boutons
function handleSubmitMouseOut(event) {
    let element = null;
    
    if (event.target.type === 'submit') {
        element = event.target;
    } else if (event.target.closest('input[type="submit"]')) {
        element = event.target.closest('input[type="submit"]');
    } else if (event.target.tagName === 'BUTTON') {
        element = event.target;
    } else if (event.target.closest('button')) {
        element = event.target.closest('button');
    }
    
    if (element) {
        restoreCursorStyle(element);
    }
}

// Fonction pour bloquer le rechargement de la page
function blockPageReload(event) {
    console.log('Tentative de rechargement détectée');
    
    // Le message à afficher
    const message = "Êtes-vous sûr de vouloir recharger la page ? Les modifications non enregistrées seront perdues.";
    
    // Pour les navigateurs modernes
    event.preventDefault();
    event.returnValue = message;
    
    // Pour la compatibilité avec les anciens navigateurs
    return message;
}

// Fonction pour créer un snapshot de la page
function createPageSnapshot(name) {
    const snapshot = {
        html: document.documentElement.outerHTML,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        title: document.title,
        name: name || `Snapshot ${new Date().toLocaleString('fr-FR')}`
    };
    
    return snapshot;
}

// Fonction pour restaurer un snapshot
function restorePageSnapshot(snapshot) {
    // Sauvegarder la position de défilement actuelle
    const scrollPos = {
        x: window.scrollX,
        y: window.scrollY
    };

    // Remplacer le contenu HTML
    document.documentElement.innerHTML = snapshot.html;
    
    // Restaurer la position de défilement
    window.scrollTo(scrollPos.x, scrollPos.y);

    // Mettre à jour le message de protection avec le nom du snapshot
    addProtectionMessage(snapshot.name);
}

// Écouter les messages du popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'createSnapshot') {
        const snapshot = createPageSnapshot(request.name);
        sendResponse(snapshot);
    } else if (request.action === 'restoreSnapshot') {
        restorePageSnapshot(request.snapshot);
        sendResponse({ success: true });
    }
    return true;
});

// Écouter les changements d'état de protection
chrome.storage.local.get(null, function(items) {
    const currentUrl = window.location.href;
    const protectionKey = `protectionMode_${currentUrl}`;
    const blockLinksKey = 'blockLinksEnabled';
    const blockSubmitsKey = 'blockSubmitsEnabled';
    const disableCursorKey = 'disableCursorEnabled';
    
    if (items[protectionKey]) {
        console.log('Mode protection activé - Ajout du blocage de rechargement');
        addProtectionMessage();
        changeFavicon();
        
        // Ajouter l'écouteur pour le rechargement de la page
        window.addEventListener('beforeunload', blockPageReload, { capture: true });
        
        // Vérifier si le blocage des liens est activé (true par défaut)
        if (items[blockLinksKey] === undefined || items[blockLinksKey]) {
            document.addEventListener('click', blockLinks, true);
        }
        // Ajouter les écouteurs de survol pour les liens
        document.addEventListener('mouseover', handleLinkHover, true);
        document.addEventListener('mouseout', handleLinkMouseOut, true);
        
        // Vérifier si le blocage des boutons submit est activé (true par défaut)
        if (items[blockSubmitsKey] === undefined || items[blockSubmitsKey]) {
            document.addEventListener('click', blockSubmits, true);
            document.addEventListener('submit', blockSubmits, true);
        }
        // Ajouter les écouteurs de survol pour les boutons submit
        document.addEventListener('mouseover', handleSubmitHover, true);
        document.addEventListener('mouseout', handleSubmitMouseOut, true);
    }
});

// Écouter les mises à jour du stockage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    const currentUrl = window.location.href;
    const protectionKey = `protectionMode_${currentUrl}`;
    const blockLinksKey = 'blockLinksEnabled';
    const blockSubmitsKey = 'blockSubmitsEnabled';
    const disableCursorKey = 'disableCursorEnabled';
    
    // Gérer les changements du mode protection
    if (changes[protectionKey]) {
        if (changes[protectionKey].newValue) {
            console.log('Mode protection activé via changement - Ajout du blocage de rechargement');
            addProtectionMessage();
            changeFavicon();
            // Ajouter l'écouteur pour le rechargement de la page
            window.addEventListener('beforeunload', blockPageReload, { capture: true });
            // Vérifier l'état actuel du blocage des liens et des boutons submit
            chrome.storage.local.get([blockLinksKey, blockSubmitsKey, disableCursorKey], function(result) {
                if (result[blockLinksKey] === undefined || result[blockLinksKey]) {
                    document.addEventListener('click', blockLinks, true);
                    if (result[disableCursorKey]) {
                        document.addEventListener('mouseover', handleLinkHover, true);
                    }
                }
                if (result[blockSubmitsKey] === undefined || result[blockSubmitsKey]) {
                    document.addEventListener('click', blockSubmits, true);
                    document.addEventListener('submit', blockSubmits, true);
                    if (result[disableCursorKey]) {
                        document.addEventListener('mouseover', handleSubmitHover, true);
                    }
                }
            });
        } else {
            removeProtectionMessage();
            restoreFavicon();
            // Retirer l'écouteur pour le rechargement de la page
            window.removeEventListener('beforeunload', blockPageReload);
            document.removeEventListener('click', blockLinks, true);
            document.removeEventListener('click', blockSubmits, true);
            document.removeEventListener('submit', blockSubmits, true);
            document.removeEventListener('mouseover', handleLinkHover, true);
            document.removeEventListener('mouseout', handleLinkMouseOut, true);
            document.removeEventListener('mouseover', handleSubmitHover, true);
            document.removeEventListener('mouseout', handleSubmitMouseOut, true);
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