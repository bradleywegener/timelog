/* ==================================================
   CATEGORIES
   ================================================== */

const CATEGORIES = [
  {
    id: 'deep',
    label: 'Deep Work',
    color: '#5FB38A',
    emoji: '🧠'
  },
  {
    id: 'shallow',
    label: 'Shallow Work',
    color: '#82B98A',
    emoji: '📋'
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    color: '#C7A85A',
    emoji: '🔧'
  },
  {
    id: 'rest',
    label: 'Rest & Leisure',
    color: '#5B9BC7',
    emoji: '🌿'
  },
  {
    id: 'wasted',
    label: 'Wasted Time',
    color: '#C96A6A',
    emoji: '⏳'
  }
];


/* ==================================================
   STATE
   ================================================== */

let entries = JSON.parse(
  localStorage.getItem('timelog-entries') || '[]'
);

let active = JSON.parse(
  localStorage.getItem('timelog-active') || 'null'
);

let selectedCat = 'deep';

let timerInterval = null;

let insightDate = new Date();

/* ==================================================
   THEME
   ================================================== */

function applyTheme(theme) {

  document.documentElement.dataset.theme = theme;

  localStorage.setItem(
    'timelog-theme',
    theme
  );

}


function toggleTheme() {

  const currentTheme =
    document.documentElement.dataset.theme
    || 'dark';

  const newTheme =
    currentTheme === 'dark'
      ? 'light'
      : 'dark';

  applyTheme(newTheme);

}


function initialiseTheme() {

  const savedTheme =
    localStorage.getItem(
      'timelog-theme'
    );

  if (
    savedTheme === 'light'
    || savedTheme === 'dark'
  ) {

    applyTheme(savedTheme);

    return;

  }


  /* Default to dark mode */

  applyTheme('dark');

}


/* ==================================================
   HELPERS
   ================================================== */

function getCat(id) {
  return (
    CATEGORIES.find(c => c.id === id)
    || CATEGORIES[0]
  );
}


function fmtDur(ms) {

  const s = Math.floor(ms / 1000);

  const h = Math.floor(s / 3600);

  const m = Math.floor(
    (s % 3600) / 60
  );

  const sec = s % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }

  if (m > 0) {
    return `${m}m ${sec}s`;
  }

  return `${sec}s`;
}


function fmtTime(ts) {

  return new Date(ts).toLocaleTimeString(
    [],
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );
}


function fmtDate(ts) {

  return new Date(ts).toLocaleDateString(
    [],
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    }
  );
}


function todayStr() {

  return new Date().toDateString();

}


function saveEntries() {

  localStorage.setItem(
    'timelog-entries',
    JSON.stringify(entries)
  );

}


/* ==================================================
   DATE HELPERS
   ================================================== */

function dateKey(date) {

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).toDateString();

}


function isSameDay(dateA, dateB) {

  return dateKey(dateA) === dateKey(dateB);

}


function getEntriesForDay(date) {

  return entries.filter(entry =>
    isSameDay(
      new Date(entry.start),
      date
    )
  );

}


function getStartOfWeek(date) {

  const d = new Date(date);

  const day = d.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  d.setDate(
    d.getDate() + difference
  );

  d.setHours(
    0, 0, 0, 0
  );

  return d;

}


function formatShortDay(date) {

  return date.toLocaleDateString(
    [],
    {
      weekday: 'short'
    }
  );

}


function formatShortDate(date) {

  return date.toLocaleDateString(
    [],
    {
      day: 'numeric',
      month: 'short'
    }
  );

}


/* ==================================================
   CATEGORY PILLS
   ================================================== */

function buildPills() {

  const container =
    document.getElementById(
      'cat-pills'
    );

  container.innerHTML = '';

  CATEGORIES.forEach(cat => {

    const pill =
      document.createElement('button');

    pill.className =
      'cat-pill'
      + (
        cat.id === selectedCat
          ? ' selected'
          : ''
      );

    pill.textContent =
      cat.emoji + ' ' + cat.label;

    if (cat.id === selectedCat) {

      pill.style.borderColor =
        cat.color;

      pill.style.background =
        cat.color + '22';

    }

    pill.onclick = () => {

      selectedCat =
        cat.id;

      buildPills();

    };

    container.appendChild(pill);

  });

}


