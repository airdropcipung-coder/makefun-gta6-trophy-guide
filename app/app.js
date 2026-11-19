// Leonida Platinum — an offline GTA VI trophy guide and tracker.
// Loads app/data/trophies.json once, renders the checklist, roadmap, missable
// page and guide pane from it, and keeps progress in localStorage so it
// survives a reload. No network request is made at run time beyond the app's
// own files, and no data leaves the browser.

const STORE_KEY = 'leonida-platinum-v1';
const SEED_EARNED = [2, 3, 20, 21, 33, 36, 37, 44, 45, 46, 49, 50, 51];

const listEl = document.getElementById('trophy-list');
const metaEl = document.getElementById('list-meta');
const emptyEl = document.getElementById('empty-note');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind-filter');
const gradeEl = document.getElementById('grade-filter');
const statusEl = document.getElementById('status-filter');
const spoilerEl = document.getElementById('spoiler-toggle');
const detailPane = document.getElementById('detail-pane');
const detailBody = document.getElementById('detail-body');

let data = null;
let earned = new Set();
let spoilerOn = false;
let openId = null;

const params = new URLSearchParams(location.search);

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { earned: [], spoiler: false };
    const parsed = JSON.parse(raw);
    return {
      earned: Array.isArray(parsed.earned) ? parsed.earned : [],
      spoiler: parsed.spoiler === true,
    };
  } catch {
    return { earned: [], spoiler: false };
  }
}

function saveStored() {
  localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned], spoiler: spoilerOn }));
}

function trophyById(id) {
  return data.trophies.find((t) => t.id === id);
}

function isMasked(t) {
  return spoilerOn && t.hidden && !earned.has(t.id);
}

