document.addEventListener('DOMContentLoaded', function() {
  const protectionToggle = document.getElementById('protectionToggle');
  const urlDisplay = document.getElementById('currentUrl');

  // Obtenir l'onglet actif
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const hostname = new URL(currentTab.url).hostname;
    urlDisplay.textContent = hostname;

    // Charger l'état sauvegardé du toggle pour ce site
    const storageKey = `protectionMode_${hostname}`;
    chrome.storage.local.get([storageKey], function(result) {
      protectionToggle.checked = result[storageKey] || false;
    });

    // Sauvegarder l'état du toggle quand il change
    protectionToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      const saveData = {};
      saveData[storageKey] = isEnabled;
      
      chrome.storage.local.set(saveData, function() {
        console.log(`Mode protection ${isEnabled ? 'activé' : 'désactivé'} pour ${hostname}`);
      });
    });
  });
});