/* ==================================================
   TIMER
   ================================================== */

function startTimer() {

  const label =
    document
      .getElementById('entry-label')
      .value
      .trim()
    || getCat(selectedCat).label;

  active = {
    category: selectedCat,
    label,
    start: Date.now()
  };

  localStorage.setItem(
    'timelog-active',
    JSON.stringify(active)
  );

  document
    .getElementById('entry-label')
    .blur();

  renderTrack();

  startTick();

}


function stopTimer() {

  if (!active) return;

  const end =
    Date.now();

  const entry = {
    ...active,
    end,
    duration:
      end - active.start,
    id: end
  };

  entries.unshift(entry);

  saveEntries();

  active = null;

  localStorage.removeItem(
    'timelog-active'
  );

  clearInterval(
    timerInterval
  );

  document
    .getElementById('entry-label')
    .value = '';

  renderAll();

}


function deleteEntry(id) {

  if (!confirm(
    'Delete this entry?'
  )) {
    return;
  }

  entries =
    entries.filter(
      e => e.id !== id
    );

  saveEntries();

  renderAll();

}


function startTick() {

  clearInterval(
    timerInterval
  );

  timerInterval =
    setInterval(() => {

      if (!active) return;

      const el =
        document.getElementById(
          'elapsed-display'
        );

      if (el) {

        el.textContent =
          fmtDur(
            Date.now() -
            active.start
          );

      }

    }, 1000);

}


/* ==================================================
   TRACK VIEW
   ================================================== */

function renderTrack() {

  const activeCard =
    document.getElementById(
      'active-card'
    );

  const newCard =
    document.getElementById(
      'new-entry-card'
    );

  const todayCard =
    document.getElementById(
      'today-card'
    );


  if (active) {

    activeCard.style.display =
      'block';

    newCard.style.display =
      'none';

    const cat =
      getCat(
        active.category
      );

    activeCard.style.borderColor =
      cat.color;

    document
      .getElementById(
        'pulse-dot'
      )
      .style.background =
      cat.color;

    document
      .getElementById(
        'active-label-display'
      )
      .textContent =
      active.label;

    document
      .getElementById(
        'active-cat-display'
      )
      .textContent =
      cat.label;

    document
      .getElementById(
        'elapsed-display'
      )
      .textContent =
      fmtDur(
        Date.now() -
        active.start
      );

  } else {

    activeCard.style.display =
      'none';

    newCard.style.display =
      'block';

    buildPills();

  }


  const todayEntries =
    getEntriesForDay(
      new Date()
    );


  if (!todayEntries.length) {

    todayCard.style.display =
      'none';

    return;

  }


  todayCard.style.display =
    'block';


  document
    .getElementById(
      'today-total'
    )
    .textContent =
    fmtDur(
      todayEntries.reduce(
        (sum, entry) =>
          sum + entry.duration,
        0
      )
    ) + ' tracked';


  const container =
    document.getElementById(
      'today-entries'
    );

  container.innerHTML = '';


  todayEntries
    .slice(0, 6)
    .forEach(entry => {

      const cat =
        getCat(
          entry.category
        );

      const div =
        document.createElement(
          'div'
        );

      div.className =
        'today-entry';

      div.innerHTML = `

        <div
          class="category-bar"
          style="
            --category-color:${cat.color};
          "
        ></div>

        <div
          style="
            flex:1;
            min-width:0;
          "
        >

          <div class="entry-name">
            ${entry.label}
          </div>

          <div class="entry-meta">
            ${fmtTime(entry.start)}
            →
            ${fmtTime(entry.end)}
          </div>

        </div>

        <div class="entry-dur">
          ${fmtDur(entry.duration)}
        </div>

      `;

      container.appendChild(
        div
      );

    });

}


/* ==================================================
   LOG VIEW
   ================================================== */

