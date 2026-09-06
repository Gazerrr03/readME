import { SPIRITS, newJourney, loadJourney, saveJourney, startEncounter, takeTurn } from './state.js';
import { createPixelSvg } from '../../modules/interactive-buttons/shared/pixel-art.js';

const words = {
  en: {
    island: 'Mosslight Island', quest: 'Find the three island spirits', beaconQuest: 'Return to the lighthouse', done: 'The island is glowing again',
    journal: 'Field journal', pause: 'Pause', sound: 'Sound', companion: 'PIP / PARTNER', hp: 'Energy', interact: 'Explore', meet: 'Meet', camp: 'Rest', beacon: 'Light beacon',
    up: 'North', down: 'South', left: 'West', right: 'East', tools: 'Game controls', movement: 'Movement', found: 'Befriended', unknown: 'Not yet met',
    wild: 'ISLAND SPIRIT', calm: 'Trust', pulse: 'Light pulse', soothe: 'Soothe', berry: 'Berry', befriend: 'Befriend', leave: 'Leave encounter',
    intro: 'A curious spirit approaches Pip.', pulseLog: 'Pip sends a light pulse. The spirit loses 4 energy.', sootheLog: 'Pip hums softly. The spirit grows calmer.', berryLog: 'A sunberry restores Pip\'s energy.', shy: 'Still a little shy. The spirit needs more trust or less energy.',
    counter: 'Pip loses {n} energy.', joined: '{name} has joined your field journal.', rested: 'Pip needs a rest. You return to camp, safe and sound.', healed: 'Fully rested. Three sunberries packed for the road.', locked: 'The beacon needs all three island spirits.', ready: 'Three new friends. The lighthouse is waiting.',
    paused: 'A quiet moment', pausedText: 'Your journey is waiting here.', resume: 'Continue', restart: 'New journey', restartTitle: 'Begin again?', restartText: 'This replaces your saved journey on this device.', cancel: 'Keep this journey', confirm: 'Start over',
    victory: 'A light for everyone', victoryText: 'Three little spirits, one bright island. The beacon shines again. Your field journal is complete.', continue: 'Stay on the island',
    fail: 'The island could not open', failText: '3D graphics are unavailable in this browser right now.', retry: 'Try again', noSave: 'Progress cannot be saved in this browser session.', lost: 'The graphics connection was interrupted. Your journey has been saved.',
  },
  'zh-CN': {
    island: '苔光岛', quest: '寻找岛上的三位精灵', beaconQuest: '返回北方灯塔', done: '岛屿重新亮起', journal: '精灵图鉴', pause: '暂停', sound: '声音', companion: '皮普 / 同行伙伴', hp: '体力', interact: '探索', meet: '结识', camp: '休息', beacon: '点亮灯塔',
    up: '向北', down: '向南', left: '向西', right: '向东', tools: '游戏控制', movement: '移动', found: '已成为伙伴', unknown: '尚未相遇', wild: '岛屿精灵', calm: '信任', pulse: '光之脉冲', soothe: '轻声安抚', berry: '日光莓', befriend: '成为伙伴', leave: '离开相遇',
    intro: '一位好奇的精灵走近了皮普。', pulseLog: '皮普释放了光之脉冲，精灵消耗了 4 点体力。', sootheLog: '皮普轻轻哼唱，精灵放下了一点戒心。', berryLog: '日光莓让皮普恢复了体力。', shy: '它还有些害羞，需要更多信任，或再消耗一些体力。',
    counter: '皮普消耗了 {n} 点体力。', joined: '{name}成为了伙伴，已经记入图鉴。', rested: '皮普累了。你们平安回到营地，休整后再出发。', healed: '体力已恢复，带上三颗日光莓继续出发。', locked: '灯塔还在等待三位岛屿精灵。', ready: '三位伙伴都已找到，去北方点亮灯塔吧。',
    paused: '稍作停留', pausedText: '岛上的旅程，等你继续。', resume: '继续旅程', restart: '新的旅程', restartTitle: '重新出发？', restartText: '这会替换当前设备上保存的旅程。', cancel: '保留这段旅程', confirm: '重新开始', victory: '为每个人亮起', victoryText: '三位小小的精灵，让一座岛屿重新亮起。灯塔已点亮，你的精灵图鉴也完整了。', continue: '继续留在岛上',
    fail: '岛屿暂时无法打开', failText: '当前浏览器暂时无法显示 3D 场景。', retry: '重新尝试', noSave: '当前浏览器无法保存这次旅程的进度。', lost: '画面连接中断，旅程进度已经保存。',
  },
  ja: {
    island: 'モスライト島', quest: '島の精霊を三体見つけよう', beaconQuest: '北の灯台へ戻ろう', done: '島に光が戻った', journal: '精霊図鑑', pause: '一時停止', sound: 'サウンド', companion: 'ピップ / パートナー', hp: '体力', interact: '探索', meet: '出会う', camp: '休む', beacon: '灯台を灯す',
    up: '北へ', down: '南へ', left: '西へ', right: '東へ', tools: 'ゲーム操作', movement: '移動', found: '仲間になった', unknown: 'まだ出会っていない', wild: '島の精霊', calm: '信頼', pulse: '光の波動', soothe: 'なだめる', berry: 'ベリー', befriend: '仲間にする', leave: '立ち去る',
    intro: '好奇心いっぱいの精霊が近づいた。', pulseLog: 'ピップの光の波動。精霊の体力が4減った。', sootheLog: 'ピップが歌うと、精霊は少し落ち着いた。', berryLog: 'ベリーでピップの体力が回復した。', shy: 'まだ恥ずかしそう。信頼を深めるか、体力を減らそう。', counter: 'ピップの体力が{n}減った。', joined: '{name}が仲間になった。', rested: 'ピップはお疲れ。キャンプで元気を取り戻した。', healed: '体力が回復し、ベリーを三つ補充した。', locked: '灯台には三体の精霊が必要だ。', ready: '三体がそろった。北の灯台へ向かおう。',
    paused: 'ひとやすみ', pausedText: '島の旅はここで待っています。', resume: '旅を続ける', restart: '新しい旅', restartTitle: '最初から始める？', restartText: 'この端末に保存された旅を置き換えます。', cancel: '今の旅を残す', confirm: '最初から', victory: 'みんなのための光', victoryText: '三体の精霊が島に光を取り戻した。灯台が輝き、精霊図鑑も完成した。', continue: '島に残る', fail: '島を開けませんでした', failText: 'このブラウザーで3D描画を利用できません。', retry: '再試行', noSave: 'このブラウザーでは進行を保存できません。', lost: '描画が中断しました。旅の進行は保存されました。',
  },
};
const requested = new URLSearchParams(location.search).get('lang') || navigator.language;
const locale = requested.startsWith('zh') ? 'zh-CN' : requested.startsWith('ja') ? 'ja' : 'en';
const t = words[locale];
document.documentElement.lang = locale;
const $ = selector => document.querySelector(selector);
const game = $('#game');
const canvas = $('#world');
const dialog = $('#dialog');
const journal = $('#journal');
const panel = $('#encounter');
const keys = new Set();
const pointers = new Map();
const events = new AbortController();
const listen = (target, name, fn, options = {}) => target.addEventListener(name, fn, { ...options, signal: events.signal });
let storage;
try { storage = window.localStorage; } catch { /* Play remains available without storage. */ }
const journey = loadJourney(storage);
let island;
let encounter = null;
let frameId = 0;
let lastTime = 0;
let clock = 0;
let lastSaved = 0;
let hostActive = true;
let destroyed = false;
let failed = false;
let modalType = null;
let noticeTimer;
let soundEnabled = false;
let audio;
let previousFocus;
let log = '';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const keyDirections = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
const icons = {
  journal: ['####.####', '#..#.#..#', '#..#.#..#', '#..#.#..#', '#..#.#..#', '####.####', '...###...'],
  pause: ['.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.', '.##.##.'],
  sound: ['...#..#', '..##.#.', '####..#', '####..#', '####..#', '..##.#.', '...#..#'],
  up: ['...#...', '..###..', '.#####.', '...#...', '...#...', '...#...', '.......'],
  left: ['.......', '..#....', '.##....', '######.', '.##....', '..#....', '.......'],
  down: ['.......', '...#...', '...#...', '...#...', '.#####.', '..###..', '...#...'],
  right: ['.......', '....#..', '....##.', '.######', '....##.', '....#..', '.......'],
  close: ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#'],
};
function iconButton(icon, label, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'icon';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.append(createPixelSvg(document, icons[icon], { 'aria-hidden': 'true' }));
  if (handler) listen(button, 'click', handler);
  return button;
}
function clearInput() { keys.clear(); pointers.clear(); }
function persist() { return saveJourney(storage, journey); }
function notice(message) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = message;
  noticeTimer = setTimeout(() => { $('#notice').textContent = ''; }, 5200);
}
function chime(notes = [523, 659, 784]) {
  if (!soundEnabled) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
    notes.forEach((frequency, index) => {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      const start = audio.currentTime + index * .09;
      oscillator.type = 'square';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.018, start);
      gain.gain.exponentialRampToValueAtTime(.001, start + .14);
      oscillator.connect(gain).connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + .15);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  } catch { /* Audio is optional, including on browsers that block Web Audio. */ }
}
function syncState(resetInput = true) {
  if (resetInput) clearInput();
  game.dataset.gameState = failed ? 'error' : modalType ? 'paused' : encounter ? 'encounter' : 'exploring';
  game.dataset.rendering = String(Boolean(island && hostActive && !document.hidden && !modalType && !failed));
}
function updateHud() {
  $('#quest').textContent = journey.complete ? t.done : journey.friends.length === 3 ? t.beaconQuest : t.quest;
  $('#count').textContent = `${journey.friends.length} / 3`;
  $('#companion').textContent = t.companion;
  $('#health-label').textContent = `${t.hp} ${journey.hp} / 18`;
  $('#health').value = journey.hp;
  $('#health').setAttribute('aria-label', t.hp);
  const near = island?.nearest();
  $('#place').textContent = near?.biome?.[locale] ?? t.island;
  $('#interact').textContent = near?.id === 'camp' ? t.camp : near?.id === 'beacon' ? t.beacon : near ? t.meet : t.interact;
  $('#interact').disabled = !near || !island;
}
function renderJournal() {
  journal.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = t.journal;
  journal.append(heading);
  SPIRITS.forEach(spec => {
    const row = document.createElement('div');
    row.className = 'journal-row';
    row.dataset.found = String(journey.friends.includes(spec.id));
    row.innerHTML = `<span class="spirit-swatch" style="--spirit:${spec.color}"></span><div>${spec.name[locale]}<small>${spec.biome[locale]} / ${journey.friends.includes(spec.id) ? t.found : t.unknown}</small></div>`;
    journal.append(row);
  });
}
function hideDialog() {
  modalType = null;
  dialog.hidden = true;
  syncState();
  (previousFocus?.isConnected ? previousFocus : canvas).focus({ preventScroll: true });
}
function showDialog(type, title, body, actions) {
  if (!modalType) previousFocus = document.activeElement;
  modalType = type;
  journal.hidden = true;
  journalButton.setAttribute('aria-expanded', 'false');
  dialog.innerHTML = `<section class="dialog-content"><span class="edition">MOSSLIGHT</span><h2 id="dialog-title">${title}</h2><p>${body}</p></section>`;
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  actions.forEach(([label, handler], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `action${index ? ' secondary' : ''}`;
    button.textContent = label;
    button.addEventListener('click', handler);
    dialog.firstElementChild.append(button);
  });
  dialog.hidden = false;
  syncState();
  dialog.querySelector('button').focus({ preventScroll: true });
}
function pause() {
  if (failed || !island) return;
  persist();
  showDialog('pause', t.paused, t.pausedText, [[t.resume, hideDialog], [t.restart, () => {
    showDialog('restart', t.restartTitle, t.restartText, [[t.cancel, pause], [t.confirm, () => {
      Object.assign(journey, newJourney());
      endEncounter();
      persist();
      renderJournal();
      hideDialog();
      updateHud();
    }]]);
  }]]);
}
function endEncounter() {
  encounter = null;
  island?.setEncounter(null);
  panel.hidden = true;
  syncState();
  canvas.focus({ preventScroll: true });
}
function renderEncounter() {
  const spec = SPIRITS.find(s => s.id === encounter.id);
  panel.innerHTML = `<div class="encounter-head"><div><small>${t.wild} / ${spec.biome[locale]}</small><h2>${spec.name[locale]}</h2></div><div class="wild-vitals">${t.hp} <span data-wild-hp>${encounter.hp} / 12</span><meter min="0" max="12" value="${encounter.hp}" aria-label="${t.hp}"></meter><span data-bond>${t.calm} ${encounter.bond} / 2</span></div></div><p class="battle-log" role="status">${log}</p><div class="battle-vitals">${t.companion} &nbsp; ${t.hp} <strong data-player-hp>${journey.hp} / 18</strong></div><div class="battle-actions"></div>`;
  panel.querySelector('.encounter-head').append(iconButton('close', t.leave, () => act('leave')));
  const actions = panel.querySelector('.battle-actions');
  for (const action of ['pulse', 'soothe', 'berry', 'befriend']) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.turn = action;
    button.textContent = action === 'berry' ? `${t.berry} (${journey.berries})` : t[action];
    button.disabled = action === 'berry' && !journey.berries;
    button.addEventListener('click', () => act(action));
    actions.append(button);
  }
  panel.hidden = false;
}
function act(action) {
  if (!encounter || modalType) return;
  const spec = SPIRITS.find(s => s.id === encounter.id);
  const result = takeTurn(journey, encounter, action);
  if (['invalid', 'empty'].includes(result.event)) return;
  if (['joined', 'rested', 'left'].includes(result.event)) {
    endEncounter();
    if (result.event === 'joined') {
      notice(t.joined.replace('{name}', spec.name[locale]) + (journey.friends.length === 3 ? ` ${t.ready}` : ''));
      chime();
    } else if (result.event === 'rested') notice(t.rested);
    renderJournal();
  } else {
    log = `${t[`${result.event}Log`] ?? t.shy} ${t.counter.replace('{n}', result.damage)}`;
    renderEncounter();
    const next = action === 'berry' && !journey.berries ? 'soothe' : action;
    panel.querySelector(`[data-turn="${next}"]`).focus({ preventScroll: true });
    chime([action === 'soothe' ? 659 : 330]);
  }
  persist();
  updateHud();
}
function interact() {
  if (!island || encounter || modalType || !journal.hidden || !hostActive) return;
  const near = island.nearest();
  if (!near) return;
  if (near.id === 'camp') {
    journey.hp = 18;
    journey.berries = 3;
    notice(t.healed);
    chime();
  } else if (near.id === 'beacon') {
    if (journey.friends.length < 3) { notice(t.locked); return; }
    journey.complete = true;
    island.render(clock, 1 / 60);
    chime([523, 659, 784, 1047]);
    showDialog('victory', t.victory, t.victoryText, [[t.continue, hideDialog]]);
  } else {
    encounter = startEncounter(near.id);
    island.setEncounter(encounter);
    log = t.intro;
    renderEncounter();
    syncState();
    panel.querySelector('[data-turn="pulse"]').focus({ preventScroll: true });
  }
  updateHud();
  persist();
}

