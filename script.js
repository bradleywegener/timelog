/* ==================================================
   CATEGORIES
   ================================================== */

const CATEGORIES = [
  {
    id: 'focus',
    label: 'Focus',
    color: '#5FB38A',
    emoji: '🎯'
  },
  {
    id: 'admin',
    label: 'Admin',
    color: '#82B98A',
    emoji: '📋'
  },
  {
    id: 'life',
    label: 'Life',
    color: '#C7A85A',
    emoji: '🏠'
  },
  {
    id: 'leisure',
    label: 'Leisure',
    color: '#5B9BC7',
    emoji: '🌿'
  },
  {
    id: 'sleep',
    label: 'Sleep',
    color: '#8274B8',
    emoji: '😴'
  },
  {
    id: 'wasted',
    label: 'Wasted',
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

let selectedCat = 'focus';

let editingUntrackedId = null;

let editingUntrackedCat = 'focus';

let timerInterval = null;

let insightDate = new Date();

const UNTRACKED_GRACE_MS = 15 * 60 * 1000;

let untrackedEntries = JSON.parse(
  localStorage.getItem('timelog-untracked') || '[]'
);

let untrackedActive = JSON.parse(
  localStorage.getItem('timelog-untracked-active') || 'null'
);

/* ==================================================
   THEME
   ================================================== */

function applyTheme(theme) {

  document.documentElement.dataset.theme =
    theme;

  localStorage.setItem(
    'timelog-theme',
    theme
  );

  const themeLabel =
    document.getElementById(
      'theme-label'
    );

  if (themeLabel) {

    themeLabel.textContent =
      theme === 'dark'
        ? 'Dark mode'
        : 'Light mode';

  }

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
   MENU
   ================================================== */

function toggleMenu() {

  const menu =
    document.getElementById('app-menu');

  const backdrop =
    document.getElementById('menu-backdrop');

  const button =
    document.getElementById('menu-toggle');

  const isOpen =
    menu.classList.contains('open');

  if (isOpen) {
    closeMenu();
    return;
  }

  menu.classList.add('open');

  backdrop.classList.add('open');

  button.classList.add('open');

  button.setAttribute(
    'aria-expanded',
    'true'
  );

  menu.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closeMenu() {

  const menu =
    document.getElementById('app-menu');

  const backdrop =
    document.getElementById('menu-backdrop');

  const button =
    document.getElementById('menu-toggle');

  menu.classList.remove('open');

  backdrop.classList.remove('open');

  button.classList.remove('open');

  button.setAttribute(
    'aria-expanded',
    'false'
  );

  menu.setAttribute(
    'aria-hidden',
    'true'
  );

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

function saveUntrackedEntries() {
  localStorage.setItem(
    'timelog-untracked',
    JSON.stringify(untrackedEntries)
  );
}

function saveUntrackedActive() {
  if (untrackedActive) {
    localStorage.setItem(
      'timelog-untracked-active',
      JSON.stringify(untrackedActive)
    );
  } else {
    localStorage.removeItem(
      'timelog-untracked-active'
    );
  }
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

function getUntrackedEntriesForDay(date) {

  return untrackedEntries.filter(
    entry =>
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

function openUntrackedEditor(id) {

  const entry =
    untrackedEntries.find(
      e => e.id === id
    );

  if (!entry) {
    return;
  }

  editingUntrackedId = id;

  editingUntrackedCat =
    'focus';

  const modal =
    document.getElementById(
      'edit-modal'
    );

  const backdrop =
    document.getElementById(
      'edit-modal-backdrop'
    );

  const labelInput =
    document.getElementById(
      'edit-entry-label'
    );

  const timeDisplay =
    document.getElementById(
      'edit-modal-time'
    );

  timeDisplay.textContent =
    `${fmtTime(entry.start)} → ${fmtTime(entry.end)} · ${fmtDur(entry.duration)}`;

  labelInput.value =
    entry.label || '';

  buildEditCatPills();

  modal.classList.add('open');
  backdrop.classList.add('open');

}

function buildEditCatPills() {

  const container =
    document.getElementById(
      'edit-cat-pills'
    );

  container.innerHTML = '';

  CATEGORIES.forEach(cat => {

    const pill =
      document.createElement(
        'button'
      );

    pill.className =
      'cat-pill' +
      (
        cat.id === editingUntrackedCat
          ? ' selected'
          : ''
      );

    pill.textContent =
      cat.emoji +
      ' ' +
      cat.label;

    if (
      cat.id === editingUntrackedCat
    ) {

      pill.style.borderColor =
        cat.color;

      pill.style.background =
        cat.color + '22';

    }

    pill.onclick = () => {

      editingUntrackedCat =
        cat.id;

      buildEditCatPills();

    };

    container.appendChild(
      pill
    );

  });

}

function closeUntrackedEditor() {

  document
    .getElementById(
      'edit-modal'
    )
    .classList.remove('open');

  document
    .getElementById(
      'edit-modal-backdrop'
    )
    .classList.remove('open');

  editingUntrackedId =
    null;

}

function saveUntrackedClassification() {

  if (!editingUntrackedId) {
    return;
  }

  const entry =
    untrackedEntries.find(
      e =>
        e.id ===
        editingUntrackedId
    );

  if (!entry) {
    return;
  }

  const cat =
    getCat(
      editingUntrackedCat
    );

  const label =
    document
      .getElementById(
        'edit-entry-label'
      )
      .value
      .trim();

  /*
   * Convert the untracked period
   * into a normal entry.
   */

  entries.unshift({

    id: Date.now(),

    category:
      cat.id,

    label:
      label ||
      cat.label,

    start:
      entry.start,

    end:
      entry.end,

    duration:
      entry.duration

  });

  /*
   * Remove it from untracked time.
   */

  untrackedEntries =
    untrackedEntries.filter(
      e =>
        e.id !==
        editingUntrackedId
    );

  saveEntries();
  saveUntrackedEntries();

  closeUntrackedEditor();

  renderAll();

}

/* ==================================================
   UNTRACKED TIME
   ================================================== */

function startUntracked(startTime) {

  untrackedActive = {
    start: startTime
  };

  saveUntrackedActive();
}


function finishUntracked(endTime) {

  if (!untrackedActive) {
    return;
  }

  const duration =
    endTime -
    untrackedActive.start;

  if (duration <= 0) {
    untrackedActive = null;
    saveUntrackedActive();
    return;
  }

  untrackedEntries.unshift({
    id: Date.now(),
    start: untrackedActive.start,
    end: endTime,
    duration,
    label: null,
    category: null
  });

  saveUntrackedEntries();

  untrackedActive = null;

  saveUntrackedActive();
}

function classifyUntrackedEntry(id) {

  const entry =
    untrackedEntries.find(
      e => e.id === id
    );

  if (!entry) {
    return;
  }

  const catId =
    prompt(
      'Enter category: ' +
      CATEGORIES
        .map(c => c.label)
        .join(', ')
    );

  if (!catId) {
    return;
  }

  const category =
    CATEGORIES.find(
      c =>
        c.label.toLowerCase() ===
        catId.trim().toLowerCase()
    );

  if (!category) {
    alert(
      'Category not recognised.'
    );
    return;
  }

  const label =
    prompt(
      'Enter a name (optional):',
      category.label
    );

  /*
   * Turn the untracked period into
   * a normal tracked entry.
   */

  entries.unshift({
    id: Date.now(),
    category: category.id,
    label:
      label &&
      label.trim()
        ? label.trim()
        : category.label,
    start: entry.start,
    end: entry.end,
    duration: entry.duration
  });

  /*
   * Remove it from untracked time.
   */

  untrackedEntries =
    untrackedEntries.filter(
      e => e.id !== id
    );

  saveEntries();
  saveUntrackedEntries();

  renderAll();

}


function resolveUntrackedForNewActivity(startTime) {

  if (!untrackedActive) {
    return startTime;
  }

  const gap =
    startTime -
    untrackedActive.start;

  /*
   * Short gap:
   * absorb it into the new activity.
   */
  if (gap < UNTRACKED_GRACE_MS) {

    const originalStart =
      untrackedActive.start;

    untrackedActive = null;

    saveUntrackedActive();

    return originalStart;
  }

  /*
   * Long gap:
   * preserve it as an untracked entry.
   */
  finishUntracked(startTime);

  return startTime;
}


/* ==================================================
   TIMER
   ================================================== */

function startTimer() {

  const actualStart = Date.now();

  const label =
    document
      .getElementById('entry-label')
      .value
      .trim()
    || getCat(selectedCat).label;

  const activityStart =
    resolveUntrackedForNewActivity(
      actualStart
    );

  active = {
    category: selectedCat,
    label,
    start: activityStart
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

  if (!active) {
    return;
  }

  const end = Date.now();

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

  clearInterval(timerInterval);

  document
    .getElementById('entry-label')
    .value = '';

  /*
   * The moment a tracked activity ends,
   * an untracked period begins.
   */
  startUntracked(end);

  renderAll();

  startTick();
}


function deleteEntry(id) {

  if (!confirm(
    'Delete this entry? Its time will become untracked.'
  )) {
    return;
  }

  const entry =
    entries.find(
      e => e.id === id
    );

  if (!entry) {
    return;
  }

  /*
   * Convert the deleted activity into
   * an untracked period.
   */

  untrackedEntries.unshift({
    id: Date.now(),
    start: entry.start,
    end: entry.end,
    duration: entry.duration,
    label: null,
    category: null
  });

  saveUntrackedEntries();

  /*
   * Now remove the original tracked entry.
   */

  entries =
    entries.filter(
      e => e.id !== id
    );

  saveEntries();

  renderAll();

}


/* ==================================================
   TIMER TICK
   ================================================== */

function startTick() {

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {

    if (active) {

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

    } else if (untrackedActive) {

      const el =
        document.getElementById(
          'untracked-time'
        );

      if (el) {

        el.textContent =
          fmtDur(
            Date.now() -
            untrackedActive.start
          );

      }

    }

    /*
     * Keep the header timer in sync.
     */

    renderHeaderActivity();

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

    if (untrackedActive) {

      const elapsed =
        Date.now() -
        untrackedActive.start;

      /*
      * The existing new-entry card remains
      * usable, but we'll show the current
      * untracked duration above it.
      */

      let untrackedDisplay =
        document.getElementById(
          'untracked-display'
        );

      if (!untrackedDisplay) {

        untrackedDisplay =
          document.createElement('div');

        untrackedDisplay.id =
          'untracked-display';

        untrackedDisplay.className =
          'untracked-display';

        newCard.insertBefore(
          untrackedDisplay,
          newCard.firstChild
        );
      }

      untrackedDisplay.innerHTML = `

        <div class="section-label">
          untracked
        </div>

        <div class="untracked-time" id="untracked-time">
          ${fmtDur(elapsed)}
        </div>

        <div class="untracked-meta">
          Since ${fmtTime(untrackedActive.start)}
        </div>

      `;

    } else {

      const existing =
        document.getElementById(
          'untracked-display'
        );

      if (existing) {
        existing.remove();
      }
    }
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
   HEADER ACTIVITY
   ================================================== */

function renderHeaderActivity() {

  const activity =
    document.getElementById(
      'header-activity'
    );

  const name =
    document.getElementById(
      'header-activity-name'
    );

  const meta =
    document.getElementById(
      'header-activity-meta'
    );

  const timer =
    document.getElementById(
      'header-activity-timer'
    );

  /*
   * Active tracked activity
   */

  if (active) {

    const cat =
      getCat(active.category);

    activity.classList.add(
      'visible'
    );

    activity.classList.remove(
      'untracked'
    );

    /*
     * Set the category colour
     * for the header background.
     */

    activity.style.setProperty(
      '--header-category-color',
      cat.color
    );

    /*
     * Show the category symbol
     * and activity name on one line.
     */

    const defaultLabel =
      cat.label;

    const hasCustomLabel =
      active.label &&
      active.label !== defaultLabel;

    name.textContent =
      cat.emoji +
      ' ' +
      (
        hasCustomLabel
          ? active.label
          : cat.label
      );

    meta.textContent =
      '';

    timer.textContent =
      fmtDur(
        Date.now() -
        active.start
      );

    return;
  }

  /*
   * No tracked activity.
   * Show untracked time if there
   * is currently an untracked period.
   */

  if (untrackedActive) {

    activity.classList.add(
      'visible',
      'untracked'
    );

    activity.style.removeProperty(
      '--header-category-color'
    );

    name.textContent =
      '⏱️ Untracked';

    meta.textContent =
      '';

    timer.textContent =
      fmtDur(
        Date.now() -
        untrackedActive.start
      );

    return;
  }

  /*
   * Nothing happening.
   */

  activity.classList.remove(
    'visible',
    'untracked'
  );

  activity.style.removeProperty(
    '--header-category-color'
  );
}


/* ==================================================
   LOG VIEW
   ================================================== */

function renderLog() {

  const container =
    document.getElementById(
      'log-content'
    );

  if (!entries.length && !untrackedEntries.length) {

    container.innerHTML =
      '<div class="empty">No entries yet. Start tracking!</div>';

    return;

  }


  const groups = {};


  const allEntries = [
    ...entries.map(entry => ({
      ...entry,
      type: 'tracked'
    })),

    ...untrackedEntries.map(entry => ({
      ...entry,
      type: 'untracked'
    }))
  ].sort(
    (a, b) =>
      b.start - a.start
  );

  allEntries.forEach(entry => {

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

          const isUntracked =
            entry.type === 'untracked';

          const cat =
            isUntracked
              ? {
                  label: 'Untracked',
                  emoji: '⏱️',
                  color: '#888888'
                }
              : getCat(entry.category);

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
                ${isUntracked ? 'Untracked Time' : entry.label}
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

            ${
              isUntracked

                ? `
                  <button
                    class="btn-edit"
                    onclick="openUntrackedEditor(${entry.id})"
                    aria-label="Classify untracked time"
                  >
                    ✎
                  </button>
                `

                : `
                  <button
                    class="btn-del"
                    onclick="deleteEntry(${entry.id})"
                    aria-label="Delete entry"
                  >
                    ×
                  </button>
                `
            }

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

  const untrackedForDay =
    getUntrackedEntriesForDay(
      insightDate
    );

  const trackedTotal =
    entriesForDay.reduce(
      (sum, entry) =>
        sum + entry.duration,
      0
    );

  const untrackedTotal =
    untrackedForDay.reduce(
      (sum, entry) =>
        sum + entry.duration,
      0
    );

  const total =
    trackedTotal +
    untrackedTotal;

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
    trackedTotal > 0
      ? fmtDur(trackedTotal) + ' tracked'
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

  if (untrackedTotal > 0) {

    cats.push({
      id: 'untracked',
      label: 'Untracked',
      emoji: '⏱️',
      color: '#888888',
      total: untrackedTotal,
      pct: Math.round(
        untrackedTotal /
        total *
        100
      )
    });

  }

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
      Total time
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

  renderHeaderActivity();

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

if (active || untrackedActive) {
  startTick();
}