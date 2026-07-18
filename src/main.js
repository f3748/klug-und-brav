const SAVE_KEY = 'klug-und-brav.save.v1';

const STAT_DEFINITIONS = [
  { key: 'satiety', label: 'Satiety', className: 'satiety' },
  { key: 'cleanliness', label: 'Cleanliness', className: 'cleanliness' },
  { key: 'energy', label: 'Energy', className: 'energy' },
  { key: 'mood', label: 'Mood', className: 'mood' },
  { key: 'bond', label: 'Bond', className: 'bond' },
];

const ROOMS = {
  living: {
    label: 'Living Room',
    className: 'living-room',
    furniture: [
      { id: 'sofa', label: 'Sofa', x: 10, y: 58, w: 23, h: 18, note: 'The little one sits quietly for a moment.' },
      { id: 'toybox', label: 'Toy Box', x: 70, y: 64, w: 18, h: 16, action: 'play' },
      { id: 'plant', label: 'Plant', x: 88, y: 37, w: 8, h: 31, note: 'Leaves move softly by the window.' },
    ],
  },
  kitchen: {
    label: 'Kitchen',
    className: 'kitchen',
    furniture: [
      { id: 'fridge', label: 'Fridge', x: 8, y: 33, w: 14, h: 36, action: 'feed' },
      { id: 'table', label: 'Table', x: 42, y: 58, w: 26, h: 14, action: 'feed' },
      { id: 'stove', label: 'Stove', x: 76, y: 49, w: 17, h: 20, note: 'Something warm could be made here later.' },
    ],
  },
  bedroom: {
    label: 'Bedroom',
    className: 'bedroom',
    furniture: [
      { id: 'bed', label: 'Bed', x: 11, y: 53, w: 34, h: 22, action: 'sleep' },
      { id: 'lamp', label: 'Lamp', x: 52, y: 42, w: 8, h: 28, note: 'The lamp makes the room feel softer.' },
      { id: 'wardrobe', label: 'Wardrobe', x: 78, y: 35, w: 15, h: 35, note: 'Outfits can live here later.' },
    ],
  },
  bathroom: {
    label: 'Bathroom',
    className: 'bathroom',
    furniture: [
      { id: 'tub', label: 'Tub', x: 11, y: 57, w: 34, h: 18, action: 'bath' },
      { id: 'sink', label: 'Sink', x: 56, y: 52, w: 15, h: 18, action: 'bath' },
      { id: 'mirror', label: 'Mirror', x: 58, y: 31, w: 11, h: 15, note: 'The mirror is still and bright.' },
    ],
  },
};

const WEATHER_LABELS = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rain: 'Rain',
  snow: 'Snow',
};

const ACTIONS = {
  feed: {
    animation: 'is-eating',
    narration: 'A small meal makes the room feel warmer.',
    deltas: { satiety: 28, cleanliness: -3, energy: 2, mood: 6, bond: 2 },
  },
  bath: {
    animation: 'is-bathing',
    narration: 'Fresh water and bubbles restore a clean feeling.',
    deltas: { satiety: -2, cleanliness: 34, energy: -4, mood: 5, bond: 2 },
  },
  sleep: {
    animation: 'is-sleeping',
    narration: 'The little one curls up and rests quietly.',
    deltas: { satiety: -7, cleanliness: -2, energy: 32, mood: 4, bond: 1 },
  },
  play: {
    animation: 'is-playing',
    narration: 'A short game lifts the mood without making too much noise.',
    deltas: { satiety: -8, cleanliness: -4, energy: -12, mood: 26, bond: 3 },
  },
};

const DEFAULT_SAVE = {
  currentRoom: 'living',
  stats: {
    satiety: 76,
    cleanliness: 82,
    energy: 70,
    mood: 74,
    bond: 12,
  },
  lastSavedAt: new Date().toISOString(),
  weatherByDate: {},
  lastAction: null,
};

const state = loadSave();
const els = {
  statusBars: document.querySelector('#status-bars'),
  roomTabs: document.querySelector('#room-tabs'),
  roomScene: document.querySelector('#room-scene'),
  roomTitle: document.querySelector('#room-title'),
  pet: document.querySelector('#pet'),
  narration: document.querySelector('#narration'),
  worldChip: document.querySelector('#world-chip'),
  windowView: document.querySelector('#window-view'),
  weatherLayer: document.querySelector('#weather-layer'),
  interactionNote: document.querySelector('#interaction-note'),
  resetSave: document.querySelector('#reset-save'),
};

applyOfflineDecay();
render();

els.resetSave.addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  Object.assign(state, structuredClone(DEFAULT_SAVE), { lastSavedAt: new Date().toISOString() });
  setNarration('The local save has been reset. The room becomes quiet again.');
  save();
  render();
});

function loadSave() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return structuredClone(DEFAULT_SAVE);
  }

  try {
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...JSON.parse(raw),
      stats: {
        ...DEFAULT_SAVE.stats,
        ...JSON.parse(raw).stats,
      },
    };
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