function renderLog() {

  const container =
    document.getElementById(
      'log-content'
    );

  if (!entries.length) {

    container.innerHTML =
      '<div class="empty">No entries yet. Start tracking!</div>';

    return;

  }


  const groups = {};


  entries.forEach(entry => {

    const date =
      fmtDate(entry.start);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(entry);

  });


  container.innerHTML = '';


  Object.entries(groups)
    .forEach(
      ([date, dayEntries]) => {

        const total =
          dayEntries.reduce(
            (sum, entry) =>
              sum + entry.duration,
            0
          );


        const group =
          document.createElement(
            'div'
          );

        group.className =
          'day-group';


        const header =
          document.createElement(
            'div'
          );

        header.className =
          'day-header';

        header.innerHTML = `
          <span>${date}</span>
          <span>${fmtDur(total)}</span>
        `;

        group.appendChild(
          header
        );


        const card =
          document.createElement(
            'div'
          );

        card.className =
          'card log-card';


        dayEntries.forEach(entry => {

          const cat =
            getCat(
              entry.category
            );

          const div =
            document.createElement(
              'div'
            );

          div.className =
            'entry';

          div.innerHTML = `

            <div
              class="
                entry-bar
                category-entry-bar
              "
              style="
                --category-color:${cat.color};
              "
            ></div>

            <div class="category-icon">
              ${cat.emoji}
            </div>

            <div class="entry-info">

              <div class="entry-name">
                ${entry.label}
              </div>

              <div class="entry-meta">
                ${cat.label}
                ·
                ${fmtTime(entry.start)}
                –
                ${fmtTime(entry.end)}
              </div>

            </div>

            <div class="entry-dur">
              ${fmtDur(entry.duration)}
            </div>

            <button
              class="btn-del"
              onclick="deleteEntry(${entry.id})"
              aria-label="Delete entry"
            >
              ×
            </button>

          `;

          card.appendChild(
            div
          );

        });


        group.appendChild(
          card
        );

        container.appendChild(
          group
        );

      }
    );

}


/* ==================================================
   INSIGHTS — SELECTED DAY
   ================================================== */

function changeInsightDay(amount) {

  const newDate =
    new Date(insightDate);

  newDate.setDate(
    newDate.getDate() + amount
  );


  const today =
    new Date();

  today.setHours(
    0, 0, 0, 0
  );

  newDate.setHours(
    0, 0, 0, 0
  );


  if (newDate > today) {
    return;
  }


  insightDate =
    newDate;

  renderInsights();

}


