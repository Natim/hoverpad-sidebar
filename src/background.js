/**
 * Google Analytics / TestPilot Metrics
 */
const TRACKING_ID = 'UA-35433268-79';

const KINTO_SERVER = 'https://kinto.dev.mozaws.net/v1';
// XXX: Read this from Kinto fxa-params
const FXA_CLIENT_ID = 'c6d74070a481bc10';
const FXA_OAUTH_SERVER = 'https://oauth-scoped-keys-oct10.dev.lcip.org/v1';

const timeouts = {};

// Kinto sync and encryption

const client = new Kinto({remote: KINTO_SERVER, bucket: 'default'});

// Analytics

const analytics = new TestPilotGA({
  tid: TRACKING_ID,
  ds: 'addon',
  an: 'Notes Experiment',
  aid: 'notes@mozilla.com',
  av: '2.0.0dev'  // XXX: Change version on release
});

function sendMetrics(event, context = {}) {
  // This function debounce sending metrics.
  const later = function() {
    timeouts[event] = null;

    return analytics.sendEvent('notes', event, {
      cm1: context.characters,
      cm2: context.lineBreaks,
      cm3: null,  // Size of the change
      cd1: context.syncEnabled,
      cd2: context.usesSize,
      cd3: context.usesBold,
      cd4: context.usesItalics,
      cd5: context.usesStrikethrough,
      cd6: context.usesList,
      cd7: null, // Firefox UI used to open, close notepad
      cd8: null, // reason editing session ended
    });
  };
  clearTimeout(timeouts[event]);
  timeouts[event] = setTimeout(later, 20000);
}

function authenticate() {
  const fxaKeysUtil = new fxaCryptoRelier.OAuthUtils({
    oauthServer: FXA_OAUTH_SERVER
  });
    chrome.runtime.sendMessage({
      action: 'sync-opening'
    });
  fxaKeysUtil.launchFxaScopedKeyFlow({
    client_id: FXA_CLIENT_ID,
    pkce: true,
    redirect_uri: browser.identity.getRedirectURL(),
    scopes: ['profile', 'https://identity.mozilla.org/apps/notes'],
  }).then((loginDetails) => {
    // FIXME: https://github.com/vladikoff/fxa-crypto-relier/issues/8
    let key = loginDetails.keys['https://identity.mozilla.org/apps/notes'];
    if (key.hasOwnProperty('https://identity.mozilla.org/apps/notes')) {
      key = key['https://identity.mozilla.org/apps/notes'];
    }
    const credentials = {
      access_token: loginDetails.access_token,
      refresh_token: loginDetails.refresh_token,
      key
    };
    console.log('Login succeeded', credentials);
    browser.storage.local.set({credentials}).then(() => {
      chrome.runtime.sendMessage({
        action: 'sync-authenticated',
        credentials
      });
    });
  }, (err) => {
    console.error('login failed', err);
    chrome.runtime.sendMessage({
      action: 'authenticated',
      err: err
    });
    throw err;
  });
}
browser.runtime.onMessage.addListener(function(eventData) {
  const credentials = new BrowserStorageCredentials(browser.storage.local);
  switch (eventData.action) {
    case 'authenticate':
      credentials.get()
        .then(result => {
          if (!result) {
            sendMetrics('webext-button-authenticate', eventData.context);
            authenticate();
          } else {
            chrome.runtime.sendMessage({
              action: 'text-syncing'
            });
            loadFromKinto(client, credentials);
          }
        });
      break;
    case 'disconnected':
      sendMetrics('webext-button-disconnect', eventData.context);
      credentials.clear();
      break;
    case 'kinto-load':
      loadFromKinto(client, credentials);
      break;
    case 'kinto-save':
      saveToKinto(client, credentials, eventData.content);
      break;
    case 'metrics-changed':
      sendMetrics('changed', eventData.context);
      break;
    case 'metrics-drag-n-drop':
      sendMetrics('drag-n-drop', eventData.context);
      break;
    case 'theme-changed':
      sendMetrics('theme-changed', eventData.content);
      browser.runtime.sendMessage({
        action: 'theme-changed'
      });
      break;
    case 'link-clicked':
      sendMetrics('link-clicked', eventData.content);
      break;
  }
});


// Handle opening and closing the add-on.
function connected(p) {
  sendMetrics('open');

  p.onDisconnect.addListener(() => {
    sendMetrics('close');
  });
}
browser.runtime.onConnect.addListener(connected);


const defaultTheme = {
  theme: 'default'
};

browser.storage.local.get()
  .then((storedSettings) => {
    // if no theme setting exists...
    if (!storedSettings.theme)
      // set defaultTheme as initial theme in local storage
      browser.storage.local.set(defaultTheme);
});
