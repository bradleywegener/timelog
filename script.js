const CATEGORIES = [
  { id: 'deep',        label: 'Deep Work',      color: '#2D6A4F', emoji: '🧠' },
  { id: 'shallow',     label: 'Shallow Work',   color: '#4A7C59', emoji: '📋' },
  { id: 'maintenance', label: 'Maintenance',    color: '#8B6914', emoji: '🔧' },
  { id: 'rest',        label: 'Rest & Leisure', color: '#1B4F72', emoji: '🌿' },
  { id: 'wasted',      label: 'Wasted Time',    color: '#922B21', emoji: '⏳' },
];

let entries = JSON.parse(localStorage.getItem('timelog-entries') || '[]');
let active = JSON.parse(localStorage.getItem('timelog-active') || 'null');
let selectedCat = 'deep';
let timerInterval = null;

function getCat(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[0];
}

function fmtDur(ms) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function todayStr() {
  return new Date().toDateString();
}

function saveEntries() {
  localStorage.setItem('timelog-entries', JSON.stringify(entries));
}

function buildPills() {
  const container = document.getElementById('cat-pills');
  container.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const pill = document.createElement('button');

    pill.className =
      'cat-pill' +
      (cat.id === selectedCat ? ' selected' : '');

    pill.textContent = cat.emoji + ' ' + cat.label;

    if (cat.id === selectedCat) {
      pill.style.borderColor = cat.color;
      pill.style.background = cat.color + '33';
    }

    pill.onclick = () => {
      selectedCat = cat.id;
      buildPills();
    };

    container.appendChild(pill);
  });
}

function startTimer() {
  const label =
    document.getElementById('entry-label').value.trim() ||
    getCat(selectedCat).label;

  active = {
    category: selectedCat,
    label,
    start: Date.now()
  };

  localStorage.setItem(
    'timelog-active',
    JSON.stringify(active)
  );

  document.getElementById('entry-label').blur();

  renderTrack();
  startTick();
}

function stopTimer() {
  if (!active) return;

  const entry = {
    ...active,
    end: Date.now(),
    duration: Date.now() - active.start,
    id: Date.now()
  };

  entries.unshift(entry);
  saveEntries();

  active = null;
  localStorage.removeItem('timelog-active');

  clearInterval(timerInterval);

  document.getElementById('entry-label').value = '';

  renderAll();
}

function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;

  entries = entries.filter(e => e.id !== id);

  saveEntries();
  renderAll();
}

function startTick() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (!active) return;

    const el = document.getElementById('elapsed-display');

    if (el) {
      el.textContent = fmtDur(Date.now() - active.start);
    }
  }, 1000);
}

function renderTrack() {
  const activeCard = document.getElementById('active-card');
  const newCard = document.getElementById('new-entry-card');
  const todayCard = document.getElementById('today-card');

  if (active) {
    activeCard.style.display = 'block';
    newCard.style.display = 'none';

    const cat = getCat(active.category);

    activeCard.style.borderColor = cat.color;

    document.getElementById('pulse-dot').style.background = cat.color;

    document.getElementById('active-label-display').textContent =
      active.label;

    document.getElementById('active-cat-display').textContent =
      cat.label;

    document.getElementById('elapsed-display').textContent =
      fmtDur(Date.now() - active.start);

  } else {
    activeCard.style.display = 'none';
    newCard.style.display = 'block';

    buildPills();
  }

  const todayEntries = entries.filter(
    e => new Date(e.start).toDateString() === todayStr()
  );

  if (!todayEntries.length) {
    todayCard.style.display = 'none';
    return;
  }

  todayCard.style.display = 'block';

  document.getElementById('today-total').textContent =
    fmtDur(
      todayEntries.reduce((s, e) => s + e.duration, 0)
    ) + ' tracked';

  const container = document.getElementById('today-entries');
  container.innerHTML = '';

  todayEntries.slice(0, 6).forEach(e => {
    const cat = getCat(e.category);

    const div = document.createElement('div');
    div.className = 'today-entry';

    div.innerHTML = `
      <div style="width:3px;height:32px;border-radius:2px;background:${cat.color};flex-shrink:0"></div>

      <div style="flex:1;min-width:0">
        <div class="entry-name">${e.label}</div>
        <div class="entry-meta">
          ${fmtTime(e.start)} → ${fmtTime(e.end)}
        </div>
      </div>

      <div class="entry-dur">
        ${fmtDur(e.duration)}
      </div>
    `;

    container.appendChild(div);
  });
}

