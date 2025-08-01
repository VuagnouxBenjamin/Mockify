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
    }
});

// Écouter les mises à jour du stockage
chrome.storage.onChanged.addListener(function(changes, namespace) {
    const hostname = window.location.hostname;
    const storageKey = `protectionMode_${hostname}`;
    
    if (changes[storageKey]) {
        if (changes[storageKey].newValue) {
            addProtectionMessage();
        } else {
            removeProtectionMessage();
        }
    }
});