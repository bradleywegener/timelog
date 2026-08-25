/* ==================================================
   CATEGORIES
   ================================================== */

const BUILT_IN_CATEGORIES = [
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

const categoryOverrides = JSON.parse(
  localStorage.getItem('timelog-category-overrides') || '{}'
);

const deletedCategoryIds = JSON.parse(
  localStorage.getItem('timelog-deleted-categories') || '[]'
);

let CATEGORIES = [
  ...BUILT_IN_CATEGORIES
    .filter(category => !deletedCategoryIds.includes(category.id))
    .map(category => ({
      ...category,
      ...(categoryOverrides[category.id] || {})
    })),
  ...JSON.parse(
    localStorage.getItem('timelog-custom-categories') || '[]'
  )
];


/* ==================================================
   STATE
   ================================================== */

let entries = mergeAdjacentMatchingEntries(
  splitEntriesAtMidnight(
    JSON.parse(
      localStorage.getItem('timelog-entries') || '[]'
    )
  )
    .map(entry => ({
      ...entry,
      category: entry.category ?? null,
      label: entry.label ?? ''
    }))
);

let active = JSON.parse(
  localStorage.getItem('timelog-active') || 'null'
);

let selectedCat = 'focus';

let editingUntrackedId = null;

let editingUntrackedCat = 'focus';

let editingSplitCat = 'focus';

let appMessageAction = null;

let editingCategoryId = null;

let timerInterval = null;

let insightDate = new Date();

let timeFormat =
  localStorage.getItem('timelog-time-format') === '24'
    ? '24'
    : '12';

const UNTRACKED_GRACE_MS = 15 * 60 * 1000;

let untrackedEntries = mergeAdjacentMatchingEntries(
  splitEntriesAtMidnight(
    JSON.parse(
      localStorage.getItem('timelog-untracked') || '[]'
    )
  )
    .map(entry => ({
      ...entry,
      category: null,
      label: entry.label ?? null
    }))
);

let untrackedActive = JSON.parse(
  localStorage.getItem('timelog-untracked-active') || 'null'
);

/* ==================================================
   DATA MIGRATION
   ================================================== */

function migrateLegacyEntriesToCurrentCategories() {

  const categoryMap = {
    deep: 'focus',
    'deep-work': 'focus',
    shallow: 'admin',
    'shallow-work': 'admin',
    maintenance: 'life',
    rest: 'leisure',
    'rest-leisure': 'leisure',
    wasted: 'wasted',
    'wasted-time': 'wasted'
  };

  let entriesChanged = false;

  entries = entries.map(entry => {

    const category =
      categoryMap[entry.category];

    if (!category) {
      return entry;
    }

    entriesChanged = true;

    return {
      ...entry,
      category
    };

  });

  if (entriesChanged) {
    saveEntries();
  }

  if (
    active &&
    categoryMap[active.category]
  ) {
    active = {
      ...active,
      category:
        categoryMap[active.category]
    };

    localStorage.setItem(
      'timelog-active',
      JSON.stringify(active)
    );
  }

}

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

function applyTimeFormat(format) {

  timeFormat = format === '24' ? '24' : '12';

  localStorage.setItem(
    'timelog-time-format',
    timeFormat
  );

  const label = document.getElementById('time-format-label');
  const toggle = document.getElementById('time-format-menu-toggle');

  if (label) {
    label.textContent =
      timeFormat === '24' ? '24-hour' : '12-hour';
  }

  if (toggle) {
    toggle.classList.toggle('active', timeFormat === '24');
    toggle.setAttribute('aria-pressed', timeFormat === '24');
  }

  updateSplitTimeInput();
  renderAll();

}

function toggleTimeFormat() {

  applyTimeFormat(
    timeFormat === '24' ? '12' : '24'
  );

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

function saveCustomCategories() {

  localStorage.setItem(
    'timelog-custom-categories',
    JSON.stringify(
      CATEGORIES.filter(
        category =>
          !BUILT_IN_CATEGORIES.some(
            item => item.id === category.id
          )
      )
    )
  );

}

function setCategoryView(mode = 'manage') {

  const manageView = document.getElementById('category-manage-view');
  const addView = document.getElementById('category-add-view');
  const saveButton = document.getElementById('category-save-button');
  const title = document.getElementById('category-modal-title');
  const isAddMode = mode === 'add';

  manageView.hidden = isAddMode;
  addView.hidden = !isAddMode;
  saveButton.hidden = !isAddMode;
  title.textContent = isAddMode ? 'Add category' : 'Manage categories';

}

function openCategoryEditor(mode = 'manage') {

  closeMenu();

  document
    .getElementById('category-modal')
    .classList.add('open');

  document
    .getElementById('category-modal-backdrop')
    .classList.add('open');

  renderCategoryList();
  resetCategoryForm(mode);

  if (mode === 'add') {
    document
      .getElementById('category-name')
      .focus();
  }

}

function resetCategoryForm(mode = 'manage') {

  editingCategoryId = null;

  setCategoryView(mode);

  document
    .getElementById('category-save-button')
    .textContent = 'Add';

  document
    .getElementById('category-name')
    .value = '';

  document
    .getElementById('category-emoji')
    .value = '';

  document
    .getElementById('category-color')
    .value = getRandomCategoryColor();

}

function editCategory(id) {

  const category = CATEGORIES.find(
    item => item.id === id
  );

  if (!category) {
    return;
  }

  editingCategoryId = id;
  setCategoryView('add');

  document
    .getElementById('category-modal-title')
    .textContent = 'edit category';

  document
    .getElementById('category-save-button')
    .textContent = 'Save';

  document
    .getElementById('category-name')
    .value = category.label;

  document
    .getElementById('category-emoji')
    .value = category.emoji;

  document
    .getElementById('category-color')
    .value = category.color;

  document
    .getElementById('category-name')
    .focus();

}

function renderCategoryList() {

  const list =
    document.getElementById('category-list');

  list.innerHTML = CATEGORIES.map(category => `
    <div
      class="category-list-item"
    >
      <span
        class="category-list-swatch"
        style="background:${category.color}"
      ></span>
      <span>${category.emoji} ${category.label}</span>
      <button
        class="category-list-action"
        type="button"
        onclick="editCategory('${category.id}')"
      >
        Edit
      </button>
      <button
        class="category-list-action category-list-delete"
        type="button"
        onclick="openCategoryDelete('${category.id}')"
        aria-label="Delete ${category.label} category"
      >
        Delete
      </button>
    </div>
  `).join('');

}

function openCategoryDelete(id) {

  if (CATEGORIES.length < 2) {
    showAppMessage(
      'At least one category must remain.'
    );
    return;
  }

  const category = CATEGORIES.find(
    item => item.id === id
  );

  if (!category) {
    return;
  }

  const target =
    document.getElementById('category-delete-target');

  target.innerHTML = CATEGORIES
    .filter(item => item.id !== id)
    .map(item => `
      <option value="${item.id}">
        ${item.emoji} ${item.label}
      </option>
    `)
    .join('');

  target.dataset.categoryId = id;

  document
    .getElementById('category-delete-modal')
    .classList.add('open');

  document
    .getElementById('category-delete-modal-backdrop')
    .classList.add('open');

}

function closeCategoryDelete() {

  document
    .getElementById('category-delete-modal')
    .classList.remove('open');

  document
    .getElementById('category-delete-modal-backdrop')
    .classList.remove('open');

}

function confirmCategoryDelete() {

  const target =
    document.getElementById('category-delete-target');

  const deletedId = target.dataset.categoryId;
  const targetId = target.value;

  if (!deletedId || !targetId || deletedId === targetId) {
    return;
  }

  entries = entries.map(entry =>
    entry.category === deletedId
      ? { ...entry, category: targetId }
      : entry
  );

  if (active && active.category === deletedId) {
    active = {
      ...active,
      category: targetId
    };

    localStorage.setItem(
      'timelog-active',
      JSON.stringify(active)
    );
  }

  CATEGORIES = CATEGORIES.filter(
    category => category.id !== deletedId
  );

  if (
    BUILT_IN_CATEGORIES.some(
      item => item.id === deletedId
    )
  ) {
    localStorage.setItem(
      'timelog-deleted-categories',
      JSON.stringify(
        deletedCategoryIds.includes(deletedId)
          ? deletedCategoryIds
          : [
              ...deletedCategoryIds,
              deletedId
            ]
      )
    );
  }

  saveCategoryOverrides();
  saveCustomCategories();
  saveEntries();

  if (selectedCat === deletedId) {
    selectedCat = targetId;
  }

  closeCategoryDelete();
  closeCategoryEditor();
  renderCategoryList();
  renderAll();

}

function closeCategoryEditor() {

  document
    .getElementById('category-modal')
    .classList.remove('open');

  document
    .getElementById('category-modal-backdrop')
    .classList.remove('open');

}

function saveNewCategory() {

  const name = document
    .getElementById('category-name')
    .value
    .trim();

  const emoji = document
    .getElementById('category-emoji')
    .value
    .trim();

  const color = document
    .getElementById('category-color')
    .value;

  if (!name || !emoji) {
    showAppMessage(
      'Enter a name and an emoji for the new category.'
    );
    return;
  }

  if (
    CATEGORIES.some(
      category =>
        category.id !== editingCategoryId
        &&
        category.label.toLowerCase() === name.toLowerCase()
    )
  ) {
    showAppMessage(
      'A category with that name already exists.'
    );
    return;
  }

  if (editingCategoryId) {

    const category = CATEGORIES.find(
      item => item.id === editingCategoryId
    );

    category.label = name;
    category.emoji = emoji;
    category.color = color;

    saveCategoryOverrides();
    saveCustomCategories();
    renderCategoryList();
    renderAll();
    resetCategoryForm();
    closeCategoryEditor();

    return;

  }

  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || `category-${Date.now()}`;

  const category = {
    id: `${id}-${Date.now()}`,
    label: name,
    emoji,
    color
  };

  CATEGORIES.push(category);
  saveCustomCategories();

  selectedCat = category.id;

  renderCategoryList();
  resetCategoryForm();
  closeCategoryEditor();
  renderAll();

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

  const h = Math.floor(
    s / 3600
  );

  const m = Math.floor(
    (s % 3600) / 60
  );

  const sec =
    s % 60;

  if (h > 0) {
    return `${h}h ${m}m ${sec}s`;
  }

  if (m > 0) {
    return `${m}m ${sec}s`;
  }

  return `${sec}s`;
}


function fmtTime(ts) {

  const date = new Date(ts);
  const pad = value => String(value).padStart(2, '0');
  const minutes = pad(date.getMinutes());

  if (timeFormat === '24') {
    return `${pad(date.getHours())}:${minutes}`;
  }

  const hours = date.getHours();
  const displayHours = hours % 12 || 12;
  const period = hours >= 12 ? 'PM' : 'AM';

  return `${pad(displayHours)}:${minutes} ${period}`;
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


function mergeAdjacentMatchingEntries(items) {

  const sorted =
    [...items].sort(
      (a, b) =>
        a.start - b.start ||
        a.end - b.end
    );

  const merged = [];

  sorted.forEach(item => {

    const previous =
      merged[merged.length - 1];

    const type =
      item.category === null
        ? 'untracked'
        : 'tracked';

    const identity = {
      type,
      category:
        item.category ?? null,
      label:
        item.label ?? ''
    };

    const previousIdentity =
      previous && {
        type:
          previous.category === null
            ? 'untracked'
            : 'tracked',
        category:
          previous.category ?? null,
        label:
          previous.label ?? ''
      };

    if (
      previous &&
      previousIdentity.type === identity.type &&
      previousIdentity.category === identity.category &&
      previousIdentity.label === identity.label &&
      item.start <= previous.end &&
      isSameCalendarDay(previous.start, item.end)
    ) {

      previous.end =
        Math.max(
          previous.end,
          item.end
        );

      previous.duration =
        previous.end -
        previous.start;

      return;

    }

    merged.push({
      ...item,
      type
    });

  });

  return merged;

}

function isMidnightBoundary(firstEnd, secondStart) {

  if (firstEnd !== secondStart) {
    return false;
  }

  const boundary = new Date(firstEnd);

  return boundary.getHours() === 0 &&
    boundary.getMinutes() === 0 &&
    boundary.getSeconds() === 0 &&
    boundary.getMilliseconds() === 0;

}

function isSameCalendarDay(firstTimestamp, secondTimestamp) {

  const first = new Date(firstTimestamp);
  const second = new Date(secondTimestamp);

  return first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate();

}

function splitEntryAtMidnight(entry) {

  const parts = [];
  let start = entry.start;

  while (start < entry.end) {

    const startDate = new Date(start);
    const nextMidnight = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + 1,
      0, 0, 0, 0
    ).getTime();
    const end = Math.min(entry.end, nextMidnight);

    parts.push({
      ...entry,
      id: parts.length ? `${entry.id}-${start}` : entry.id,
      start,
      end,
      duration: end - start
    });

    start = end;

  }

  return parts;

}

function splitEntriesAtMidnight(items) {

  return items.flatMap(splitEntryAtMidnight);

}

function saveEntries() {

  entries =
    splitEntriesAtMidnight(
      mergeAdjacentMatchingEntries(
        entries.map(item => ({
        ...item,
        category:
          item.category ?? null
        }))
      )
    );

  localStorage.setItem(
    'timelog-entries',
    JSON.stringify(entries)
  );

}

function saveUntrackedEntries() {

  untrackedEntries =
    splitEntriesAtMidnight(
      mergeAdjacentMatchingEntries(
        untrackedEntries.map(item => ({
        ...item,
        category: null,
        label: item.label ?? null
        }))
      )
    );

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

  const dayStart =
    new Date(date);

  dayStart.setHours(
    0, 0, 0, 0
  );

  const dayEnd =
    new Date(dayStart);

  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

  const start =
    dayStart.getTime();

  const end =
    dayEnd.getTime();

  return entries
    .filter(entry =>
      entry.start < end &&
      entry.end > start
    )
    .map(entry => {

      const clippedStart =
        Math.max(
          entry.start,
          start
        );

      const clippedEnd =
        Math.min(
          entry.end,
          end
        );

      return {
        ...entry,

        start: clippedStart,
        end: clippedEnd,

        duration:
          clippedEnd -
          clippedStart
      };

    })
    .filter(entry =>
      entry.duration > 0
    );

}

function getUntrackedEntriesForDay(date) {

  const dayStart =
    new Date(date);

  dayStart.setHours(
    0, 0, 0, 0
  );

  const dayEnd =
    new Date(dayStart);

  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

  const start =
    dayStart.getTime();

  const end =
    dayEnd.getTime();

  return untrackedEntries
    .filter(entry =>
      entry.start < end &&
      entry.end > start
    )
    .map(entry => {

      const clippedStart =
        Math.max(
          entry.start,
          start
        );

      const clippedEnd =
        Math.min(
          entry.end,
          end
        );

      return {
        ...entry,

        start: clippedStart,
        end: clippedEnd,

        duration:
          clippedEnd -
          clippedStart
      };

    })
    .filter(entry =>
      entry.duration > 0
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

function getCleanDayTimeline(date) {

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const start = dayStart.getTime();
  const end = dayEnd.getTime();
  const now = Date.now();

  /*
   * Only count time that has actually happened.
   */
  const visibleEnd =
    now >= end
      ? end
      : now > start
        ? now
        : start;

  /*
   * Get all tracked periods.
   */
  const tracked = getEntriesForDay(date)
    .map(entry => ({
      start: Math.max(entry.start, start),
      end: Math.min(entry.end, visibleEnd),
      category: entry.category
    }))
    .filter(entry =>
      entry.end > entry.start
    );

  if (
    active &&
    active.start < visibleEnd &&
    active.start < end
  ) {

    const activeEnd =
      Math.min(Date.now(), visibleEnd);

    const nonOverlappingTracked = [];

    tracked.forEach(entry => {

      if (
        entry.end <= active.start ||
        entry.start >= activeEnd
      ) {
        nonOverlappingTracked.push(entry);
        return;
      }

      if (entry.start < active.start) {
        nonOverlappingTracked.push({
          ...entry,
          end: active.start
        });
      }

      if (entry.end > activeEnd) {
        nonOverlappingTracked.push({
          ...entry,
          start: activeEnd
        });
      }

    });

    tracked.length = 0;
    tracked.push(...nonOverlappingTracked);

    tracked.push({
      start: Math.max(active.start, start),
      end: activeEnd,
      category: active.category
    });
  }

  /*
   * Get all explicitly stored untracked periods.
   */
  const untracked = getUntrackedEntriesForDay(date)
    .map(entry => ({
      start: Math.max(entry.start, start),
      end: Math.min(entry.end, visibleEnd),
      category: null
    }))
    .filter(entry =>
      entry.end > entry.start
    );

  /*
   * Tracked time ALWAYS wins over untracked time.
   *
   * Start with all tracked periods.
   */
  const segments = [];

  tracked.forEach(trackedEntry => {

    /*
     * Add this tracked period.
     *
     * Overlapping tracked entries should not normally
     * exist, but if they do, later processing will
     * prevent double-counting.
     */
    segments.push({
      start: trackedEntry.start,
      end: trackedEntry.end,
      category: trackedEntry.category
    });

  });

  /*
   * Sort tracked periods chronologically.
   */
  segments.sort(
    (a, b) =>
      a.start - b.start ||
      a.end - b.end
  );

  /*
   * Merge overlapping tracked periods.
   *
   * This prevents tracked time itself from being
   * counted twice.
   */
  const cleanTracked = [];

  segments.forEach(segment => {

    if (!cleanTracked.length) {

      cleanTracked.push({
        ...segment
      });

      return;

    }

    const previous =
      cleanTracked[
        cleanTracked.length - 1
      ];

    if (
      segment.start <
      previous.end
    ) {

      /*
       * Extend the existing period.
       *
       * Keep the category of the first
       * tracked activity.
       */
      previous.end =
        Math.max(
          previous.end,
          segment.end
        );

    } else {

      cleanTracked.push({
        ...segment
      });

    }

  });

  /*
   * Now create the complete timeline.
   *
   * Anything not covered by tracked time
   * is automatically untracked.
   */
  const timeline = [];

  let cursor = start;

  cleanTracked.forEach(segment => {

    /*
     * Ignore anything completely outside
     * the visible period.
     */
    if (
      segment.end <= start ||
      segment.start >= visibleEnd
    ) {

      return;

    }

    const segmentStart =
      Math.max(
        segment.start,
        start
      );

    const segmentEnd =
      Math.min(
        segment.end,
        visibleEnd
      );

    /*
     * Gap before tracked activity.
     */
    if (
      segmentStart >
      cursor
    ) {

      timeline.push({

        start: cursor,

        end: segmentStart,

        category: null

      });

    }

    /*
     * Tracked activity.
     */
    if (
      segmentEnd >
      Math.max(cursor, segmentStart)
    ) {

      const actualStart =
        Math.max(
          cursor,
          segmentStart
        );

      timeline.push({

        start:
          actualStart,

        end:
          segmentEnd,

        category:
          segment.category

      });

      cursor =
        segmentEnd;

    }

  });

  /*
   * Anything after the final tracked activity
   * is untracked.
   */
  if (
    cursor <
    visibleEnd
  ) {

    timeline.push({

      start:
        cursor,

      end:
        visibleEnd,

      category:
        null

    });

  }

  return timeline;
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

  editingSplitCat =
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

  document
    .getElementById('split-fields')
    .hidden = true;

  document
    .getElementById('split-toggle')
    .textContent = 'Split activity';

  document
    .getElementById('edit-save-button')
    .textContent = 'Save';

  document
    .getElementById('edit-split-time')
    .value = getSplitTimeValue(
      entry.start,
      entry.end
    );

  document
    .getElementById('edit-split-period-am')
    .checked = !getSplitPeriod(
        entry.start,
        entry.end
      );

  document
    .getElementById('edit-split-period-pm')
    .checked = getSplitPeriod(
      entry.start,
      entry.end
    );

  document
    .getElementById('edit-split-period-toggle')
    .hidden = timeFormat === '24';

  document
    .getElementById('edit-split-time-range')
    .textContent = `${fmtTime(entry.start)} → ${fmtTime(entry.end)}`;

  document
    .getElementById('edit-split-label')
    .value = '';

  updateSplitTimeInput();

  buildEditCatPills();

  buildEditCatPills(
    'edit-split-cat-pills',
    'split'
  );

  modal.classList.add('open');
  backdrop.classList.add('open');

}

function updateSplitTimeInput() {

  const input = document.getElementById('edit-split-time');
  const periodToggle = document.getElementById('edit-split-period-toggle');

  if (!input || !periodToggle) {
    return;
  }

  input.placeholder =
    timeFormat === '24' ? 'HH:MM' : 'hh:mm';

  periodToggle.hidden = timeFormat === '24';

  if (!editingUntrackedId) {
    return;
  }

  const entry = untrackedEntries.find(
    item => item.id === editingUntrackedId
  );

  if (!entry) {
    return;
  }

  document
    .getElementById('edit-modal-time')
    .textContent = `${fmtTime(entry.start)} → ${fmtTime(entry.end)} · ${fmtDur(entry.duration)}`;

  document
    .getElementById('edit-split-time-range')
    .textContent = `${fmtTime(entry.start)} → ${fmtTime(entry.end)}`;

  input.value = getSplitTimeValue(entry.start, entry.end);

  document
    .getElementById('edit-split-period-am')
    .checked = !getSplitPeriod(entry.start, entry.end);

  document
    .getElementById('edit-split-period-pm')
    .checked = getSplitPeriod(entry.start, entry.end);

}

function getSplitTimeValue(start, end) {

  const midpoint = new Date(
    start +
    Math.floor((end - start) / 2)
  );

  const pad = value =>
    String(value).padStart(2, '0');

  const hours = timeFormat === '24'
    ? midpoint.getHours()
    : midpoint.getHours() % 12 || 12;

  return `${pad(hours)}:${pad(midpoint.getMinutes())}`;

}

function needsSplitPeriod(start, end) {

  const startDate = new Date(start);

  const noon = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    12, 0, 0, 0
  ).getTime();

  return start < noon && end > noon;

}

function getSplitPeriod(start, end) {

  const midpoint =
    start + Math.floor((end - start) / 2);

  return new Date(midpoint).getHours() >= 12;

}

function getSplitTimestamp(entry, value, isPM) {

  const match = value.trim().match(
    /^(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return NaN;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (minutes > 59) {
    return NaN;
  }

  if (timeFormat === '24') {

    if (hours < 0 || hours > 23) {
      return NaN;
    }

  } else {

    if (hours < 1 || hours > 12) {
      return NaN;
    }

    if (isPM && hours < 12) {
      hours += 12;
    }

    if (!isPM && hours === 12) {
      hours = 0;
    }

  }

  const date = new Date(entry.start);

  date.setHours(
    hours,
    minutes,
    0,
    0
  );

  return date.getTime();

}

function toggleUntrackedSplit() {

  const fields =
    document.getElementById('split-fields');

  const enabled = fields.hidden;

  fields.hidden = !enabled;

  document
    .getElementById('split-toggle')
    .textContent = enabled
      ? 'Keep as one activity'
      : 'Split activity';

  document
    .getElementById('edit-save-button')
    .textContent = enabled
      ? 'Split & Save'
      : 'Save';

}

function buildEditCatPills(
  containerId = 'edit-cat-pills',
  categoryType = 'primary'
) {

  const container =
    document.getElementById(
      containerId
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
        (
          categoryType === 'primary'
            ? cat.id === editingUntrackedCat
            : cat.id === editingSplitCat
        )
          ? ' selected'
          : ''
      );

    pill.textContent =
      cat.emoji +
      ' ' +
      cat.label;

    if (
      (
        categoryType === 'primary'
          ? cat.id === editingUntrackedCat
          : cat.id === editingSplitCat
      )
    ) {

      pill.style.borderColor =
        cat.color;

      pill.style.background =
        cat.color + '22';

    }

    pill.onclick = () => {

      if (categoryType === 'primary') {
        editingUntrackedCat = cat.id;
      } else {
        editingSplitCat = cat.id;
      }

      buildEditCatPills(
        containerId,
        categoryType
      );

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

function showAppMessage(
  message,
  options = {}
) {

  const modal =
    document.getElementById('message-modal');

  document
    .getElementById('message-modal-title')
    .textContent = options.title || 'Notice';

  document
    .getElementById('message-modal-text')
    .textContent = message;

  const cancelButton =
    document.getElementById('message-cancel-button');

  const confirmButton =
    document.getElementById('message-confirm-button');

  cancelButton.hidden = !options.confirm;
  confirmButton.hidden = !options.confirm;

  if (!options.confirm) {
    cancelButton.hidden = false;
    cancelButton.textContent = 'Close';
  } else {
    cancelButton.textContent = 'Cancel';
  }

  appMessageAction =
    options.confirm
      ? options.onConfirm
      : null;

  modal.classList.add('open');

  document
    .getElementById('message-modal-backdrop')
    .classList.add('open');

  modal.setAttribute('aria-hidden', 'false');

}

function closeAppMessage(confirmed) {

  const modal =
    document.getElementById('message-modal');

  modal.classList.remove('open');

  document
    .getElementById('message-modal-backdrop')
    .classList.remove('open');

  modal.setAttribute('aria-hidden', 'true');

  const action =
    confirmed
      ? appMessageAction
      : null;

  appMessageAction = null;

  if (action) {
    action();
  }

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

  const splitFields =
    document.getElementById('split-fields');

  if (!splitFields.hidden) {

    const splitTime = getSplitTimestamp(
      entry,
      document
        .getElementById('edit-split-time')
        .value,
      document
        .getElementById('edit-split-period-pm')
        .checked
    );

    if (
      !Number.isFinite(splitTime)
      || splitTime <= entry.start
      || splitTime >= entry.end
    ) {

      showAppMessage(
        'Choose a split time between the activity start and end.'
      );

      return;

    }

    const firstCat =
      getCat(editingUntrackedCat);

    const secondCat =
      getCat(editingSplitCat);

    const firstLabel =
      document
        .getElementById('edit-entry-label')
        .value
        .trim()
      || firstCat.label;

    const secondLabel =
      document
        .getElementById('edit-split-label')
        .value
        .trim()
      || secondCat.label;

    entries.unshift(
      {
        id: splitTime - 1,
        category: secondCat.id,
        label: secondLabel,
        start: splitTime,
        end: entry.end,
        duration: entry.end - splitTime
      },
      {
        id: splitTime,
        category: firstCat.id,
        label: firstLabel,
        start: entry.start,
        end: splitTime,
        duration: splitTime - entry.start
      }
    );

    untrackedEntries =
      untrackedEntries.filter(
        e => e.id !== editingUntrackedId
      );

    saveEntries();
    saveUntrackedEntries();
    closeUntrackedEditor();
    renderAll();

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

function fillPastGapsWithUntracked() {

  const now = Date.now();

  /*
   * Build a list of all completed tracked
   * and untracked periods.
   */
  const periods = [

    ...entries.map(entry => ({
      start: entry.start,
      end: entry.end,
      type: 'tracked'
    })),

    ...untrackedEntries.map(entry => ({
      start: entry.start,
      end: entry.end,
      type: 'untracked'
    }))

  ].filter(entry =>
    entry.end > entry.start
  );

  /*
   * Currently active tracked time is already
   * accounted for, so include it in the
   * timeline.
   */
  if (active) {

    periods.push({

      start: active.start,
      end: now,
      type: 'tracked'

    });

  }

  /*
   * Currently active untracked time is also
   * already accounted for.
   */
  if (untrackedActive) {

    periods.push({

      start: untrackedActive.start,
      end: now,
      type: 'untracked'

    });

  }

  if (!periods.length) {
    return;
  }

  /*
   * Sort chronologically.
   */
  periods.sort(
    (a, b) =>
      a.start - b.start
  );

  /*
   * Start at the earliest known period.
   */
  let cursor =
    periods[0].start;

  const newUntracked = [];

  periods.forEach(period => {

    /*
     * Ignore anything completely contained
     * inside time we have already accounted for.
     */
    if (
      period.end <= cursor
    ) {
      return;
    }

    /*
     * If there is a genuine gap, create an
     * untracked entry for it.
     */
    if (
      period.start > cursor
    ) {

      newUntracked.push({

        id:
          Date.now() +
          Math.random(),

        start:
          cursor,

        end:
          period.start,

        duration:
          period.start -
          cursor,

        label:
          null,

        category:
          null

      });

    }

    /*
     * Move the cursor forward.
     */
    cursor =
      Math.max(
        cursor,
        period.end
      );

  });

  /*
   * If nothing is currently running, fill the
   * gap between the final known period and now.
   */
  if (
    cursor < now &&
    !active &&
    !untrackedActive
  ) {

    newUntracked.push({

      id:
        Date.now() +
        Math.random(),

      start:
        cursor,

      end:
        now,

      duration:
        now -
        cursor,

      label:
        null,

      category:
        null

    });

  }

  /*
   * Add the newly discovered gaps.
   */
  if (
    newUntracked.length
  ) {

    untrackedEntries = [

      ...untrackedEntries,
      ...newUntracked

    ];

    saveUntrackedEntries();

  }

}

function cleanOverlappingUntrackedEntries() {

  /*
   * Start with valid untracked entries only.
   */
  let cleaned =
    untrackedEntries

      .filter(entry =>
        entry.end > entry.start
      )

      .map(entry => ({
        ...entry
      }));


  /*
   * --------------------------------------------------
   * STEP 1
   *
   * Remove every portion of untracked time that
   * overlaps a tracked activity.
   *
   * Tracked time always wins.
   * --------------------------------------------------
   */

  entries.forEach(tracked => {

    const newCleaned = [];

    cleaned.forEach(untracked => {

      /*
       * No overlap.
       */
      if (
        untracked.end <= tracked.start ||
        untracked.start >= tracked.end
      ) {

        newCleaned.push(
          untracked
        );

        return;

      }


      /*
       * There is overlap.
       *
       * Keep the portion before the tracked
       * activity.
       */
      if (
        untracked.start < tracked.start
      ) {

        newCleaned.push({

          ...untracked,

          id:
            Date.now() +
            Math.random(),

          start:
            untracked.start,

          end:
            tracked.start,

          duration:
            tracked.start -
            untracked.start

        });

      }


      /*
       * Keep the portion after the tracked
       * activity.
       */
      if (
        untracked.end > tracked.end
      ) {

        newCleaned.push({

          ...untracked,

          id:
            Date.now() +
            Math.random(),

          start:
            tracked.end,

          end:
            untracked.end,

          duration:
            untracked.end -
            tracked.end

        });

      }

    });

    cleaned = newCleaned;

  });


  /*
   * --------------------------------------------------
   * STEP 2
   *
   * Sort the remaining untracked periods.
   * --------------------------------------------------
   */

  cleaned.sort(
    (a, b) =>
      a.start - b.start
  );


  /*
   * --------------------------------------------------
   * STEP 3
   *
   * Merge overlapping or touching untracked
   * periods.
   * --------------------------------------------------
   */

  const merged = [];

  cleaned.forEach(entry => {

    if (!merged.length) {

      merged.push({
        ...entry
      });

      return;

    }

    const previous =
      merged[
        merged.length - 1
      ];


    /*
     * If this entry overlaps or directly touches
     * the previous entry, merge them.
     */
    if (
      entry.start <= previous.end &&
      isSameCalendarDay(previous.start, entry.end)
    ) {

      previous.end =
        Math.max(
          previous.end,
          entry.end
        );

      previous.duration =
        previous.end -
        previous.start;

    } else {

      merged.push({
        ...entry
      });

    }

  });


  /*
   * Replace the old untracked entries.
   */
  untrackedEntries =
    merged;

  saveUntrackedEntries();

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

  renderLog();

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

  const entry =
    entries.find(
      e => e.id === id
    );

  if (!entry) {
    return;
  }

  showAppMessage(
    'Delete this entry? Its time will become untracked.',
    {
      title: 'Delete entry',
      confirm: true,
      onConfirm: () => deleteEntryConfirmed(id)
    }
  );

}

function deleteEntryConfirmed(id) {

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

    /*
     * If the active activity has crossed midnight,
     * split it into a new entry at 00:00.
     */
    if (active) {

      const now = new Date();

      const activityStart = new Date(active.start);

      if (!isSameDay(activityStart, now)) {

        const midnight = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0, 0, 0, 0
        );

        /*
         * Save the portion that belongs to yesterday.
         */
        const entry = {
          ...active,
          end: midnight.getTime(),
          duration:
            midnight.getTime() - active.start,
          id: midnight.getTime()
        };

        entries.unshift(entry);
        saveEntries();

        /*
         * Start an identical activity
         * at midnight.
         */
        active = {
          ...active,
          start: midnight.getTime()
        };

        localStorage.setItem(
          'timelog-active',
          JSON.stringify(active)
        );

        /*
         * Refresh everything so the new
         * entry appears in the correct day.
         */
        renderAll();
      }
    }

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

    renderLog();

    renderInsights();

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

    /*
     * Category name is no longer
     * displayed separately.
     */

    meta.textContent = '';

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

    /*
     * Remove the category colour
     * when displaying untracked time.
     */

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

function getLogDisplayEntries() {

  const periods = [
    ...entries,
    ...untrackedEntries,
    ...(active ? [active] : []),
    ...(untrackedActive ? [
      {
        start: untrackedActive.start,
        end: Date.now()
      }
    ] : [])
  ];

  if (!periods.length) {
    return [];
  }

  const earliest =
    new Date(
      Math.min(...periods.map(period => period.start))
    );

  earliest.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const displayEntries = [];

  for (
    const day = new Date(earliest);
    day <= today;
    day.setDate(day.getDate() + 1)
  ) {

    const timeline = getCleanDayTimeline(day);

    timeline.forEach(segment => {

      if (segment.category) {

        const activeSource =
          active &&
          active.category === segment.category &&
          active.start < segment.end &&
          active.start >= segment.start
            ? active
            : null;

        const source = activeSource || entries.find(entry =>
          entry.category === segment.category &&
          entry.start < segment.end &&
          entry.end > segment.start
        );

        displayEntries.push({
          ...(source || {}),
          id: source?.id || `tracked-${segment.start}`,
          type: 'tracked',
          current: source === active,
          start: segment.start,
          end: segment.end,
          duration: segment.end - segment.start,
          label: source?.label || getCat(segment.category).label,
          category: segment.category
        });

        return;
      }

      let cursor = segment.start;

      untrackedEntries
        .filter(entry =>
          entry.start < segment.end &&
          entry.end > segment.start
        )
        .sort((a, b) => a.start - b.start)
        .forEach(entry => {

          const start = Math.max(entry.start, segment.start);
          const end = Math.min(entry.end, segment.end);

          if (start > cursor) {
            displayEntries.push({
              id: `untracked-${cursor}`,
              type: 'untracked',
              current: false,
              start: cursor,
              end: start,
              duration: start - cursor,
              category: null,
              label: null
            });
          }

          if (end > start) {
            displayEntries.push({
              ...entry,
              type: 'untracked',
              current: false,
              start,
              end,
              duration: end - start
            });

            cursor = Math.max(cursor, end);
          }

        });

      if (cursor < segment.end) {
        displayEntries.push({
          id: `untracked-${cursor}`,
          type: 'untracked',
          current:
            Boolean(
              untrackedActive &&
              untrackedActive.start === cursor
            ),
          start: cursor,
          end: segment.end,
          duration: segment.end - cursor,
          category: null,
          label: null
        });
      }

    });
  }

  return displayEntries.filter(entry =>
    entry.duration > 0
  );
}

function renderLog() {

  const container =
    document.getElementById(
      'log-content'
    );

  const allEntries = getLogDisplayEntries();

  if (!allEntries.length) {

    container.innerHTML =
      '<div class="empty">No entries yet. Start tracking!</div>';

    return;

  }

  /*
   * Build a list containing both tracked
   * and untracked entries.
   */
  /*
   * Split every entry at midnight.
   *
   * An activity such as:
   *
   * 11:00 PM → 1:00 AM
   *
   * becomes:
   *
   * 11:00 PM → 12:00 AM
   * 12:00 AM → 1:00 AM
   */
  const splitEntries = [];

  allEntries.forEach(entry => {

    let cursor =
      entry.start;

    while (
      cursor <
      entry.end
    ) {

      const cursorDate =
        new Date(cursor);

      /*
       * Find midnight immediately
       * after the current portion.
       */
      const nextMidnight =
        new Date(
          cursorDate.getFullYear(),
          cursorDate.getMonth(),
          cursorDate.getDate() + 1,
          0, 0, 0, 0
        ).getTime();

      const segmentEnd =
        Math.min(
          entry.end,
          nextMidnight
        );

      splitEntries.push({

        ...entry,

        start:
          cursor,

        end:
          segmentEnd,

        duration:
          segmentEnd -
          cursor,

        /*
         * Give each split segment
         * its own display id.
         */
        displayId:
          `${entry.id}-${cursor}`

      });

      cursor =
        segmentEnd;

    }

  });

  /*
   * Sort newest first.
   */
  splitEntries.sort(
    (a, b) =>
      b.start -
      a.start
  );

  /*
   * Group entries by the day they
   * actually occur on.
   */
  const groups = {};

  splitEntries.forEach(entry => {

    const date =
      fmtDate(entry.start);

    if (!groups[date]) {

      groups[date] = [];

    }

    groups[date].push(
      entry
    );

  });

  container.innerHTML = '';

  /*
   * Render each day.
   */
  Object.entries(groups)
    .forEach(
      ([date, dayEntries]) => {

        const mergedDayEntries =
          mergeAdjacentMatchingEntries(
            dayEntries
          ).sort(
            (a, b) =>
              b.start -
              a.start
          );

        /*
         * Calculate tracked time only.
         *
         * Untracked time is excluded
         * from the day total.
         */
        const trackedTotal =
          mergedDayEntries
            .filter(
              entry =>
                entry.type ===
                'tracked'
            )
            .reduce(
              (sum, entry) =>
                sum +
                entry.duration,
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

          <span>
            ${date}
          </span>

          <span>
            ${
              trackedTotal > 0
                ? fmtDur(trackedTotal)
                : '—'
            }
          </span>

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

        mergedDayEntries.forEach(
          entry => {

            const isUntracked =
              entry.type ===
              'untracked';

            const cat =
              isUntracked

                ? {
                    label:
                      'Untracked',

                    emoji:
                      '⏱️',

                    color:
                      '#888888'
                  }

                : getCat(
                    entry.category
                  );

            const div =
              document.createElement(
                'div'
              );

            div.className =
              'entry' +
              (entry.current ? ' entry-current' : '');

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
                  ${
                    isUntracked
                      ? 'Untracked Time'
                      : entry.label
                  }
                  ${
                    entry.current
                      ? '<span class="current-badge">CURRENT</span>'
                      : ''
                  }
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
                <span
                  ${
                    entry.current
                      ? `data-current-start="${entry.start}"`
                      : ''
                  }
                >
                  ${fmtDur(entry.duration)}
                </span>
              </div>

              ${
                isUntracked

                  ? (
                      typeof entry.id === 'number'
                        ? `
                    <button
                      class="btn-edit"
                      onclick="
                        openUntrackedEditor(
                          ${entry.id}
                        )
                      "
                      aria-label="
                        Classify untracked time
                      "
                    >
                      ✎
                    </button>
                      `
                      : ''
                  )

                  : entry.current
                    ? ''
                    : `
                    <button
                      class="btn-del"
                      onclick="
                        deleteEntry(
                          ${entry.id}
                        )
                      "
                      aria-label="
                        Delete entry
                      "
                    >
                      ×
                    </button>
                  `
              }

            `;

            card.appendChild(
              div
            );

          }
        );

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

  const dayStart =
    new Date(insightDate);

  dayStart.setHours(
    0, 0, 0, 0
  );

  const dayEnd =
    new Date(dayStart);

  dayEnd.setDate(
    dayEnd.getDate() + 1
  );

  const now = Date.now();

  /*
   * Only show time that has actually
   * occurred.
   *
   * Completed days = 24 hours.
   * Today = current time.
   * Future = 0.
   */
  let visibleEnd;

  if (now >= dayEnd.getTime()) {

    visibleEnd =
      dayEnd.getTime();

  } else if (
    now > dayStart.getTime()
  ) {

    visibleEnd = now;

  } else {

    visibleEnd =
      dayStart.getTime();

  }

  /*
   * Get tracked entries for the day.
   */
  const tracked =
    getEntriesForDay(insightDate)
      .map(entry => ({

        start:
          Math.max(
            entry.start,
            dayStart.getTime()
          ),

        end:
          Math.min(
            entry.end,
            visibleEnd
          ),

        category:
          entry.category

      }))
      .filter(entry =>
        entry.end > entry.start
      );

  /*
   * Get untracked entries for the day.
   */
  const untracked =
    getUntrackedEntriesForDay(
      insightDate
    )
      .map(entry => ({

        start:
          Math.max(
            entry.start,
            dayStart.getTime()
          ),

        end:
          Math.min(
            entry.end,
            visibleEnd
          ),

        category:
          null

      }))
      .filter(entry =>
        entry.end > entry.start
      );

  /*
   * Combine everything and sort
   * chronologically.
   */
  const periods = [
    ...tracked,
    ...untracked
  ].sort(
    (a, b) =>
      a.start - b.start
  );

  /*
  * Build a clean, non-overlapping
   * timeline.
   *
   * Every gap becomes Untracked.
   */
  let segments = [];

  let cursor =
    dayStart.getTime();

  periods.forEach(period => {

    /*
     * Ignore periods completely
     * outside the visible portion.
     */
    if (
      period.start >=
      visibleEnd
    ) {
      return;
    }

    const start =
      Math.max(
        period.start,
        dayStart.getTime()
      );

    const end =
      Math.min(
        period.end,
        visibleEnd
      );

    if (end <= start) {
      return;
    }

    /*
     * Fill any gap with untracked.
     */
    if (start > cursor) {

      segments.push({

        start: cursor,
        end: start,
        category: null

      });

    }

    /*
     * IMPORTANT:
     *
     * If this period overlaps something
     * we've already accounted for, only
     * use the portion that hasn't already
     * been counted.
     */
    const actualStart =
      Math.max(
        start,
        cursor
      );

    if (
      end > actualStart
    ) {

      segments.push({

        start: actualStart,
        end,
        category:
          period.category

      });

      cursor = end;

    }

  });

  /*
   * Fill everything from the final
   * recorded period until now with
   * untracked time.
   */
  if (
    cursor < visibleEnd
  ) {

    segments.push({

      start: cursor,
      end: visibleEnd,
      category: null

    });

  }

  /*
   * Calculate totals from the CLEAN
   * non-overlapping segments.
   */
  const categoryTotals = {};

  CATEGORIES.forEach(cat => {

    categoryTotals[cat.id] = 0;

  });

  let untrackedTotal = 0;

  segments.forEach(segment => {

    const duration =
      segment.end -
      segment.start;

    if (
      segment.category &&
      categoryTotals[
        segment.category
      ] !== undefined
    ) {

      categoryTotals[
        segment.category
      ] += duration;

    } else {

      untrackedTotal += duration;

    }

  });

  segments = getCleanDayTimeline(insightDate);

  CATEGORIES.forEach(cat => {

    categoryTotals[cat.id] = 0;

  });

  untrackedTotal = 0;

  segments.forEach(segment => {

    const duration =
      segment.end -
      segment.start;

    if (
      segment.category &&
      categoryTotals[
        segment.category
      ] !== undefined
    ) {

      categoryTotals[
        segment.category
      ] += duration;

    } else {

      untrackedTotal += duration;

    }

  });

  /*
   * Calculate tracked total from
   * the category totals.
   */
  const trackedTotal =
    Object.values(
      categoryTotals
    ).reduce(
      (sum, duration) =>
        sum + duration,
      0
    );

  /*
   * Total accounted time.
   *
   * For a completed day this will
   * be exactly 24 hours.
   */
  const total =
    trackedTotal +
    untrackedTotal;

  /*
   * Update date heading.
   */
  const labelEl =
    document.getElementById(
      'insights-date-label'
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

  /*
   * Update the tracked total at
   * the top of the day breakdown.
   */
  const totalEl =
    document.getElementById(
      'insights-date-total'
    );

  totalEl.textContent =
    trackedTotal > 0
      ? fmtDur(trackedTotal) +
        ' tracked'
      : 'No time tracked';

  /*
   * Day navigation.
   */
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

  /*
   * Build category list.
   */
  const cats =
    CATEGORIES.map(cat => {

      const categoryTotal =
        categoryTotals[cat.id] || 0;

      return {

        ...cat,

        total:
          categoryTotal,

        pct:
          total > 0
            ? Math.round(
                categoryTotal /
                total *
                100
              )
            : 0

      };

    });

  /*
   * Add untracked.
   */
  if (
    untrackedTotal > 0
  ) {

    cats.push({

      id: 'untracked',

      label: 'Untracked',

      emoji: '⏱️',

      color: '#888888',

      total:
        untrackedTotal,

      pct:
        Math.round(
          untrackedTotal /
          total *
          100
        )

    });

  }

  barsEl.innerHTML = '';

  const animateBars =
    !barsEl.dataset.rendered;

  /*
   * Render bars.
   */
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
            width:${animateBars ? 0 : cat.pct}%;
            background:${cat.color};
          "
          data-pct="${cat.pct}"
        ></div>

      </div>

    `;

    barsEl.appendChild(div);

  });

  /*
   * Divider.
   */
  const hr =
    document.createElement(
      'hr'
    );

  hr.className =
    'divider';

  barsEl.appendChild(hr);

  /*
   * Bottom tracked total.
   */
  const row =
    document.createElement(
      'div'
    );

  row.className =
    'total-row';

  row.innerHTML = `

    <span class="total-label">
      Total time tracked
    </span>

    <span class="total-value">
      ${
        trackedTotal > 0
          ? fmtDur(trackedTotal)
          : '0s'
      }
    </span>

  `;

  barsEl.appendChild(row);

  /*
   * Animate bars.
   */
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

  barsEl.dataset.rendered = 'true';

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

  const now =
    new Date();

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

    days.push(date);

  }

  /*
   * Build a 24-hour timeline for
   * every day.
   */
  const dayData =
    days.map(day => {

      const dayStart =
        new Date(day);

      dayStart.setHours(
        0, 0, 0, 0
      );

      const dayEnd =
        new Date(dayStart);

      dayEnd.setDate(
        dayEnd.getDate() + 1
      );

      /*
       * How much of this day has
       * actually happened?
       *
       * Past day:
       *   24 hours
       *
       * Today:
       *   current time
       *
       * Future:
       *   0 hours
       */
      let visibleEnd;

      if (
        now >= dayEnd
      ) {

        visibleEnd =
          dayEnd.getTime();

      } else if (
        now > dayStart
      ) {

        visibleEnd =
          now.getTime();

      } else {

        visibleEnd =
          dayStart.getTime();

      }

      /*
       * Get tracked entries.
       *
       * getEntriesForDay() already clips
       * entries that cross midnight.
       */
      const tracked =
        getEntriesForDay(day)
          .map(entry => ({

            start:
              Math.max(
                entry.start,
                dayStart.getTime()
              ),

            end:
              Math.min(
                entry.end,
                dayEnd.getTime()
              ),

            category:
              entry.category

          }))
          .filter(
            entry =>
              entry.end >
              entry.start
          );

      /*
       * Get explicitly stored untracked
       * entries.
       */
      const untracked =
        getUntrackedEntriesForDay(day)
          .map(entry => ({

            start:
              Math.max(
                entry.start,
                dayStart.getTime()
              ),

            end:
              Math.min(
                entry.end,
                dayEnd.getTime()
              ),

            category:
              null

          }))
          .filter(
            entry =>
              entry.end >
              entry.start
          );

      /*
       * Combine everything into one
       * chronological timeline.
       */
      const periods = [
        ...tracked,
        ...untracked
      ].sort(
        (a, b) =>
          a.start - b.start
      );

      let segments = [];

      let cursor =
        dayStart.getTime();

      periods.forEach(
        period => {

          /*
           * Ignore periods that are
           * entirely in the future.
           */
          if (
            period.start >=
            visibleEnd
          ) {

            return;

          }

          const periodStart =
            Math.max(
              period.start,
              dayStart.getTime()
            );

          const periodEnd =
            Math.min(
              period.end,
              visibleEnd
            );

          /*
           * Any gap between recorded
           * periods is automatically
           * untracked.
           */
          if (
            periodStart >
            cursor
          ) {

            segments.push({
              start:
                cursor,

              end:
                periodStart,

              category:
                null

            });

          }

          /*
           * Add the actual tracked or
           * explicitly untracked period.
           */
          if (
            periodEnd >
            periodStart
          ) {

            segments.push({
              start:
                periodStart,

              end:
                periodEnd,

              category:
                period.category

            });

          }

          cursor =
            Math.max(
              cursor,
              periodEnd
            );

        }
      );

      /*
       * Anything remaining before the
       * current time is untracked.
       */
      if (
        cursor <
        visibleEnd
      ) {

        segments.push({
          start:
            cursor,

          end:
            visibleEnd,

          category:
            null

        });

      }

      segments = getCleanDayTimeline(day);

      /*
       * Calculate TRACKED time only.
       *
       * Untracked segments are deliberately
       * excluded.
       */
      const trackedTotal =
        segments
          .filter(
            segment =>
              segment.category !== null
          )
          .reduce(
            (sum, segment) =>
              sum +
              (
                segment.end -
                segment.start
              ),
            0
          );

      return {
        day,
        dayStart,
        dayEnd,
        visibleEnd,
        segments,
        trackedTotal
      };

    });

  /*
   * Weekly total = tracked time only.
   */
  const weekTotal =
    dayData.reduce(
      (sum, day) =>
        sum +
        day.trackedTotal,
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

  /*
   * Render the week even if there
   * isn't any tracked time yet.
   *
   * This is useful because the bars
   * still show untracked time.
   */
  container.innerHTML = '';

  /*
   * Render each day.
   */
  dayData.forEach(
    data => {

      const {
        day,
        dayStart,
        visibleEnd,
        segments,
        trackedTotal
      } = data;

      const row =
        document.createElement(
          'div'
        );

      row.className =
        'weekly-row';

      /*
       * Highlight selected day.
       */
      if (
        isSameDay(
          day,
          insightDate
        )
      ) {

        row.classList.add(
          'selected-week-day'
        );

      }

      /*
       * Build the coloured segments.
       *
       * Every segment is measured
       * against the FULL 24-hour day.
       */
      let segmentHTML = '';

      segments.forEach(
        segment => {

          const duration =
            segment.end -
            segment.start;

          const width =
            duration /
            (
              24 *
              60 *
              60 *
              1000
            ) *
            100;

          if (
            width <= 0
          ) {

            return;

          }

          let cat;

          if (
            segment.category
          ) {

            cat =
              getCat(
                segment.category
              );

          } else {

            cat = {
              label:
                'Untracked',

              emoji:
                '⏱️',

              color:
                '#888888'
            };

          }

          segmentHTML += `

            <div
              class="weekly-segment"
              style="
                width:${width}%;
                background:${cat.color};
              "
              title="
                ${cat.label}
                ·
                ${fmtDur(duration)}
              "
            ></div>

          `;

        }
      );

      /*
       * The weekly bar is ALWAYS 24 hours.
       *
       * Future time is left blank because
       * there are simply no segments for it.
       */
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

          <div class="weekly-bar">
            ${segmentHTML}
          </div>

        </div>


        <div class="weekly-day-total">

          ${
            trackedTotal > 0
              ? fmtDur(trackedTotal)
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

  if (v === 'log') {
    renderLog();
  }


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

          const versionResponse =
            await fetch('version.json', {
              cache: 'no-store'
            });

          if (!versionResponse.ok) {
            throw new Error(
              'Could not load version.json'
            );
          }

          const versionData =
            await versionResponse.json();

          const registration =
            await navigator.serviceWorker.register(
              `sw.js?v=${encodeURIComponent(
                versionData.version
              )}`
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

migrateLegacyEntriesToCurrentCategories();

buildPills();

fillPastGapsWithUntracked();

cleanOverlappingUntrackedEntries();

applyTimeFormat(timeFormat);

loadVersion();

registerServiceWorker();

if (active || untrackedActive) {
  startTick();
}

function saveCategoryOverrides() {

  const overrides = {};

  CATEGORIES
    .filter(category =>
      BUILT_IN_CATEGORIES.some(
        item => item.id === category.id
      )
    )
    .forEach(category => {

      const original = BUILT_IN_CATEGORIES.find(
        item => item.id === category.id
      );

      if (
        category.label !== original.label
        || category.emoji !== original.emoji
        || category.color !== original.color
      ) {
        overrides[category.id] = {
          label: category.label,
          emoji: category.emoji,
          color: category.color
        };
      }

    });

  localStorage.setItem(
    'timelog-category-overrides',
    JSON.stringify(overrides)
  );

}

function getRandomCategoryColor() {

  const existingColors = new Set(
    CATEGORIES.map(category =>
      category.color.toLowerCase()
    )
  );

  let color;

  do {
    color = '#'
      + Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, '0');
  } while (existingColors.has(color));

  return color;

}