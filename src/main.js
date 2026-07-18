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
      { id: 'sofa', label: '沙发', x: 10, y: 58, w: 23, h: 18, note: '{name}安静地坐了一会儿。' },
      { id: 'toybox', label: '玩具箱', x: 70, y: 64, w: 18, h: 16, action: 'play', petX: 66, petY: 57 },
      { id: 'plant', label: '绿植', x: 88, y: 37, w: 8, h: 31, note: '窗边的叶子轻轻晃了晃。' },
      { id: 'rug', label: '地毯', x: 40, y: 72, w: 18, h: 9, note: '地毯让脚步声变轻了。' },
      { id: 'door', label: '门', x: 58, y: 42, w: 7, h: 24, travel: true, note: '门后通向小屋里的其他房间。' },
    ],
  },
  kitchen: {
    label: '厨房',
    className: 'kitchen',
    furniture: [
      { id: 'fridge', label: '冰箱', x: 8, y: 33, w: 14, h: 36, action: 'feed', petX: 27, petY: 54 },
      { id: 'door', label: '门', x: 90, y: 42, w: 7, h: 24, travel: true, note: '门后通向小屋里的其他房间。' },
      { id: 'table', label: '餐桌', x: 42, y: 58, w: 26, h: 14, action: 'feed', petX: 52, petY: 51 },
      { id: 'stove', label: '灶台', x: 76, y: 49, w: 17, h: 20, note: '灶台旁留着一点温暖的香气。' },
      { id: 'dish', label: '餐盘', x: 52, y: 52, w: 8, h: 6, action: 'feed', petX: 52, petY: 50 },
    ],
  },
  bedroom: {
    label: '卧室',
    className: 'bedroom',
    furniture: [
      { id: 'bed', label: '床', x: 11, y: 53, w: 34, h: 22, action: 'sleep', petX: 31, petY: 49 },
      { id: 'lamp', label: '小灯', x: 52, y: 42, w: 8, h: 28, note: '小灯把卧室照得软软的。' },
      { id: 'wardrobe', label: '衣柜', x: 78, y: 35, w: 15, h: 35, note: '衣柜里以后可以放角色的衣服。' },
      { id: 'nightstand', label: '床头柜', x: 47, y: 58, w: 9, h: 12, note: '床头柜上放着一盏小小的灯影。' },
      { id: 'door', label: '门', x: 90, y: 42, w: 7, h: 24, travel: true, note: '门后通向小屋里的其他房间。' },
    ],
  },
  bathroom: {
    label: '卫生间',
    className: 'bathroom',
    furniture: [
      { id: 'tub', label: '浴缸', x: 11, y: 57, w: 34, h: 18, action: 'bath', petX: 35, petY: 53 },
      { id: 'sink', label: '洗手池', x: 56, y: 52, w: 15, h: 18, action: 'bath', petX: 52, petY: 51 },
      { id: 'mirror', label: '镜子', x: 58, y: 31, w: 11, h: 15, note: '镜子里映着安静的小屋。' },
      { id: 'towel', label: '毛巾', x: 78, y: 36, w: 9, h: 18, note: '柔软的毛巾挂在墙边。' },
      { id: 'door', label: '门', x: 90, y: 42, w: 7, h: 24, travel: true, note: '门后通向小屋里的其他房间。' },
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
    duration: 1800,
    narration: '{name}认真吃完了一小份饭。',
    deltas: { satiety: 28, cleanliness: -3, energy: 2, mood: 6, bond: 2 },
  },
  bath: {
    animation: 'is-bathing',
    duration: 1900,
    narration: '水汽和泡泡让{name}变得清爽了一点。',
    deltas: { satiety: -2, cleanliness: 34, energy: -4, mood: 5, bond: 2 },
  },
  sleep: {
    animation: 'is-sleeping',
    duration: 2100,
    narration: '{name}蜷起来，安安静静地睡着了。',
    deltas: { satiety: -7, cleanliness: -2, energy: 32, mood: 4, bond: 1 },
  },
  play: {
    animation: 'is-playing',
    duration: 1700,
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
      currentRoom: 'living',
      currentAction: null,
      actionState: 'idle',
      lastAction: null,
      actionHistory: [],
      personality: {
        keywords: ['安静', '温和', '占位'],
        expressionStyle: '用动作和状态表达，不直接说话',
      },
      likes: {
        rooms: ['客厅'],
        interactions: ['play'],
      },
      visualAnchor: '国家拟人角色占位；最终国家、配色和符号待确认',
    },
  ],
  activePetId: 'pet-countryhuman-placeholder',
  lastSavedAt: new Date().toISOString(),
  lastVisitedAt: new Date().toISOString(),
  weatherByDate: {},
  storageWarning: false,
  currentAction: null,
};