const journalButton = iconButton('journal', t.journal, () => {
  if (modalType || failed) return;
  journal.hidden = !journal.hidden;
  journalButton.setAttribute('aria-expanded', String(!journal.hidden));
  clearInput();
});
journalButton.setAttribute('aria-controls', 'journal');
journalButton.setAttribute('aria-expanded', 'false');
const soundButton = iconButton('sound', t.sound, () => {
  soundEnabled = !soundEnabled;
  soundButton.setAttribute('aria-pressed', String(soundEnabled));
  if (soundEnabled) chime([659]);
});
soundButton.setAttribute('aria-pressed', 'false');
$('#tools').append(journalButton, soundButton, iconButton('pause', t.pause, pause));
$('#tools').setAttribute('aria-label', t.tools);
$('#direction-pad').setAttribute('aria-label', t.movement);
canvas.setAttribute('aria-label', t.island);
const movement = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
for (const direction of ['up', 'left', 'down', 'right']) {
  const button = iconButton(direction, t[direction]);
  button.dataset.direction = direction;
  listen(button, 'pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, movement[direction]);
  });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) listen(button, eventName, event => { pointers.delete(event.pointerId); persist(); });
  // Keyboard and assistive activation still produce a small deliberate step.
  listen(button, 'click', event => {
    if (event.detail === 0 && island && !encounter && !modalType && journal.hidden) {
      const [x, z] = movement[direction];
      island.move(x * .35, z * .35);
      persist();
    }
  });
  $('#direction-pad').append(button);
}
listen($('#interact'), 'click', interact);
listen(canvas, 'pointerdown', () => canvas.focus({ preventScroll: true }));
listen(window, 'keydown', event => {
  if (event.key === 'Tab' && modalType) {
    const buttons = [...dialog.querySelectorAll('button')];
    const first = buttons[0];
    const last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    return;
  }
  if (event.key === 'Escape') {
    event.preventDefault();
    if (failed) return;
    if (modalType) hideDialog();
    else if (!journal.hidden) { journal.hidden = true; journalButton.setAttribute('aria-expanded', 'false'); journalButton.focus(); }
    else pause();
    return;
  }
  if (event.ctrlKey || event.metaKey || event.altKey || modalType || encounter || !journal.hidden) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (keyDirections[key]) { event.preventDefault(); keys.add(key); }
  else if ((key === 'e' || key === ' ') && !event.repeat && event.target.tagName !== 'BUTTON') { event.preventDefault(); interact(); }
});
listen(window, 'keyup', event => { keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key); persist(); });
listen(window, 'blur', () => { clearInput(); persist(); });
function requestHostFocus() {
  if (window.parent !== window) window.parent.postMessage({ type: 'mosslight:focus' }, location.origin);
}
listen(document, 'pointerdown', requestHostFocus, { capture: true });
listen(window, 'focus', requestHostFocus);
listen(document, 'visibilitychange', () => { if (document.hidden) persist(); syncState(); });
listen(window, 'message', event => {
  if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'mosslight:visibility') return;
  const nextActive = event.data.active === true;
  if (nextActive === hostActive) return;
  hostActive = nextActive;
  if (!hostActive) persist();
  syncState(!hostActive);
});
listen(canvas, 'webglcontextlost', event => {
  if (destroyed) return;
  event.preventDefault();
  failed = true;
  persist();
  showDialog('error', t.fail, t.lost, [[t.retry, () => location.reload()]]);
});
function tick(time) {
  if (destroyed) return;
  const dt = Math.min(.04, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  if (island && hostActive && !document.hidden && !modalType && !failed) {
    clock += dt;
    let dx = 0;
    let dz = 0;
    if (!encounter && journal.hidden) {
      [...keys].map(key => keyDirections[key]).concat([...pointers.values()]).forEach(([x, z]) => { dx += x; dz += z; });
    }
    const length = Math.hypot(dx, dz);
    if (length) island.move(dx / length * dt * 3.6, dz / length * dt * 3.6);
    island.render(clock, dt, length > 0);
    updateHud();
    if (length && time - lastSaved > 1200) { persist(); lastSaved = time; }
  }
  frameId = requestAnimationFrame(tick);
}
listen(window, 'pagehide', event => {
  persist();
  clearInput();
  if (event.persisted) return;
  destroyed = true;
  cancelAnimationFrame(frameId);
  clearTimeout(noticeTimer);
  events.abort();
  island?.dispose();
  void audio?.close().catch(() => {});
});
renderJournal();
updateHud();
try {
  const { createIsland } = await import('./scene.js');
  if (!destroyed) {
    island = createIsland(canvas, journey, reducedMotion);
    island.render(0, 1 / 60);
    syncState();
    updateHud();
    if (!persist()) notice(t.noSave);
    frameId = requestAnimationFrame(tick);
    if (window.parent !== window) window.parent.postMessage({ type: 'mosslight:ready' }, location.origin);
  }
} catch (error) {
  console.error('Mosslight could not initialize:', error);
  failed = true;
  showDialog('error', t.fail, t.failText, [[t.retry, () => location.reload()]]);
}