function renderSelectedDay() {

  const entriesForDay =
    getEntriesForDay(
      insightDate
    );


  const total =
    entriesForDay.reduce(
      (sum, entry) =>
        sum + entry.duration,
      0
    );


  const labelEl =
    document.getElementById(
      'insights-date-label'
    );

  const totalEl =
    document.getElementById(
      'insights-date-total'
    );


  if (
    isSameDay(
      insightDate,
      new Date()
    )
  ) {

    labelEl.textContent =
      'TODAY';

  } else {

    labelEl.textContent =
      insightDate
        .toLocaleDateString(
          [],
          {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          }
        )
        .toUpperCase();

  }


  totalEl.textContent =
    total > 0
      ? fmtDur(total)
      : 'No time tracked';


  const previousBtn =
    document.getElementById(
      'previous-day'
    );

  const nextBtn =
    document.getElementById(
      'next-day'
    );


  previousBtn.disabled =
    false;

  nextBtn.disabled =
    isSameDay(
      insightDate,
      new Date()
    );


  const barsEl =
    document.getElementById(
      'selected-day-bars'
    );


  if (!total) {

    barsEl.innerHTML = `
      <div class="empty empty-small">
        No data for this day.
      </div>
    `;

    return;

  }


  const cats =
    CATEGORIES
      .map(cat => {

        const categoryTotal =
          entriesForDay
            .filter(
              entry =>
                entry.category === cat.id
            )
            .reduce(
              (sum, entry) =>
                sum + entry.duration,
              0
            );

        return {
          ...cat,
          total: categoryTotal,
          pct: Math.round(
            categoryTotal /
            total *
            100
          )
        };

      })
      .filter(
        cat =>
          cat.total > 0
      );


  barsEl.innerHTML = '';


  cats.forEach(cat => {

    const div =
      document.createElement(
        'div'
      );

    div.className =
      'bar-row';

    div.innerHTML = `

      <div class="bar-labels">

        <span>
          ${cat.emoji}
          ${cat.label}
        </span>

        <span class="bar-value">
          ${fmtDur(cat.total)}
          ·
          ${cat.pct}%
        </span>

      </div>

      <div class="bar-track">

        <div
          class="bar-fill"
          style="
            width:0%;
            background:${cat.color};
          "
          data-pct="${cat.pct}"
        ></div>

      </div>

    `;

    barsEl.appendChild(
      div
    );

  });


  const hr =
    document.createElement(
      'hr'
    );

  hr.className =
    'divider';

  barsEl.appendChild(
    hr
  );


  const row =
    document.createElement(
      'div'
    );

  row.className =
    'total-row';

  row.innerHTML = `

    <span class="total-label">
      Total tracked
    </span>

    <span class="total-value">
      ${fmtDur(total)}
    </span>

  `;

  barsEl.appendChild(
    row
  );


  setTimeout(() => {

    barsEl
      .querySelectorAll(
        '.bar-fill'
      )
      .forEach(el => {

        el.style.width =
          el.dataset.pct + '%';

      });

  }, 50);

}


/* ==================================================
   INSIGHTS — WEEK
   ================================================== */

function renderWeeklyBreakdown() {

  const container =
    document.getElementById(
      'weekly-breakdown'
    );

  const start =
    getStartOfWeek(
      insightDate
    );


  const days = [];


  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const date =
      new Date(start);

    date.setDate(
      start.getDate() + i
    );

    days.push(
      date
    );

  }


  const totals =
    days.map(day => {

      const dayEntries =
        getEntriesForDay(
          day
        );

      return dayEntries.reduce(
        (sum, entry) =>
          sum + entry.duration,
        0
      );

    });


  const weekTotal =
    totals.reduce(
      (sum, value) =>
        sum + value,
      0
    );


  document
    .getElementById(
      'weekly-total'
    )
    .textContent =
    weekTotal > 0
      ? fmtDur(weekTotal)
      : 'No time tracked';


  if (!weekTotal) {

    container.innerHTML = `
      <div class="empty empty-small">
        No data for this week.
      </div>
    `;

    return;

  }


  const maxTotal =
    Math.max(
      ...totals,
      1
    );


  container.innerHTML = '';


  days.forEach(
    (day, index) => {

      const dayTotal =
        totals[index];


      const dayEntries =
        getEntriesForDay(
          day
        );


      const row =
        document.createElement(
          'div'
        );

      row.className =
        'weekly-row';


      const isSelected =
        isSameDay(
          day,
          insightDate
        );


      if (isSelected) {

        row.classList.add(
          'selected-week-day'
        );

      }


      let segments = '';


      if (dayTotal > 0) {

        CATEGORIES.forEach(
          cat => {

            const categoryTotal =
              dayEntries
                .filter(
                  entry =>
                    entry.category ===
                    cat.id
                )
                .reduce(
                  (sum, entry) =>
                    sum +
                    entry.duration,
                  0
                );


            if (!categoryTotal) {
              return;
            }


            const width =
              categoryTotal /
              dayTotal *
              100;


            segments += `

              <div
                class="weekly-segment"
                style="
                  width:${width}%;
                  background:${cat.color};
                "
              ></div>

            `;

          }
        );

      }


      const barWidth =
        dayTotal > 0
          ? Math.max(
              4,
              dayTotal /
              maxTotal *
              100
            )
          : 0;


      row.innerHTML = `

        <div class="weekly-day">

          <div class="weekly-day-name">
            ${formatShortDay(day)}
          </div>

          <div class="weekly-day-date">
            ${formatShortDate(day)}
          </div>

        </div>


        <div class="weekly-bar-area">

          <div
            class="weekly-bar"
            style="
              width:${barWidth}%;
            "
          >
            ${segments}
          </div>

        </div>


        <div class="weekly-day-total">

          ${
            dayTotal > 0
              ? fmtDur(dayTotal)
              : '—'
          }

        </div>

      `;


      container.appendChild(
        row
      );

    }
  );

}


