export const SAVE_KEY = 'qizhi:mosslight:v1';
export const HOME = Object.freeze({ x: 0, z: 7 });
export const BEACON = Object.freeze({ x: 0, z: -8 });
export const CAMP = Object.freeze({ x: -4, z: 5 });
export const SPIRITS = Object.freeze([
  { id: 'fern', x: -6, z: -1, color: '#96dd59', accent: '#e7b453', name: { en: 'Fernling', 'zh-CN': '芽芽', ja: 'フタバ' }, biome: { en: 'Fernwood', 'zh-CN': '蕨叶林', ja: 'シダの森' } },
  { id: 'tide', x: 6, z: 3, color: '#5bd9ef', accent: '#576de1', name: { en: 'Tidelet', 'zh-CN': '汐汐', ja: 'シオ' }, biome: { en: 'Glasswater', 'zh-CN': '琉璃湾', ja: 'ガラスの入江' } },
  { id: 'ember', x: 6, z: -6, color: '#fa9a6c', accent: '#cc586d', name: { en: 'Emberkin', 'zh-CN': '烁烁', ja: 'ホノ' }, biome: { en: 'Sunstone', 'zh-CN': '日光台地', ja: '陽だまりの丘' } },
]);

export function newJourney() {
  return { version: 1, ...HOME, hp: 18, berries: 3, friends: [], complete: false };
}

export function loadJourney(storage) {
  try {
    const data = JSON.parse(storage.getItem(SAVE_KEY));
    if (data?.version !== 1) return newJourney();
    const friends = SPIRITS.filter(s => Array.isArray(data.friends) && data.friends.includes(s.id)).map(s => s.id);
    return {
      ...newJourney(),
      x: Number.isFinite(data.x) && Math.abs(data.x) < 10 ? data.x : HOME.x,
      z: Number.isFinite(data.z) && Math.abs(data.z) < 11 ? data.z : HOME.z,
      hp: Number.isInteger(data.hp) && data.hp > 0 && data.hp <= 18 ? data.hp : 18,
      berries: Number.isInteger(data.berries) ? Math.max(0, Math.min(3, data.berries)) : 3,
      friends,
      complete: data.complete === true && friends.length === 3,
    };
  } catch { return newJourney(); }
}

export function saveJourney(storage, journey) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(journey)); return true; }
  catch { return false; }
}

export function startEncounter(id) {
  return { id, hp: 12, bond: 0, turn: 0 };
}

// Original deterministic encounter rules: weaken or soothe before befriending.
export function takeTurn(journey, encounter, action) {
  if (!encounter || !SPIRITS.some(s => s.id === encounter.id) || journey.friends.includes(encounter.id)) return { event: 'invalid' };
  if (!['pulse', 'soothe', 'berry', 'befriend', 'leave'].includes(action)) return { event: 'invalid' };
  if (action === 'leave') return { event: 'left' };
  if (action === 'berry' && journey.berries === 0) return { event: 'empty' };
  if (action === 'befriend' && (encounter.hp <= 4 || encounter.bond >= 2)) {
    journey.friends.push(encounter.id);
    journey.hp = Math.min(18, journey.hp + 4);
    journey.berries = Math.min(3, journey.berries + 1);
    return { event: 'joined' };
  }
  encounter.turn += 1;
  if (action === 'pulse') encounter.hp = Math.max(1, encounter.hp - 4);
  if (action === 'soothe') encounter.bond = Math.min(2, encounter.bond + 1);
  if (action === 'berry') { journey.berries -= 1; journey.hp = Math.min(18, journey.hp + 9); }
  const damage = action === 'soothe' ? 1 : action === 'befriend' ? 4 : 3;
  journey.hp = Math.max(0, journey.hp - damage);
  if (journey.hp === 0) {
    Object.assign(journey, HOME, { hp: 18, berries: 3 });
    return { event: 'rested', damage };
  }
  return { event: action === 'befriend' ? 'shy' : action, damage };
}
