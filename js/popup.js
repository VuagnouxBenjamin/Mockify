// Fonction pour formater la date
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Gestion du dropdown des paramètres
  const settingsBtn = document.querySelector('.settings-dropdown-btn');
  const settingsContent = document.querySelector('.settings-content');

  settingsBtn.addEventListener('click', function() {
    this.classList.toggle('active');
    settingsContent.classList.toggle('active');
  });
  const protectionToggle = document.getElementById('protectionToggle');
  const blockLinksToggle = document.getElementById('blockLinksToggle');
  const blockSubmitsToggle = document.getElementById('blockSubmitsToggle');
  const disableCursorToggle = document.getElementById('disableCursorToggle');
  const urlDisplay = document.getElementById('currentUrl');

  // Obtenir l'onglet actif
  // Fonction pour mettre à jour la liste des snapshots
  function updateSnapshotsList(currentUrl) {
    const snapshotsList = document.getElementById('snapshotsList');
    const noSnapshots = document.getElementById('noSnapshots');

    chrome.storage.local.get(['snapshots'], function(result) {
      const snapshots = result.snapshots || {};
      const urlSnapshots = snapshots[currentUrl] || [];

      if (urlSnapshots.length === 0) {
        noSnapshots.style.display = 'block';
        snapshotsList.style.display = 'none';
        return;
      }

      noSnapshots.style.display = 'none';
      snapshotsList.style.display = 'block';
      snapshotsList.innerHTML = '';

      urlSnapshots.forEach((snapshot, index) => {
        const li = document.createElement('li');
        li.className = 'snapshot-item';
        li.innerHTML = `
          <div class="snapshot-info">
            <div class="snapshot-name">${snapshot.name}</div>
            <div class="snapshot-date">${formatDate(snapshot.timestamp)}</div>
          </div>
          <div class="snapshot-actions">
            <button class="snapshot-action-btn snapshot-restore" data-index="${index}">Restaurer</button>
            <button class="snapshot-action-btn snapshot-delete" data-index="${index}" title="Supprimer">
              <img src="icons/delete.png" alt="Supprimer" class="delete-icon">
            </button>
          </div>
        `;

        // Gestionnaire pour le bouton restaurer
        li.querySelector('.snapshot-restore').addEventListener('click', function() {
          const index = parseInt(this.dataset.index);
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'restoreSnapshot',
              snapshot: urlSnapshots[index]
            }, function(response) {
              if (response && response.success) {
                window.close(); // Fermer le popup après la restauration
              }
            });
          });
        });

        // Gestionnaire pour le bouton supprimer
        li.querySelector('.snapshot-delete').addEventListener('click', function() {
          const index = parseInt(this.dataset.index);
          urlSnapshots.splice(index, 1);
          if (urlSnapshots.length === 0) {
            delete snapshots[currentUrl];
          } else {
            snapshots[currentUrl] = urlSnapshots;
          }
          chrome.storage.local.set({ snapshots: snapshots }, function() {
            updateSnapshotsList(currentUrl);
          });
        });

        snapshotsList.appendChild(li);
      });
    });
  }

  // Gestion des snapshots
  const createSnapshotBtn = document.getElementById('createSnapshot');

  const snapshotNameInput = document.getElementById('snapshotName');

  // Fonction pour générer un nom par défaut
  function generateDefaultSnapshotName(currentUrl) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['snapshots'], function(result) {
        const snapshots = result.snapshots || {};
        const urlSnapshots = snapshots[currentUrl] || [];
        
        // Trouver le plus grand numéro utilisé
        let maxNumber = 0;
        urlSnapshots.forEach(snapshot => {
          const match = snapshot.name.match(/^Mockup (\d+)$/);
          if (match) {
            const number = parseInt(match[1]);
            maxNumber = Math.max(maxNumber, number);
          }
        });
        
        resolve(`Mockup ${maxNumber + 1}`);
      });
    });
  }

  // Fonction pour mettre à jour le nom par défaut
  function updateDefaultSnapshotName(currentUrl) {
    generateDefaultSnapshotName(currentUrl).then(name => {
      snapshotNameInput.value = name;
    });
  }

  createSnapshotBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const snapshotName = snapshotNameInput.value.trim();
      
      if (!snapshotName) {
        generateDefaultSnapshotName(currentTab.url).then(defaultName => {
          createSnapshot(currentTab, defaultName);
        });
      } else {
        createSnapshot(currentTab, snapshotName);
      }
    });
  });

  function createSnapshot(tab, name) {
    chrome.tabs.sendMessage(tab.id, { 
      action: 'createSnapshot',
      name: name
    }, function(response) {
      if (response) {
        // Récupérer les snapshots existants
        chrome.storage.local.get(['snapshots'], function(result) {
          const snapshots = result.snapshots || {};
          if (!snapshots[tab.url]) {
            snapshots[tab.url] = [];
          }
          
          // Ajouter le nouveau snapshot
          snapshots[tab.url].push(response);
          
          // Sauvegarder dans le stockage local
          chrome.storage.local.set({ snapshots: snapshots }, function() {
            // Réinitialiser le champ avec un nouveau nom par défaut
            updateDefaultSnapshotName(tab.url);
            updateSnapshotsList(tab.url);
          });
        });
      }
    });
  }

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const currentUrl = new URL(currentTab.url).href;
    const hostname = new URL(currentTab.url).hostname;
    urlDisplay.textContent = hostname;
    
    // Initialiser le nom par défaut au chargement
    updateDefaultSnapshotName(currentUrl);

    // Charger la liste des snapshots au démarrage
    updateSnapshotsList(currentUrl);

    // Charger les états sauvegardés
    const protectionKey = `protectionMode_${currentUrl}`;
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