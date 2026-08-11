function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(mins) {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function nowTimeString() {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function formatDuration(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let currentKey;
let currentDate;
let currentBlocks;
let anchorField = 'end'; // 'start' or 'end' — which time field duration chips fill relative to

function addDays(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Lays overlapping blocks out side-by-side (like a calendar day view) instead
// of stacking them on top of each other. Returns a Map from block index to
// { column, columns } describing its lane within its overlap cluster.
function layoutOverlaps(blocks) {
  const sorted = blocks
    .map((b, index) => ({ index, startMin: timeToMinutes(b.start), endMin: timeToMinutes(b.end) }))
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const layout = new Map();
  let active = [];
  let cluster = [];
  let clusterColumns = 0;

  function flushCluster() {
    cluster.forEach((item) => layout.set(item.index, { column: item.column, columns: clusterColumns }));
    cluster = [];
    clusterColumns = 0;
  }

  sorted.forEach((item) => {
    active = active.filter((a) => a.endMin > item.startMin);
    if (active.length === 0) flushCluster();

    const usedColumns = new Set(active.map((a) => a.column));
    let column = 0;
    while (usedColumns.has(column)) column++;

    item.column = column;
    active.push(item);
    cluster.push(item);
    clusterColumns = Math.max(clusterColumns, column + 1);
  });
  flushCluster();

  return layout;
}

function renderTimeline(blocks) {
  const timeline = document.getElementById('timeline');
  const emptyHint = document.getElementById('empty-hint');
  emptyHint.style.display = blocks.length === 0 ? 'block' : 'none';

  timeline.innerHTML = '';

  for (let hour = 0; hour < 24; hour++) {
    const row = document.createElement('div');
    row.className = 'hour-row';

    const label = document.createElement('div');
    label.className = 'hour-label';
    label.textContent = String(hour).padStart(2, '0') + ':00';
    row.appendChild(label);

    const slot = document.createElement('div');
    slot.className = 'hour-slot';
    row.appendChild(slot);

    timeline.appendChild(row);
  }

  const blocksLayer = document.createElement('div');
  blocksLayer.className = 'blocks-layer';
  const overlapLayout = layoutOverlaps(blocks);
  blocks.forEach((b, index) => {
    const el = document.createElement('div');
    el.className = 'activity-block';
    const startMin = timeToMinutes(b.start);
    const endMin = timeToMinutes(b.end);
    el.style.top = `calc(${startMin} / 60 * var(--hour-height))`;
    el.style.height = `calc(${endMin - startMin} / 60 * var(--hour-height))`;
    const { column, columns } = overlapLayout.get(index);
    el.style.left = `calc(${(column / columns) * 100}% + 0.15rem)`;
    el.style.width = `calc(${100 / columns}% - 0.3rem)`;
    el.textContent = b.label;
    el.title = 'Click to delete';
    el.addEventListener('click', () => handleBlockClick(index));
    blocksLayer.appendChild(el);
  });
  timeline.appendChild(blocksLayer);
}

function renderDate() {
  const el = document.getElementById('current-date');
  el.textContent = currentDate.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  document.getElementById('today-btn').style.display = isSameDay(currentDate, new Date()) ? 'none' : 'inline-block';
}

function loadCurrentDay() {
  currentKey = dateKey(currentDate);
  currentBlocks = loadDay(currentKey);
  renderDate();
  renderTimeline(currentBlocks);
}

function goToDate(date) {
  currentDate = date;
  loadCurrentDay();
}

// Reads/writes below always go through these two so that editing an entry
// anchored on a day other than the one currently on screen (the tomorrow-side
// half of an overnight entry) still keeps `currentBlocks` in sync.
function loadBlocksForKey(key) {
  return key === currentKey ? currentBlocks : loadDay(key);
}

function saveBlocksForKey(key, blocks) {
  blocks.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  saveDay(key, blocks);
  if (key === currentKey) currentBlocks = blocks;
}

// The day an entry's start time belongs to, regardless of which half
// (today's or the linked continuation) is currently on screen.
function anchorKeyForBlock(block) {
  return block.crossesMidnight === 'prev' ? dateKey(addDays(currentDate, -1)) : currentKey;
}

// Resolves the true start/end of an entry for editing, even when the block
// on screen is only half of an overnight-linked pair (whose own start/end
// is just the '00:00'/'24:00' day-boundary stub).
function getBlockLogicalRange(block) {
  if (block.crossesMidnight === 'next') {
    const partner = loadBlocksForKey(dateKey(addDays(currentDate, 1))).find((b) => b.id === block.id);
    return { start: block.start, end: partner ? partner.end : block.end };
  }
  if (block.crossesMidnight === 'prev') {
    const partner = loadBlocksForKey(dateKey(addDays(currentDate, -1))).find((b) => b.id === block.id);
    return { start: partner ? partner.start : block.start, end: block.end };
  }
  return { start: block.start, end: block.end };
}

function deleteEntry(anchorKey, id, wasLinked) {
  saveBlocksForKey(anchorKey, loadBlocksForKey(anchorKey).filter((b) => b.id !== id));
  if (wasLinked) {
    const nextKey = dateKey(addDays(keyToDate(anchorKey), 1));
    saveBlocksForKey(nextKey, loadBlocksForKey(nextKey).filter((b) => b.id !== id));
  }
}

function createEntry(anchorKey, label, start, end) {
  if (timeToMinutes(end) < timeToMinutes(start)) {
    const id = generateId();
    saveBlocksForKey(anchorKey, [
      ...loadBlocksForKey(anchorKey),
      { id, start, end: '24:00', label, crossesMidnight: 'next' },
    ]);
    const nextKey = dateKey(addDays(keyToDate(anchorKey), 1));
    saveBlocksForKey(nextKey, [
      ...loadBlocksForKey(nextKey),
      { id, start: '00:00', end, label, crossesMidnight: 'prev' },
    ]);
  } else {
    saveBlocksForKey(anchorKey, [...loadBlocksForKey(anchorKey), { id: generateId(), start, end, label }]);
  }
}

let editingIndex = null;
let deleteArmed = false;
let deleteCountdown = 0;
let deleteCountdownInterval = null;

function resetDeleteArm() {
  deleteArmed = false;
  clearInterval(deleteCountdownInterval);
  deleteCountdownInterval = null;
  document.getElementById('edit-delete-label').textContent = 'Delete';
  document.getElementById('edit-delete-btn').classList.remove('armed');
}

function openEditDialog(index) {
  editingIndex = index;
  const block = currentBlocks[index];
  const range = getBlockLogicalRange(block);
  document.getElementById('edit-label-input').value = block.label;
  document.getElementById('edit-start-input').value = range.start;
  document.getElementById('edit-end-input').value = range.end;
  resetDeleteArm();
  document.getElementById('edit-dialog').showModal();
}

function handleBlockClick(index) {
  openEditDialog(index);
}

function handleEditDeleteClick() {
  if (!deleteArmed) {
    deleteArmed = true;
    deleteCountdown = 3;
    document.getElementById('edit-delete-label').textContent = `Delete? (${deleteCountdown})`;
    document.getElementById('edit-delete-btn').classList.add('armed');
    deleteCountdownInterval = setInterval(() => {
      deleteCountdown -= 1;
      if (deleteCountdown <= 0) {
        resetDeleteArm();
        return;
      }
      document.getElementById('edit-delete-label').textContent = `Delete? (${deleteCountdown})`;
    }, 1000);
    return;
  }

  const block = currentBlocks[editingIndex];
  deleteEntry(anchorKeyForBlock(block), block.id, !!block.crossesMidnight);
  editingIndex = null;
  document.getElementById('edit-dialog').close();
  renderTimeline(currentBlocks);
}

function handleEditSubmit(e) {
  e.preventDefault();
  const label = document.getElementById('edit-label-input').value.trim();
  const start = document.getElementById('edit-start-input').value;
  const end = document.getElementById('edit-end-input').value;
  if (!label || !start || !end) return;
  if (timeToMinutes(end) === timeToMinutes(start)) {
    alert('Start and end time cannot be the same.');
    return;
  }

  if (timeToMinutes(end) < timeToMinutes(start)) {
    const overnightMinutes = (24 * 60 - timeToMinutes(start)) + timeToMinutes(end);
    const proceed = confirm(
      `This spans midnight: ${start} today → ${end} tomorrow (${formatDuration(overnightMinutes)}). Continue?`
    );
    if (!proceed) return;
  }

  const block = currentBlocks[editingIndex];
  // Delete from wherever the old entry actually lived, but always create the
  // edited version anchored to the day currently on screen — same rule Add
  // uses. Otherwise editing from the "tomorrow" half of a linked entry back
  // into a same-day entry would silently place it on yesterday instead.
  deleteEntry(anchorKeyForBlock(block), block.id, !!block.crossesMidnight);
  createEntry(currentKey, label, start, end);

  editingIndex = null;
  document.getElementById('edit-dialog').close();
  renderTimeline(currentBlocks);
}

function handleAddSubmit(e) {
  e.preventDefault();
  const labelInput = document.getElementById('label-input');
  const startInput = document.getElementById('start-input');
  const endInput = document.getElementById('end-input');

  const label = labelInput.value.trim();
  const start = startInput.value;
  const end = endInput.value;

  if (!label || !start || !end) return;
  if (timeToMinutes(end) === timeToMinutes(start)) {
    alert('Start and end time cannot be the same.');
    return;
  }

  if (timeToMinutes(end) < timeToMinutes(start)) {
    // Crosses midnight (e.g. sleep 22:30 -> 06:30): split into a block
    // running to day's end here, and a block from day's start on the next day.
    const overnightMinutes = (24 * 60 - timeToMinutes(start)) + timeToMinutes(end);
    const proceed = confirm(
      `This spans midnight: ${start} today → ${end} tomorrow (${formatDuration(overnightMinutes)}). Continue?`
    );
    if (!proceed) return;
  }

  createEntry(currentKey, label, start, end);
  renderTimeline(currentBlocks);

  labelInput.value = '';
  startInput.value = nowTimeString();
  endInput.value = nowTimeString();
  setAnchorField('end');
  labelInput.focus();
}

function setAnchorField(field) {
  anchorField = field;
  document.getElementById('start-input').classList.toggle('anchor-field', field === 'start');
  document.getElementById('end-input').classList.toggle('anchor-field', field === 'end');
}

function handleChipClick(minutes) {
  const startInput = document.getElementById('start-input');
  const endInput = document.getElementById('end-input');

  if (anchorField === 'start' && startInput.value) {
    endInput.value = minutesToTime(timeToMinutes(startInput.value) + minutes);
  } else if (endInput.value) {
    startInput.value = minutesToTime(timeToMinutes(endInput.value) - minutes);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  currentDate = new Date();
  loadCurrentDay();

  document.getElementById('prev-day').addEventListener('click', () => goToDate(addDays(currentDate, -1)));
  document.getElementById('next-day').addEventListener('click', () => goToDate(addDays(currentDate, 1)));
  document.getElementById('today-btn').addEventListener('click', () => goToDate(new Date()));

  const startInput = document.getElementById('start-input');
  const endInput = document.getElementById('end-input');
  startInput.value = nowTimeString();
  endInput.value = nowTimeString();
  setAnchorField('end');

  startInput.addEventListener('input', () => setAnchorField('start'));
  endInput.addEventListener('input', () => setAnchorField('end'));

  document.querySelectorAll('.chip').forEach((btn) => {
    btn.addEventListener('click', () => handleChipClick(Number(btn.dataset.minutes)));
  });

  document.getElementById('add-form').addEventListener('submit', handleAddSubmit);

  const editDialog = document.getElementById('edit-dialog');
  document.getElementById('edit-form').addEventListener('submit', handleEditSubmit);
  document.getElementById('edit-delete-btn').addEventListener('click', handleEditDeleteClick);
  document.getElementById('edit-cancel-btn').addEventListener('click', () => editDialog.close());
  editDialog.addEventListener('close', resetDeleteArm);
  // Click on the backdrop (target is the <dialog> itself, not a descendant) closes it.
  editDialog.addEventListener('click', (e) => {
    if (e.target === editDialog) editDialog.close();
  });
});
