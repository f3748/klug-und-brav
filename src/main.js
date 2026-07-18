const SAVE_KEY = 'klug-und-brav.save.v1';

const STAT_DEFINITIONS = [
  { key: 'satiety', label: '饱腹', className: 'satiety' },
  { key: 'cleanliness', label: '清洁', className: 'cleanliness' },
  { key: 'energy', label: '精力', className: 'energy' },
  { key: 'mood', label: '心情', className: 'mood' },
  { key: 'bond', label: '亲密', className: 'bond' },
];

const ROOMS = {
  living: {
    label: '客厅',
    className: 'living-room',
    furniture: [
      { id: 'sofa', label: '沙发', x: 10, y: 58, w: 23, h: 18, note: '小人安静地坐了一会儿。' },
      { id: 'toybox', label: '玩具箱', x: 70, y: 64, w: 18, h: 16, action: 'play' },
      { id: 'plant', label: '绿植', x: 88, y: 37, w: 8, h: 31, note: '窗边的叶子轻轻晃了晃。' },
    ],
  },
  kitchen: {
    label: '厨房',
    className: 'kitchen',
    furniture: [
      { id: 'fridge', label: '冰箱', x: 8, y: 33, w: 14, h: 36, action: 'feed' },
      { id: 'table', label: '餐桌', x: 42, y: 58, w: 26, h: 14, action: 'feed' },
      { id: 'stove', label: '灶台', x: 76, y: 49, w: 17, h: 20, note: '灶台旁留着一点温暖的香气。' },
    ],
  },
  bedroom: {
    label: '卧室',
    className: 'bedroom',
    furniture: [
      { id: 'bed', label: '床', x: 11, y: 53, w: 34, h: 22, action: 'sleep' },
      { id: 'lamp', label: '小灯', x: 52, y: 42, w: 8, h: 28, note: '小灯把卧室照得软软的。' },
      { id: 'wardrobe', label: '衣柜', x: 78, y: 35, w: 15, h: 35, note: '衣柜里以后可以放小人的衣服。' },
    ],
  },
  bathroom: {
    label: '卫生间',
    className: 'bathroom',
    furniture: [
      { id: 'tub', label: '浴缸', x: 11, y: 57, w: 34, h: 18, action: 'bath' },
      { id: 'sink', label: '洗手池', x: 56, y: 52, w: 15, h: 18, action: 'bath' },
      { id: 'mirror', label: '镜子', x: 58, y: 31, w: 11, h: 15, note: '镜子里映着安静的小屋。' },
    ],
  },
};

const WEATHER_LABELS = {
  sunny: '晴',
  cloudy: '多云',
  rain: '雨',
  snow: '雪',
};

const ACTIONS = {
  feed: {
    animation: 'is-eating',
    narration: '小人认真吃完了一小份饭。',
    deltas: { satiety: 28, cleanliness: -3, energy: 2, mood: 6, bond: 2 },
  },
  bath: {
    animation: 'is-bathing',
    narration: '水汽和泡泡让小人变得清爽了一点。',
    deltas: { satiety: -2, cleanliness: 34, energy: -4, mood: 5, bond: 2 },
  },
  sleep: {
    animation: 'is-sleeping',
    narration: '小人蜷起来，安安静静地睡着了。',
    deltas: { satiety: -7, cleanliness: -2, energy: 32, mood: 4, bond: 1 },
  },
  play: {
    animation: 'is-playing',
    narration: '小小的游戏让房间轻快了一点。',
    deltas: { satiety: -8, cleanliness: -4, energy: -12, mood: 26, bond: 3 },
  },
};

const DEFAULT_SAVE = {
  currentRoom: 'living',
  pets: [
    {
      id: 'pet-countryhuman-placeholder',
      name: '小小住民',
      kind: 'countryhuman',
      stats: {
        satiety: 76,
        cleanliness: 82,
        energy: 70,
        mood: 74,
        bond: 12,
      },
      lastAction: null,
    },
  ],
  activePetId: 'pet-countryhuman-placeholder',
  lastSavedAt: new Date().toISOString(),
  weatherByDate: {},
  storageWarning: false,
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
  if (!window.confirm('要重置这个浏览器里的本地存档吗？')) {
    return;
  }

  safeRemoveSave();
  Object.assign(state, createDefaultSave());
  setNarration('本地存档已重置，小屋重新安静下来。');
  save();
  render();
});

function createDefaultSave() {
  return structuredClone({ ...DEFAULT_SAVE, lastSavedAt: new Date().toISOString() });
}

function getActivePet() {
  const pet = state.pets.find((item) => item.id === state.activePetId);
  return pet ?? state.pets[0];
}

function loadSave() {
  const raw = safeReadSave();
  if (!raw) {
    return createDefaultSave();
  }

  try {
    return sanitizeSave(JSON.parse(raw));
  } catch {
    safeRemoveSave();
    return createDefaultSave();
  }
}