function save() {
  state.lastSavedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function render() {
  const world = getWorldState(new Date());
  renderWorld(world);
  renderStatusBars();
  renderRoomTabs();
  renderRoom();
  save();
}

function renderWorld(world) {
  els.worldChip.textContent = `${world.period} · ${world.season} · ${world.weather}`;
  els.roomScene.dataset.period = world.periodKey;
  els.windowView.dataset.season = world.seasonKey;
  els.weatherLayer.dataset.weather = world.weatherKey;
}

function renderStatusBars() {
  els.statusBars.innerHTML = STAT_DEFINITIONS.map((stat) => {
    const value = clamp(state.stats[stat.key]);
    return `
      <article class="status-row ${stat.className}">
        <div class="status-label">
          <span>${stat.label}</span>
          <strong>${Math.round(value)}%</strong>
        </div>
        <div class="bar-shell" aria-hidden="true"><div class="bar-fill" style="width:${value}%"></div></div>
      </article>
    `;
  }).join('');
}

function renderRoomTabs() {
  els.roomTabs.innerHTML = Object.entries(ROOMS).map(([roomId, room]) => `
    <button type="button" class="room-tab ${roomId === state.currentRoom ? 'is-active' : ''}" data-room="${roomId}">
      ${room.label}
    </button>
  `).join('');

  els.roomTabs.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentRoom = button.dataset.room;
      setNarration(`The view moves to the ${ROOMS[state.currentRoom].label.toLowerCase()}.`);
      render();
    });
  });
}

function renderRoom() {
  const room = ROOMS[state.currentRoom];
  els.roomTitle.textContent = room.label;
  els.roomScene.className = `room-scene ${room.className}`;
  els.roomScene.querySelectorAll('.furniture').forEach((node) => node.remove());

  room.furniture.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `furniture furniture-${item.id}`;
    button.style.left = `${item.x}%`;
    button.style.top = `${item.y}%`;
    button.style.width = `${item.w}%`;
    button.style.height = `${item.h}%`;
    button.textContent = item.label;
    button.addEventListener('click', () => handleFurnitureClick(item));
    els.roomScene.append(button);
  });
}

function handleFurnitureClick(item) {
  if (!item.action) {
    setNarration(item.note ?? 'The room stays quiet.');
    return;
  }

  const action = ACTIONS[item.action];
  applyDeltas(action.deltas);
  playPetAnimation(action.animation);
  setNarration(action.narration);
  state.lastAction = item.action;
  renderStatusBars();
  save();
}

function applyDeltas(deltas) {
  Object.entries(deltas).forEach(([key, delta]) => {
    state.stats[key] = clamp((state.stats[key] ?? 0) + delta);
  });
}

function playPetAnimation(className) {
  els.pet.classList.remove('is-eating', 'is-bathing', 'is-sleeping', 'is-playing');
  els.pet.classList.add(className);
  window.setTimeout(() => {
    els.pet.classList.remove(className);
  }, 1400);
}

function setNarration(text) {
  els.narration.textContent = text;
}

function applyOfflineDecay() {
  const lastSaved = new Date(state.lastSavedAt).getTime();
  if (!Number.isFinite(lastSaved)) {
    return;
  }

  const hoursAway = Math.max(0, (Date.now() - lastSaved) / 36e5);
  if (hoursAway < 0.2) {
    return;
  }

  const cappedHours = Math.min(hoursAway, 72);
  applyDeltas({
    satiety: -0.9 * cappedHours,
    cleanliness: -0.45 * cappedHours,
    energy: getWorldState(new Date()).periodKey === 'night' ? 0.4 * cappedHours : -0.25 * cappedHours,
    mood: -0.2 * cappedHours,
    bond: 0,
  });
}

function getWorldState(date) {
  const hour = date.getHours();
  const month = date.getMonth() + 1;
  const dateKey = date.toISOString().slice(0, 10);
  const season = getSeason(month);
  const weatherKey = getWeatherForDate(dateKey, season.key);

  if (!state.weatherByDate[dateKey]) {
    state.weatherByDate[dateKey] = weatherKey;
  }

  return {
    periodKey: getPeriod(hour).key,
    period: getPeriod(hour).label,
    seasonKey: season.key,
    season: season.label,
    weatherKey,
    weather: WEATHER_LABELS[weatherKey],
  };
}

function getPeriod(hour) {
  if (hour >= 5 && hour < 9) return { key: 'morning', label: 'Morning' };
  if (hour >= 9 && hour < 17) return { key: 'day', label: 'Day' };
  if (hour >= 17 && hour < 20) return { key: 'evening', label: 'Evening' };
  return { key: 'night', label: 'Night' };
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return { key: 'spring', label: 'Spring' };
  if (month >= 6 && month <= 8) return { key: 'summer', label: 'Summer' };
  if (month >= 9 && month <= 11) return { key: 'autumn', label: 'Autumn' };
  return { key: 'winter', label: 'Winter' };
}

function getWeatherForDate(dateKey, seasonKey) {
  if (state.weatherByDate[dateKey]) {
    return state.weatherByDate[dateKey];
  }

  const roll = seededRoll(`${dateKey}-${seasonKey}`);
  if (seasonKey === 'winter') {
    if (roll < 0.24) return 'snow';
    if (roll < 0.48) return 'cloudy';
    return 'sunny';
  }
  if (seasonKey === 'spring') {
    if (roll < 0.35) return 'rain';
    if (roll < 0.62) return 'cloudy';
    return 'sunny';
  }
  if (seasonKey === 'autumn') {
    if (roll < 0.24) return 'rain';
    if (roll < 0.55) return 'cloudy';
    return 'sunny';
  }
  if (roll < 0.18) return 'rain';
  if (roll < 0.35) return 'cloudy';
  return 'sunny';
}

function seededRoll(input) {
  let hash = 0;
  for (const char of input) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}
