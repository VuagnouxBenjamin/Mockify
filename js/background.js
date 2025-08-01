// Écouter les événements de rechargement complet de page
chrome.webNavigation.onCommitted.addListener(function(details) {
    // Vérifier si c'est un rechargement complet (type 0 = rechargement)
    if (details.transitionType === 'reload') {
        const currentUrl = details.url;
        const storageKey = `protectionMode_${currentUrl}`;
        
        // Réinitialiser le mode de protection pour cette page
        const saveData = {};
        saveData[storageKey] = false;
        
        chrome.storage.local.set(saveData, function() {
            console.log(`Mode protection réinitialisé pour ${hostname} après rechargement complet`);
        });
    }
});