function sanitizeSave(candidate) {
  const fallback = createDefaultSave();
  if (!candidate || typeof candidate !== 'object') {
    return fallback;
  }

  const legacyStats = isPlainObject(candidate.stats) ? candidate.stats : null;
  const candidatePets = Array.isArray(candidate.pets) && candidate.pets.length > 0
    ? candidate.pets
    : [{ ...fallback.pets[0], stats: legacyStats ?? fallback.pets[0].stats }];

  const pets = candidatePets.map((pet, index) => {
    const fallbackPet = fallback.pets[0];
    const id = typeof pet?.id === 'string' && pet.id ? pet.id : `${fallbackPet.id}-${index}`;
    return {
      id,
      name: typeof pet?.name === 'string' && pet.name ? pet.name : fallbackPet.name,
      kind: typeof pet?.kind === 'string' && pet.kind ? pet.kind : fallbackPet.kind,
      stats: sanitizeStats(pet?.stats ?? fallbackPet.stats),
      lastAction: typeof pet?.lastAction === 'string' ? pet.lastAction : null,
    };
  });

  const activePetId = pets.some((pet) => pet.id === candidate.activePetId) ? candidate.activePetId : pets[0].id;
  const currentRoom = Object.hasOwn(ROOMS, candidate.currentRoom) ? candidate.currentRoom : fallback.currentRoom;
  const weatherByDate = isPlainObject(candidate.weatherByDate) ? candidate.weatherByDate : {};
  const lastSavedAt = Number.isFinite(new Date(candidate.lastSavedAt).getTime())
    ? new Date(candidate.lastSavedAt).toISOString()
    : fallback.lastSavedAt;

  return {
    ...fallback,
    currentRoom,
    pets,
    activePetId,
    lastSavedAt,
    weatherByDate,
    storageWarning: false,
  };
}

function sanitizeStats(stats) {
  return Object.fromEntries(STAT_DEFINITIONS.map((stat) => {
    const value = Number(stats?.[stat.key]);
    return [stat.key, Number.isFinite(value) ? clamp(value) : DEFAULT_SAVE.pets[0].stats[stat.key]];
  }));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeReadSave() {
  try {
    return localStorage.getItem(SAVE_KEY);
  } catch {
    return null;
  }
}

function safeWriteSave(serialized) {
  try {
    localStorage.setItem(SAVE_KEY, serialized);
    state.storageWarning = false;
  } catch {
    state.storageWarning = true;
  }
}

function safeRemoveSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    state.storageWarning = true;
  }
}

function save() {
  state.lastSavedAt = new Date().toISOString();
  safeWriteSave(JSON.stringify(state));
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
  const activePet = getActivePet();
  els.statusBars.innerHTML = STAT_DEFINITIONS.map((stat) => {
    const value = clamp(activePet.stats[stat.key]);
    return `
      <article class="status-row ${stat.className}" role="meter" aria-label="${stat.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value)}">
        <div class="status-label">
          <span>${stat.label}</span>
          <strong>${getStatusTone(stat.key, value)}</strong>
        </div>
        <div class="bar-shell" aria-hidden="true"><div class="bar-fill" style="width:${value}%"></div></div>
      </article>
    `;
  }).join('');
}

function getStatusTone(key, value) {
  if (key === 'bond') {
    if (value >= 72) return '信赖';
    if (value >= 42) return '熟悉';
    return '初识';
  }

  if (value >= 72) return '很好';
  if (value >= 42) return '还好';
  return '需要照顾';
}

function renderRoomTabs() {
  els.roomTabs.innerHTML = Object.entries(ROOMS).map(([roomId, room]) => `
    <button type="button" class="room-tab ${roomId === state.currentRoom ? 'is-active' : ''}" data-room="${roomId}" ${roomId === state.currentRoom ? 'aria-current="page"' : ''}>
      ${room.label}
    </button>
  `).join('');

  els.roomTabs.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      state.currentRoom = button.dataset.room;
      setNarration(`视线转到了${ROOMS[state.currentRoom].label}。`);
      render();
    });
  });
}

function renderRoom() {
  const room = ROOMS[state.currentRoom] ?? ROOMS.living;
  state.currentRoom = Object.hasOwn(ROOMS, state.currentRoom) ? state.currentRoom : 'living';
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
    setNarration(item.note ?? '房间里安静了一会儿。');
    return;
  }

  const action = ACTIONS[item.action];
  const activePet = getActivePet();
  applyDeltas(activePet.stats, action.deltas);
  playPetAnimation(action.animation);
  setNarration(action.narration);
  activePet.lastAction = item.action;
  renderStatusBars();
  save();
}

function applyDeltas(stats, deltas) {
  Object.entries(deltas).forEach(([key, delta]) => {
    stats[key] = clamp((stats[key] ?? 0) + delta);
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
  els.narration.textContent = state.storageWarning ? `${text}（本地存档暂时不可用。）` : text;
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
  const activePet = getActivePet();
  applyDeltas(activePet.stats, {
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
  const dateKey = getLocalDateKey(date);
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

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriod(hour) {
  if (hour >= 5 && hour < 9) return { key: 'morning', label: '清晨' };
  if (hour >= 9 && hour < 17) return { key: 'day', label: '白天' };
  if (hour >= 17 && hour < 20) return { key: 'evening', label: '傍晚' };
  return { key: 'night', label: '夜晚' };
}

function getSeason(month) {
  if (month >= 3 && month <= 5) return { key: 'spring', label: '春' };
  if (month >= 6 && month <= 8) return { key: 'summer', label: '夏' };
  if (month >= 9 && month <= 11) return { key: 'autumn', label: '秋' };
  return { key: 'winter', label: '冬' };
}

function getWeatherForDate(dateKey, seasonKey) {
  if (state.weatherByDate[dateKey] && Object.hasOwn(WEATHER_LABELS, state.weatherByDate[dateKey])) {
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
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  return Math.max(0, Math.min(100, numericValue));
}
