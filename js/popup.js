document.addEventListener('DOMContentLoaded', function() {
  const protectionToggle = document.getElementById('protectionToggle');
  const blockLinksToggle = document.getElementById('blockLinksToggle');
  const blockSubmitsToggle = document.getElementById('blockSubmitsToggle');
  const disableCursorToggle = document.getElementById('disableCursorToggle');
  const urlDisplay = document.getElementById('currentUrl');

  // Obtenir l'onglet actif
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const hostname = new URL(currentTab.url).hostname;
    urlDisplay.textContent = hostname;

    // Charger les états sauvegardés
    const protectionKey = `protectionMode_${hostname}`;
    const blockLinksKey = 'blockLinksEnabled'; // Paramètre global
    const blockSubmitsKey = 'blockSubmitsEnabled'; // Paramètre global
    const disableCursorKey = 'disableCursorEnabled'; // Paramètre global

    chrome.storage.local.get([protectionKey, blockLinksKey, blockSubmitsKey, disableCursorKey], function(result) {
      protectionToggle.checked = result[protectionKey] || false;
      // Par défaut à true si non défini
      blockLinksToggle.checked = result[blockLinksKey] === undefined ? true : result[blockLinksKey];
      blockSubmitsToggle.checked = result[blockSubmitsKey] === undefined ? true : result[blockSubmitsKey];
      disableCursorToggle.checked = result[disableCursorKey] || false; // Par défaut à false
    });

    // Sauvegarder l'état du toggle de protection quand il change
    protectionToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      const saveData = {};
      saveData[protectionKey] = isEnabled;
      
      chrome.storage.local.set(saveData, function() {
        console.log(`Mode protection ${isEnabled ? 'activé' : 'désactivé'} pour ${hostname}`);
      });
    });

    // Sauvegarder l'état du toggle de blocage des liens
    blockLinksToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      const saveData = {};
      saveData[blockLinksKey] = isEnabled;
      
      chrome.storage.local.set(saveData, function() {
        console.log(`Blocage des liens ${isEnabled ? 'activé' : 'désactivé'}`);
      });
    });

    // Sauvegarder l'état du toggle de blocage des boutons submit
    blockSubmitsToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      const saveData = {};
      saveData[blockSubmitsKey] = isEnabled;
      
      chrome.storage.local.set(saveData, function() {
        console.log(`Blocage des boutons submit ${isEnabled ? 'activé' : 'désactivé'}`);
      });
    });

    // Sauvegarder l'état du toggle de désactivation du curseur
    disableCursorToggle.addEventListener('change', function() {
      const isEnabled = this.checked;
      const saveData = {};
      saveData[disableCursorKey] = isEnabled;
      
      chrome.storage.local.set(saveData, function() {
        console.log(`Désactivation du curseur ${isEnabled ? 'activée' : 'désactivée'}`);
      });
    });
  });
});