function renderLog() {
  const container = document.getElementById('log-content');

  if (!entries.length) {
    container.innerHTML =
      '<div class="empty">No entries yet. Start tracking!</div>';

    return;
  }

  const groups = {};

  entries.forEach(e => {
    const d = fmtDate(e.start);

    if (!groups[d]) {
      groups[d] = [];
    }

    groups[d].push(e);
  });

  container.innerHTML = '';

  Object.entries(groups).forEach(([date, dayEntries]) => {

    const total =
      dayEntries.reduce((s, e) => s + e.duration, 0);

    const group = document.createElement('div');
    group.className = 'day-group';

    const header = document.createElement('div');
    header.className = 'day-header';

    header.innerHTML = `
      <span>${date}</span>
      <span>${fmtDur(total)}</span>
    `;

    group.appendChild(header);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.padding = '0';
    card.style.overflow = 'hidden';

    dayEntries.forEach(e => {
      const cat = getCat(e.category);

      const div = document.createElement('div');
      div.className = 'entry';

      div.innerHTML = `
        <div class="entry-bar" style="background:${cat.color}"></div>

        <div style="font-size:18px">
          ${cat.emoji}
        </div>

        <div class="entry-info">
          <div class="entry-name">
            ${e.label}
          </div>

          <div class="entry-meta">
            ${cat.label} ·
            ${fmtTime(e.start)} –
            ${fmtTime(e.end)}
          </div>
        </div>

        <div class="entry-dur">
          ${fmtDur(e.duration)}
        </div>

        <button
          class="btn-del"
          onclick="deleteEntry(${e.id})"
        >
          ×
        </button>
      `;

      card.appendChild(div);
    });

    group.appendChild(card);
    container.appendChild(group);
  });
}

function renderInsights() {
  const todayEntries = entries.filter(
    e => new Date(e.start).toDateString() === todayStr()
  );

  const totalToday =
    todayEntries.reduce((s, e) => s + e.duration, 0);

  const barsEl = document.getElementById('today-bars');

  if (!totalToday) {

    barsEl.innerHTML =
      '<div class="empty" style="padding:20px 0">No data for today yet.</div>';

  } else {

    const cats = CATEGORIES
      .map(cat => {

        const t = todayEntries
          .filter(e => e.category === cat.id)
          .reduce((s, e) => s + e.duration, 0);

        return {
          ...cat,
          total: t,
          pct: Math.round((t / totalToday) * 100)
        };
      })
      .filter(c => c.total > 0);

    barsEl.innerHTML = '';

    cats.forEach(cat => {

      const div = document.createElement('div');
      div.className = 'bar-row';

      div.innerHTML = `
        <div class="bar-labels">
          <span>
            ${cat.emoji} ${cat.label}
          </span>

          <span style="color:#7D8590">
            ${fmtDur(cat.total)} · ${cat.pct}%
          </span>
        </div>

        <div class="bar-track">
          <div
            class="bar-fill"
            style="width:0%;background:${cat.color}"
            data-pct="${cat.pct}"
          ></div>
        </div>
      `;

      barsEl.appendChild(div);
    });

    setTimeout(() => {
      document
        .querySelectorAll('.bar-fill')
        .forEach(el => {
          el.style.width = el.dataset.pct + '%';
        });
    }, 50);

    const hr = document.createElement('hr');
    hr.className = 'divider';

    barsEl.appendChild(hr);

    const row = document.createElement('div');
    row.className = 'total-row';

    row.innerHTML = `
      <span style="color:#7D8590">
        Total tracked today
      </span>

      <span>
        ${fmtDur(totalToday)}
      </span>
    `;

    barsEl.appendChild(row);
  }

  const totalAll =
    entries.reduce((s, e) => s + e.duration, 0);

  const days =
    new Set(
      entries.map(e => new Date(e.start).toDateString())
    ).size;

  const catTotals = CATEGORIES
    .map(cat => ({
      cat,
      total: entries
        .filter(e => e.category === cat.id)
        .reduce((s, e) => s + e.duration, 0)
    }))
    .sort((a, b) => b.total - a.total);

  const topCat =
    catTotals[0]?.total > 0
      ? `${catTotals[0].cat.emoji} ${catTotals[0].cat.label}`
      : '—';

  document.getElementById('all-time-stats').innerHTML = [
    {
      label: 'Total entries',
      value: entries.length || '—'
    },
    {
      label: 'Total time',
      value: totalAll > 0 ? fmtDur(totalAll) : '—'
    },
    {
      label: 'Days tracked',
      value: days || '—'
    },
    {
      label: 'Top category',
      value: topCat
    }
  ]
    .map(s => `
      <div class="stat-card">
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `)
    .join('');
}

function renderAll() {
  renderTrack();
  renderLog();
  renderInsights();
}

function switchView(v, btn) {
  document
    .querySelectorAll('.view')
    .forEach(el => el.classList.remove('active'));

  document
    .querySelectorAll('.nav-btn')
    .forEach(el => el.classList.remove('active'));

  document
    .getElementById('view-' + v)
    .classList.add('active');

  btn.classList.add('active');

  document.getElementById('content').scrollTop = 0;
}

buildPills();
renderAll();

if (active) {
  startTick();
}