const state = loadSave();
const els = {
  statusBars: document.querySelector('#status-bars'),
  miniMap: document.querySelector('#mini-map'),
  mapOverlay: document.querySelector('#map-overlay'),
  largeMap: document.querySelector('#large-map'),
  mapClose: document.querySelector('#map-close'),
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
markVisitedAndSave();
window.setInterval(refreshWorldIfNeeded, 60000);

els.miniMap.addEventListener('click', openMap);
els.mapClose.addEventListener('click', closeMap);
els.mapOverlay.addEventListener('click', (event) => {
  if (event.target === els.mapOverlay) {
    closeMap();
  }
});

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


function getPetDisplayName() {
  return getActivePet().name || '角色';
}

function toPetText(text) {
  return text.replaceAll('{name}', getPetDisplayName());
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
      currentRoom: Object.hasOwn(ROOMS, pet?.currentRoom) ? pet.currentRoom : currentRoomForCandidate(candidate),
      currentAction: isPlainObject(pet?.currentAction) ? pet.currentAction : null,
      actionState: typeof pet?.actionState === 'string' ? pet.actionState : 'idle',
      stats: sanitizeStats(pet?.stats ?? fallbackPet.stats),
      lastAction: typeof pet?.lastAction === 'string' ? pet.lastAction : null,
      actionHistory: sanitizeActionHistory(pet?.actionHistory),
      personality: isPlainObject(pet?.personality) ? pet.personality : fallbackPet.personality,
      likes: isPlainObject(pet?.likes) ? pet.likes : fallbackPet.likes,
      visualAnchor: typeof pet?.visualAnchor === 'string' ? pet.visualAnchor : fallbackPet.visualAnchor,
    };
  });

  const activePetId = pets.some((pet) => pet.id === candidate.activePetId) ? candidate.activePetId : pets[0].id;
  const currentRoom = Object.hasOwn(ROOMS, candidate.currentRoom) ? candidate.currentRoom : fallback.currentRoom;
  const weatherByDate = isPlainObject(candidate.weatherByDate) ? candidate.weatherByDate : {};
  const lastSavedAt = Number.isFinite(new Date(candidate.lastSavedAt).getTime())
    ? new Date(candidate.lastSavedAt).toISOString()
    : fallback.lastSavedAt;
  const lastVisitedAt = Number.isFinite(new Date(candidate.lastVisitedAt).getTime())
    ? new Date(candidate.lastVisitedAt).toISOString()
    : lastSavedAt;

  return {
    ...fallback,
    currentRoom,
    pets,
    activePetId,
    lastSavedAt,
    lastVisitedAt,
    weatherByDate,
    storageWarning: false,
    currentAction: null,
  };
}

function currentRoomForCandidate(candidate) {
  return Object.hasOwn(ROOMS, candidate?.currentRoom) ? candidate.currentRoom : DEFAULT_SAVE.currentRoom;
}

function sanitizeActionHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history.slice(-10).map((entry) => {
    if (typeof entry === 'string') {
      return { action: entry, roomId: 'unknown', furnitureId: 'unknown', at: new Date().toISOString() };
    }

    if (!isPlainObject(entry)) {
      return null;
    }

    return {
      action: typeof entry.action === 'string' ? entry.action : 'unknown',
      roomId: typeof entry.roomId === 'string' ? entry.roomId : 'unknown',
      furnitureId: typeof entry.furnitureId === 'string' ? entry.furnitureId : 'unknown',
      at: Number.isFinite(new Date(entry.at).getTime()) ? new Date(entry.at).toISOString() : new Date().toISOString(),
    };
  }).filter(Boolean);
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

function markVisitedAndSave() {
  state.lastVisitedAt = new Date().toISOString();
  save();
}

function refreshWorldIfNeeded() {
  const previousWorld = els.worldChip.textContent;
  const world = getWorldState(new Date());
  const nextWorld = `${world.period} · ${world.season} · ${world.weather}`;
  if (previousWorld !== nextWorld) {
    renderWorld(world);
    save();
  }
}

function render() {
  const world = getWorldState(new Date());
  renderWorld(world);
  renderStatusBars();
  renderMiniMap();
  renderRoom();
  renderPetState();
  renderActionState();
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

function renderPetState() {
  const stats = getActivePet().stats;
  els.pet.dataset.hungry = stats.satiety < 35 ? 'true' : 'false';
  els.pet.dataset.dirty = stats.cleanliness < 35 ? 'true' : 'false';
  els.pet.dataset.tired = stats.energy < 35 ? 'true' : 'false';
  els.pet.dataset.sad = stats.mood < 35 ? 'true' : 'false';
  els.pet.dataset.moodState = derivePetMoodState(stats);
}

function derivePetMoodState(stats) {
  const needs = [
    ['hungry', 100 - stats.satiety],
    ['dirty', 100 - stats.cleanliness],
    ['tired', 100 - stats.energy],
    ['sad', 100 - stats.mood],
  ].sort((a, b) => b[1] - a[1]);

  return needs[0][1] > 65 ? needs[0][0] : 'settled';
}

function renderActionState() {
  const name = getPetDisplayName();
  els.roomScene.dataset.action = state.currentAction?.type ?? 'idle';
  if (state.currentAction) {
    els.interactionNote.textContent = `${name}正在做自己的事……`;
    return;
  }

  const moodHints = {
    hungry: `${name}好像有点饿，厨房里的食物会有帮助。`,
    dirty: `${name}身上有点灰，卫生间可以让它清爽些。`,
    tired: `${name}看起来困了，卧室的床在等着。`,
    sad: `${name}有点低落，客厅的玩具也许能让房间轻快些。`,
    settled: `点击房间里的家具来照顾${name}。`,
  };
  els.interactionNote.textContent = moodHints[els.pet.dataset.moodState] ?? moodHints.settled;
}

function movePetTo(item) {
  els.pet.style.left = `${item.petX ?? item.x + item.w / 2}%`;
  els.pet.style.top = `${item.petY ?? item.y}%`;
}

function resetPetPosition() {
  els.pet.style.left = '';
  els.pet.style.top = '';
}

function renderMiniMap() {
  els.miniMap.innerHTML = `
    <span class="mini-map-title">小地图</span>
    <span class="mini-map-art" aria-hidden="true">
      ${Object.entries(ROOMS).map(([roomId, room]) => `
        <span class="map-dot ${roomId === state.currentRoom ? 'is-active' : ''}" data-room="${roomId}" title="${room.label}"></span>
      `).join('')}
    </span>
  `;

  renderLargeMap();
}

function renderLargeMap() {
  els.largeMap.innerHTML = Object.entries(ROOMS).map(([roomId, room]) => `
    <button type="button" class="map-room ${roomId === state.currentRoom ? 'is-active' : ''}" data-room="${roomId}" ${roomId === state.currentRoom ? 'aria-current="page"' : ''}>
      <span class="map-room-node" aria-hidden="true"></span>
      <span>${room.label}</span>
    </button>
  `).join('');

  els.largeMap.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      switchRoom(button.dataset.room);
      closeMap();
    });
  });
}