function gradeLetter(grade) {
  return { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' }[grade] ?? '?';
}

function kindLabel(kind) {
  return {
    story: 'Story',
    side: 'Side mission',
    collectible: 'Collectible',
    activity: 'Activity',
    robbery: 'Robbery',
    money: 'Money',
    misc: 'Odd job',
    completion: 'Completion',
  }[kind] ?? kind;
}

function updateProgress() {
  const total = data.trophies.length;
  const count = earned.size;
  const pct = Math.round((count / total) * 100);
  document.getElementById('earned-count').textContent = String(count);
  document.getElementById('earned-pct').textContent = `${pct}%`;
  const bar = document.getElementById('progress-bar');
  bar.setAttribute('aria-valuenow', String(count));
  document.getElementById('progress-fill').style.width = `${pct}%`;
  const byGrade = (g) => data.trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
  document.getElementById('progress-grades').textContent =
    `Platinum ${byGrade('platinum')}/1 · Gold ${byGrade('gold')}/2 · Silver ${byGrade('silver')}/6 · Bronze ${byGrade('bronze')}/46`;
  document.getElementById('missable-count').textContent = String(data.trophies.filter((t) => t.missable).length);
}

function filteredTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return data.trophies.filter((t) => {
    if (kindEl.value === 'missable' ? !t.missable : kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (statusEl.value === 'earned' && !earned.has(t.id)) return false;
    if (statusEl.value === 'unearned' && earned.has(t.id)) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderList() {
  const rows = filteredTrophies();
  listEl.replaceChildren();
  emptyEl.hidden = rows.length !== 0;
  metaEl.textContent = rows.length === data.trophies.length
    ? `Showing all ${rows.length} trophies — click one to read its guide.`
    : `Showing ${rows.length} of ${data.trophies.length} trophies.`;
  for (const t of rows) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.id) ? ' is-earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleEarned(t.id, box.checked);
    });
    const middle = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    if (isMasked(t)) {
      name.innerHTML = '';
      const mask = document.createElement('span');
      mask.className = 'spoiler-mask';
      mask.textContent = 'Hidden trophy — earn it to reveal its name';
      name.append(mask);
    } else {
      name.textContent = t.name;
      if (t.hidden) {
        const tag = document.createElement('span');
        tag.className = 'hidden-tag';
        tag.textContent = 'hidden';
        name.append(tag);
      }
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = isMasked(t) ? 'Its name and description are hidden until you earn it.' : t.description;
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    const kindTag = document.createElement('span');
    kindTag.className = 'tag';
    kindTag.textContent = kindLabel(t.kind);
    tags.append(kindTag);
    if (t.target != null) {
      const targetTag = document.createElement('span');
      targetTag.className = 'tag target';
      targetTag.textContent = `PSN target: ${t.target.toLocaleString('en-US')}${t.target_label ? ' ' + t.target_label : ''}`;
      tags.append(targetTag);
    }
    if (t.missable) {
      const missTag = document.createElement('span');
      missTag.className = 'tag missable';
      missTag.textContent = 'Possibly missable';
      tags.append(missTag);
    }
    middle.append(name, desc, tags);
    const medalCol = document.createElement('div');
    medalCol.className = 'medal-col';
    const medal = document.createElement('span');
    medal.className = `medal ${t.grade}`;
    medal.textContent = gradeLetter(t.grade);
    const gradeWord = document.createElement('span');
    gradeWord.className = 'grade-word';
    gradeWord.textContent = t.grade;
    medalCol.append(medal, gradeWord);
    li.append(box, middle, medalCol);
    li.addEventListener('click', () => openDetail(t.id));
    listEl.append(li);
  }
}

function toggleEarned(id, on) {
  if (on) earned.add(id);
  else earned.delete(id);
  saveStored();
  updateProgress();
  renderList();
  renderRoadmap();
  if (openId === id) openDetail(id);
}

function sourceLink(key) {
  const s = data.sources[key];
  if (!s) return null;
  const a = document.createElement('a');
  a.href = s.url;
  a.textContent = s.label;
  a.target = '_blank';
  a.rel = 'noopener';
  return a;
}

function openDetail(id) {
  const t = trophyById(id);
  if (!t) return;
  openId = id;
  detailBody.replaceChildren();
  const title = document.createElement('h2');
  title.textContent = isMasked(t) ? 'Hidden trophy' : t.name;
  const gradeLine = document.createElement('div');
  gradeLine.className = 'detail-grade';
  const medal = document.createElement('span');
  medal.className = `medal ${t.grade}`;
  medal.textContent = gradeLetter(t.grade);
  const gradeText = document.createElement('span');
  gradeText.textContent = `${t.grade} trophy${t.hidden ? ' · hidden on PlayStation until earned' : ''}`;
  gradeLine.append(medal, gradeText);
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = isMasked(t)
    ? 'Spoilers are hidden: turn off “Hide story spoilers” or tick this trophy earned to see its name and description.'
    : `Official description: “${t.description}”`;
  detailBody.append(title, gradeLine, desc);
  if (isMasked(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'This is a hidden story trophy. Its guide is hidden too — earn it (or turn spoilers off) to read it.';
    detailBody.append(note);
  } else {
    if (t.missable && t.missable_note) {
      const warn = document.createElement('p');
      warn.className = 'missable-note';
      warn.textContent = t.missable_note;
      detailBody.append(warn);
    }
    const guideHead = document.createElement('h3');
    guideHead.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const stepsHead = document.createElement('h3');
    stepsHead.textContent = 'Steps';
    const steps = document.createElement('ol');
    for (const step of t.steps) {
      const li = document.createElement('li');
      li.textContent = step;
      steps.append(li);
    }
    const srcHead = document.createElement('h3');
    srcHead.textContent = 'Sources';
    const srcList = document.createElement('ul');
    srcList.className = 'detail-sources';
    for (const key of t.sources) {
      const link = sourceLink(key);
      if (!link) continue;
      const li = document.createElement('li');
      li.append(link);
      srcList.append(li);
    }
    detailBody.append(guideHead, guide, stepsHead, steps, srcHead, srcList);
  }
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.className = 'btn detail-earned';
  earnedBtn.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => toggleEarned(t.id, !earned.has(t.id)));
  detailBody.append(earnedBtn);
  detailPane.hidden = false;
}

function closeDetail() {
  openId = null;
  detailPane.hidden = true;
}

function renderRoadmap() {
  const host = document.getElementById('roadmap-stages');
  host.replaceChildren();
  for (const stage of data.roadmap) {
    const card = document.createElement('article');
    card.className = 'stage';
    const head = document.createElement('div');
    head.className = 'stage-head';
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = String(stage.stage);
    const title = document.createElement('h3');
    title.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    const done = stage.trophies.filter((id) => earned.has(id)).length;
    count.textContent = `${done}/${stage.trophies.length} earned`;
    head.append(num, title, count);
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const chips = document.createElement('div');
    chips.className = 'stage-trophies';
    for (const id of stage.trophies) {
      const t = trophyById(id);
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'stage-trophy' + (earned.has(id) ? ' is-earned' : '');
      const g = document.createElement('span');
      g.className = `mini-grade ${t.grade}`;
      g.textContent = gradeLetter(t.grade);
      chip.append(g, document.createTextNode(t.name));
      chip.addEventListener('click', () => {
        showView('checklist');
        openDetail(id);
      });
      chips.append(chip);
    }
    card.append(head, blurb, chips);
    host.append(card);
  }
}

function renderMissable() {
  const host = document.getElementById('missable-list');
  host.replaceChildren();
  const flagged = data.trophies.filter((t) => t.missable);
  if (flagged.length === 0) {
    const p = document.createElement('p');
    p.className = 'no-missable';
    p.textContent = 'No trophy on this list is flagged missable.';
    host.append(p);
    return;
  }
  for (const t of flagged) {
    const card = document.createElement('article');
    card.className = 'missable-card';
    const title = document.createElement('h3');
    title.textContent = t.name;
    const warn = document.createElement('p');
    warn.innerHTML = '';
    const warnText = document.createElement('span');
    warnText.className = 'warn';
    warnText.textContent = 'Possibly missable. ';
    warn.append(warnText, document.createTextNode(t.missable_note ?? ''));
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'btn';
    open.textContent = 'Read the full guide';
    open.addEventListener('click', () => {
      showView('checklist');
      openDetail(t.id);
    });
    card.append(title, warn, guide, open);
    host.append(card);
  }
}

function renderAbout() {
  const host = document.getElementById('about-sources');
  host.replaceChildren();
  for (const key of Object.keys(data.sources)) {
    const link = sourceLink(key);
    if (!link) continue;
    const li = document.createElement('li');
    li.append(link);
    host.append(li);
  }
}

function showView(name) {
  for (const button of document.querySelectorAll('.tab')) {
    button.classList.toggle('is-active', button.dataset.view === name);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.classList.toggle('is-active', section.id === `view-${name}`);
  }
}

function exportProgress() {
  const payload = {
    app: 'Leonida Platinum — GTA VI trophy tracker',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    spoiler: spoilerOn,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importProgress(file) {
  if (!file) return;
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    alert('That file is not valid JSON.');
    return;
  }
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) {
    alert('That file does not hold trophy progress.');
    return;
  }
  const valid = ids.filter((id) => Number.isInteger(id) && trophyById(id));
  earned = new Set(valid);
  if (typeof parsed.spoiler === 'boolean') {
    spoilerOn = parsed.spoiler;
    spoilerEl.checked = spoilerOn;
  }
  saveStored();
  updateProgress();
  renderList();
  renderRoadmap();
  alert(`Imported ${valid.length} earned trophies.`);
}

document.getElementById('export-btn').addEventListener('click', exportProgress);
document.getElementById('import-file').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies and the spoiler setting?')) return;
  earned = new Set();
  spoilerOn = false;
  spoilerEl.checked = false;
  saveStored();
  updateProgress();
  renderList();
  renderRoadmap();
});
document.getElementById('detail-close').addEventListener('click', closeDetail);
for (const button of document.querySelectorAll('.tab')) {
  button.addEventListener('click', () => showView(button.dataset.view));
}
searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', renderList);
gradeEl.addEventListener('change', renderList);
statusEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', () => {
  spoilerOn = spoilerEl.checked;
  saveStored();
  renderList();
  if (openId != null) openDetail(openId);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeDetail();
});

const stored = loadStored();
earned = new Set(stored.earned);
spoilerOn = stored.spoiler;

// Screenshot and demo helpers, driven only by the URL: ?seed=13 pre-fills
// progress when nothing is saved yet, ?view=roadmap|missable|about opens a
// section, ?spoiler=1 turns the spoiler setting on, ?open=<id> opens a guide.
if (params.get('seed') && stored.earned.length === 0) {
  earned = new Set(SEED_EARNED);
  saveStored();
}
if (params.get('spoiler') === '1') {
  spoilerOn = true;
}
spoilerEl.checked = spoilerOn;

const response = await fetch('data/trophies.json');
data = await response.json();
updateProgress();
renderList();
renderRoadmap();
renderMissable();
renderAbout();
if (params.get('view')) showView(params.get('view'));
if (params.get('open')) openDetail(Number(params.get('open')));