/* ==================================================
   INSIGHTS — ALL TIME
   ================================================== */

function renderAllTimeStats() {

  const totalAll =
    entries.reduce(
      (sum, entry) =>
        sum + entry.duration,
      0
    );


  const days =
    new Set(
      entries.map(
        entry =>
          new Date(
            entry.start
          ).toDateString()
      )
    ).size;


  const catTotals =
    CATEGORIES
      .map(cat => ({

        cat,

        total:
          entries
            .filter(
              entry =>
                entry.category ===
                cat.id
            )
            .reduce(
              (sum, entry) =>
                sum +
                entry.duration,
              0
            )

      }))
      .sort(
        (a, b) =>
          b.total - a.total
      );


  const topCat =
    catTotals[0]?.total > 0
      ? `${catTotals[0].cat.emoji} ${catTotals[0].cat.label}`
      : '—';


  document
    .getElementById(
      'all-time-stats'
    )
    .innerHTML = [

      {
        label: 'Total entries',
        value:
          entries.length || '—'
      },

      {
        label: 'Total time',
        value:
          totalAll > 0
            ? fmtDur(totalAll)
            : '—'
      },

      {
        label: 'Days tracked',
        value:
          days || '—'
      },

      {
        label: 'Top category',
        value:
          topCat
      }

    ]
    .map(stat => `

      <div class="stat-card">

        <div class="stat-label">
          ${stat.label}
        </div>

        <div class="stat-value">
          ${stat.value}
        </div>

      </div>

    `)
    .join('');

}


/* ==================================================
   INSIGHTS
   ================================================== */

function renderInsights() {

  renderSelectedDay();

  renderWeeklyBreakdown();

  renderAllTimeStats();

}


/* ==================================================
   RENDER EVERYTHING
   ================================================== */

function renderAll() {

  renderTrack();

  renderLog();

  renderInsights();

}


/* ==================================================
   NAVIGATION
   ================================================== */

function switchView(v, btn) {

  document
    .querySelectorAll('.view')
    .forEach(el =>
      el.classList.remove(
        'active'
      )
    );


  document
    .querySelectorAll('.nav-btn')
    .forEach(el =>
      el.classList.remove(
        'active'
      )
    );


  document
    .getElementById(
      'view-' + v
    )
    .classList.add(
      'active'
    );


  btn.classList.add(
    'active'
  );


  document
    .getElementById(
      'content'
    )
    .scrollTop = 0;

}


/* ==================================================
   VERSION
   ================================================== */

async function loadVersion() {
  try {
    const response = await fetch('version.json', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Could not load version.json');
    }

    const data = await response.json();

    document.querySelectorAll('[data-version]').forEach(el => {
      el.textContent = `v${data.version}`;
    });
  } catch (error) {
    console.error('Could not load app version:', error);
  }
}


/* ==================================================
   SERVICE WORKER
   ================================================== */

function registerServiceWorker() {

  if (
    'serviceWorker' in navigator
  ) {

    window.addEventListener(
      'load',
      async () => {

        try {

          const registration =
            await navigator.serviceWorker.register(
              'sw.js'
            );

          console.log(
            'Service worker registered:',
            registration.scope
          );

          /*
           * Ask the browser to check whether
           * a newer service worker is available.
           */

          await registration.update();

        } catch (error) {

          console.error(
            'Service worker registration failed:',
            error
          );

        }

      }
    );

  }

}


/* ==================================================
   INITIALISE
   ================================================== */

initialiseTheme();

buildPills();

renderAll();

loadVersion();

registerServiceWorker();

if (active) {
  startTick();
}