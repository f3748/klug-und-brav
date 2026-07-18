import { readFileSync } from 'node:fs';
import { Script, createContext } from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const js = readFileSync('src/main.js', 'utf8');
const css = readFileSync('src/styles.css', 'utf8');

const requiredHtml = ['id="status-bars"', 'id="mini-map"', 'id="room-scene"', 'id="narration"', 'prototype-note'];
const requiredJs = ['localStorage', 'sanitizeSave', 'safeReadSave', 'safeWriteSave', 'getLocalDateKey', 'pets', 'actionHistory', 'personality', 'visualAnchor', 'renderPetState', 'renderActionState', 'movePetTo', 'derivePetMoodState', 'currentAction', 'lastVisitedAt', 'renderMiniMap', 'switchRoom', 'aria-valuenow'];
const requiredCss = ['.status-card', '.room-scene', '.furniture', '.pet', 'data-weather', '.prototype-note', 'data-hungry', 'data-action', 'data-mood-state', '.mini-map', '.map-room'];

for (const [name, text, needles] of [
  ['index.html', html, requiredHtml],
  ['src/main.js', js, requiredJs],
  ['src/styles.css', css, requiredCss],
]) {
  for (const needle of needles) {
    assert(text.includes(needle), `${name} missing ${needle}`);
  }
}

assert(!/(https?:)?\/\//.test(html + js + css), 'prototype should not load external URLs');

runWithStorage(null, 'empty storage renders defaults');
runWithStorage('{bad json', 'corrupt storage falls back');
runWithStorage(JSON.stringify({ currentRoom: 'attic', stats: { satiety: 'bad' }, weatherByDate: null }), 'invalid save is sanitized');
runWithStorage(JSON.stringify({ currentRoom: 'kitchen', pets: [{ id: 'x', stats: { satiety: 999, cleanliness: -50, energy: 'NaN', mood: 42, bond: 8 } }] }), 'partial pet save is sanitized');
runWithStorage(null, 'blocked storage still renders', { throwStorage: true });

console.log('Prototype checks passed.');

function runWithStorage(initialValue, label, options = {}) {
  const document = createDocument();
  const storage = createStorage(initialValue, options.throwStorage);
  const context = createContext({
    console,
    document,
    localStorage: storage,
    window: {
      setTimeout: () => {},
      setInterval: () => {},
      confirm: () => true,
    },
    Date,
    structuredClone,
    setTimeout: () => {},
    setInterval: () => {},
  });
  context.window.window = context.window;
  context.window.document = document;
  context.window.localStorage = storage;

  new Script(js, { filename: 'src/main.js' }).runInContext(context);

  assert(document.byId['world-chip'].textContent !== '正在整理小屋...', `${label}: world not rendered`);
  assert(document.queries['.map-room']?.length === 4, `${label}: mini map rooms missing`);
  assert(document.queries['.status-row']?.length === 5, `${label}: status rows missing`);
  assert(document.queries['.furniture']?.length >= 3, `${label}: furniture missing`);
}

function createDocument() {
  const queries = {};
  const byId = Object.fromEntries(['status-bars', 'mini-map', 'room-scene', 'room-title', 'pet', 'narration', 'world-chip', 'window-view', 'weather-layer', 'interaction-note', 'reset-save'].map((id) => [id, createElement(id, queries)]));

  return {
    byId,
    queries,
    querySelector(selector) {
      if (selector.startsWith('#')) {
        return byId[selector.slice(1)];
      }
      return null;
    },
    createElement() {
      return createElement('', queries);
    },
  };
}

function createElement(id = '', queries = {}) {
  let innerHTML = '';
  const element = {
    id,
    dataset: {},
    style: {},
    className: '',
    textContent: '',
    classList: {
      add: () => {},
      remove: () => {},
    },
    append(child) {
      const classNames = String(child.className || '').split(/\s+/).filter(Boolean);
      for (const className of classNames) {
        const selector = `.${className}`;
        queries[selector] ??= [];
        queries[selector].push(child);
      }
    },
    addEventListener() {},
    remove() {},
    querySelectorAll(selector) {
      return queries[selector] ?? [];
    },
    set innerHTML(value) {
      innerHTML = value;
      registerGeneratedNodes(value, queries);
    },
    get innerHTML() {
      return innerHTML;
    },
  };
  return element;
}

function registerGeneratedNodes(htmlText, queries) {
  if (htmlText.includes('map-room')) {
    queries['.map-room'] = Array.from({ length: count(htmlText, 'class="map-room') }, (_, index) => ({ dataset: { room: ['living', 'kitchen', 'bedroom', 'bathroom'][index] }, addEventListener() {} }));
  }
  if (htmlText.includes('status-row')) {
    queries['.status-row'] = Array.from({ length: count(htmlText, 'status-row') }, () => ({}));
  }
}

function createStorage(initialValue, shouldThrow) {
  let value = initialValue;
  return {
    getItem() {
      if (shouldThrow) throw new Error('storage blocked');
      return value;
    },
    setItem(_key, nextValue) {
      if (shouldThrow) throw new Error('storage blocked');
      value = nextValue;
    },
    removeItem() {
      if (shouldThrow) throw new Error('storage blocked');
      value = null;
    },
  };
}

function count(text, needle) {
  return text.split(needle).length - 1;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