function openMap() {
  renderLargeMap();
  els.mapOverlay.classList.add('is-open');
  els.mapOverlay.setAttribute('aria-hidden', 'false');
}

function closeMap() {
  els.mapOverlay.classList.remove('is-open');
  els.mapOverlay.setAttribute('aria-hidden', 'true');
}

function switchRoom(roomId) {
  if (!Object.hasOwn(ROOMS, roomId) || state.currentRoom === roomId) {
    return;
  }

  state.currentRoom = roomId;
  getActivePet().currentRoom = state.currentRoom;
  resetPetPosition();
  setNarration(`视线转到了${ROOMS[state.currentRoom].label}。`);
  render();
  save();
}

function getNextRoomId() {
  const roomIds = Object.keys(ROOMS);
  const currentIndex = roomIds.indexOf(state.currentRoom);
  return roomIds[(currentIndex + 1) % roomIds.length];
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
  if (state.currentAction) {
    setNarration(`${getPetDisplayName()}正在专心做一件事。`);
    return;
  }

  if (item.travel) {
    switchRoom(getNextRoomId());
    return;
  }

  if (!item.action) {
    setNarration(toPetText(item.note ?? '房间里安静了一会儿。'));
    return;
  }

  const action = ACTIONS[item.action];
  const activePet = getActivePet();
  state.currentAction = { type: item.action, roomId: state.currentRoom, furnitureId: item.id, startedAt: new Date().toISOString(), durationMs: action.duration };
  activePet.currentAction = state.currentAction;
  activePet.actionState = 'active';
  movePetTo(item);
  playPetAnimation(action.animation, action.duration);
  setNarration(getActionStartNarration(item.action));
  renderActionState();

  window.setTimeout(() => {
    applyDeltas(activePet.stats, action.deltas);
    setNarration(toPetText(action.narration));
    activePet.lastAction = item.action;
    activePet.actionHistory = [...(activePet.actionHistory ?? []), {
      action: item.action,
      roomId: state.currentRoom,
      furnitureId: item.id,
      at: new Date().toISOString(),
    }].slice(-10);
    state.currentAction = null;
    activePet.currentAction = null;
    activePet.actionState = 'idle';
    resetPetPosition();
    renderStatusBars();
    renderPetState();
    renderActionState();
    save();
  }, action.duration);
}

function getActionStartNarration(actionType) {
  const messages = {
    feed: '{name}走到食物旁边。',
    bath: '{name}靠近有水汽的地方。',
    sleep: '{name}慢慢挪到床边。',
    play: '{name}靠近玩具箱。',
  };
  return toPetText(messages[actionType] ?? '{name}靠近了家具。');
}

function applyDeltas(stats, deltas) {
  Object.entries(deltas).forEach(([key, delta]) => {
    stats[key] = clamp((stats[key] ?? 0) + delta);
  });
}

function playPetAnimation(className, duration = 1400) {
  els.pet.classList.remove('is-eating', 'is-bathing', 'is-sleeping', 'is-playing');
  els.pet.classList.add(className);
  window.setTimeout(() => {
    els.pet.classList.remove(className);
  }, duration);
}

function setNarration(text) {
  els.narration.textContent = state.storageWarning ? `${text}（本地存档暂时不可用。）` : text;
}

function applyOfflineDecay() {
  const lastSaved = new Date(state.lastVisitedAt ?? state.lastSavedAt).getTime();
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
    satiety: -0.55 * cappedHours,
    cleanliness: -0.28 * cappedHours,
    energy: getWorldState(new Date()).periodKey === 'night' ? 0.32 * cappedHours : -0.16 * cappedHours,
    mood: -0.12 * cappedHours,
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
