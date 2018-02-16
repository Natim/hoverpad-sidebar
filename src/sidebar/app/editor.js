
// const UI_LANG = browser.i18n.getUILanguage();
// const RTL_LANGS = ['ar', 'fa', 'he'];
// const LANG_DIR = RTL_LANGS.includes(UI_LANG) ? 'rtl' : 'ltr';
// const TEXT_ALIGN_DIR = LANG_DIR === 'rtl' ? 'right' : 'left';

function customizeEditor(editor) {
  const mainEditor = document.querySelector('.ck-editor__main');

  // Disable right clicks
  // Refs: https://stackoverflow.com/a/737043/186202
  document.querySelectorAll('.ck-toolbar, #footer-buttons').forEach(sel => {
    sel.addEventListener('contextmenu', e => {
      e.preventDefault();
    });
  });

  // Fixes an issue with CKEditor and keeping multiple Firefox windows in sync
  // Ref: https://github.com/mozilla/notes/issues/424
  document
    .querySelectorAll('.ck-heading-dropdown .ck-list__item')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        editor.fire('changesDone');
      });
    });

  document.addEventListener('dragover', () => {
    mainEditor.classList.add('drag-n-drop-focus');
  });

  document.addEventListener('dragleave', () => {
    mainEditor.classList.remove('drag-n-drop-focus');
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.originalEvent.dataTransfer.items[0].getAsString(function(content) {
      insertSelectedText(editor, content);
    });
    mainEditor.classList.remove('drag-n-drop-focus');
    browser.runtime.sendMessage({
      action: 'metrics-drag-n-drop',
      context: getPadStats(editor)
    });
  });

  localizeEditorButtons();
}

function insertSelectedText(editor, selectedText) {
  const currentNotesContent = editor.getData();
  const updatedNotesContent = currentNotesContent + `<p>${selectedText.replace(/\n\n/g, '</p><p>')}</p>`;
  editor.setData(updatedNotesContent);
  browser.runtime.sendMessage({
    action: 'metrics-context-menu'
  });
}


function localizeEditorButtons() {
  // Clear CKEditor tooltips. Fixes: https://github.com/mozilla/notes/issues/410
  document.querySelectorAll('.ck-toolbar .ck-tooltip__text').forEach(sel => {
    sel.remove();
  });

  let userOSKey;

  if (navigator.appVersion.indexOf('Mac') !== -1) userOSKey = '⌘';
  else userOSKey = 'Ctrl';

  const size = document.querySelector('button.ck-button:nth-child(1)'),
    // Need to target buttons by index. Ref: https://github.com/ckeditor/ckeditor5-basic-styles/issues/59
    bold = document.querySelector('button.ck-button:nth-child(2)'),
    italic = document.querySelector('button.ck-button:nth-child(3)'),
    strike = document.querySelector('button.ck-button:nth-child(4)'),
    bullet = document.querySelector('button.ck-button:nth-child(5)'),
    ordered = document.querySelector('button.ck-button:nth-child(6)');

  // Setting button titles in place of tooltips
  size.title = browser.i18n.getMessage('fontSizeTitle');
  bold.title = browser.i18n.getMessage('boldTitle') + ' (' + userOSKey + '+B)';
  italic.title =
    browser.i18n.getMessage('italicTitle') + ' (' + userOSKey + '+I)';
  strike.title = browser.i18n.getMessage('strikethroughTitle');
  ordered.title = browser.i18n.getMessage('numberedListTitle');
  bullet.title = browser.i18n.getMessage('bulletedListTitle');
}

function getPadStats(editor) {
  const text = editor.getData();

  const styles = {
    size: false,
    bold: false,
    italic: false,
    strike: false,
    list: false,
    list_bulleted: false,
    list_numbered: false
  };

  const range = ClassicEditor.imports.range.createIn(editor.document.getRoot());

  for (const value of range) {
    if (value.type === 'text') {
      // Bold
      if (value.item.textNode._attrs.get('bold')) {
        styles.bold = true;
      }
      // Italic
      if (value.item.textNode._attrs.get('italic')) {
        styles.italic = true;
      }
      // Strikethrough
      if (value.item.textNode._attrs.get('strike')) {
        styles.strike = true;
      }
    }

    if (value.type === 'elementStart') {
      // Size
      if (value.item.name.indexOf('heading') === 0) {
        styles.size = true;
      }

      // List
      if (value.item.name === 'listItem') {
        styles.list = true;
        if (value.item._attrs.get('type') === 'bulleted') {
          styles.list_bulleted = true;
        } else if (value.item._attrs.get('type') === 'numbered') {
          styles.list_numbered = true;
        }
      }
    }
  }

  return {
    syncEnabled: false,
    characters: text.length,
    lineBreaks: (text.match(/\n/g) || []).length,
    usesSize: styles.size,
    usesBold: styles.bold,
    usesItalics: styles.italic,
    usesStrikethrough: styles.strike,
    usesList: styles.list
  };
}

export { customizeEditor, getPadStats, insertSelectedText };
