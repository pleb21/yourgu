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

let currentKey;
let currentBlocks;
let anchorField = 'end'; // 'start' or 'end' — which time field duration chips fill relative to

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
  blocks.forEach((b, index) => {
    const el = document.createElement('div');
    el.className = 'activity-block';
    const startMin = timeToMinutes(b.start);
    const endMin = timeToMinutes(b.end);
    el.style.top = `calc(${startMin} / 60 * var(--hour-height))`;
    el.style.height = `calc(${endMin - startMin} / 60 * var(--hour-height))`;
    el.textContent = b.label;
    el.title = 'Click to delete';
    el.addEventListener('click', () => handleBlockClick(index));
    blocksLayer.appendChild(el);
  });
  timeline.appendChild(blocksLayer);
}

function renderDate() {
  const el = document.getElementById('current-date');
  const today = new Date();
  el.textContent = today.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function persistAndRender() {
  saveDay(currentKey, currentBlocks);
  renderTimeline(currentBlocks);
}

function handleBlockClick(index) {
  const block = currentBlocks[index];
  if (confirm(`Delete "${block.label}" (${block.start}-${block.end})?`)) {
    currentBlocks.splice(index, 1);
    persistAndRender();
  }
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
  if (timeToMinutes(end) <= timeToMinutes(start)) {
    alert('End time must be after start time.');
    return;
  }

  currentBlocks.push({ start, end, label });
  currentBlocks.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  persistAndRender();

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
  renderDate();
  currentKey = dateKey(new Date());
  currentBlocks = loadDay(currentKey);
  renderTimeline(currentBlocks);

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
});
