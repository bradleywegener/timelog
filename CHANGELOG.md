# Changelog

All notable changes to timelog are documented here.

## [0.2.7] - 2026-08-24

### Added
- Split-time entry now uses an in-app `hh:mm` field instead of the browser's date/time picker.
- Activities that cross noon now provide mutually exclusive AM and PM options.

### Changed
- Split-time displays the original activity's start and end times and saves split times with zero seconds.
- Edit and delete-confirmation tiles now use opaque themed backgrounds with consistently sized action buttons.

---

## [0.2.6] - 2026-08-24

### Added
- Insights now update live while an activity is being tracked, including daily category totals and weekly totals.
- Untracked activities can be split into two activities with separate names and categories.
- Delete confirmations and invalid split-time warnings now appear within the app.

### Fixed
- Insights breakdown bars no longer replay their entrance animation from zero during live updates.
- Confirmed activity deletion now correctly converts the activity to untracked time and removes the original entry.

---

## [0.2.5] - 2026-08-21

### Fixed
- Fixed service-worker cache version reassignment.
- Service-worker updates are now triggered from `version.json`.

---

## [0.2.4] - 2026-08-21

### Added
- Log now shows current activity

### Fixed
- Bugs in log that would produce current activity unintentionally 

---

## [0.2.3] - 2026-08-20

### Changes
- Copilot fixed some discrepancies between the log and insights pages. 

---

## [0.2.2] - 2026-08-20

### Changes
- Lots of things, I did a poor job of keeping track

---

## [0.2.1] - 2026-08-20

### Added
- New menu and current status section

---

## [0.2.0] - 2026-08-19

### Added
- Untracked timer

---

## [0.1.4] - 2026-08-19

### Added
- Light mode

---

## [0.1.3] - 2026-08-19

### Changed
- Navigation menu now liquid glass style

## [0.1.2] - 2026-08-13

### Added
- CHANGELOG.md for documenting changes additions, changes and fixes in new versions.

### Fixed
- Incorrect icon names. 

---

## [0.1.0] - 2026-08-13

### Changed
- Added new application icons.
- Updated PWA caching to use versioned service-worker caches.
- Added visible application version number to the header.

### Fixed
- Fixed PWA icon filenames so they match the manifest and HTML references.

---

## [0.0.0] - 2026-08-13

### Initial release
- Initial release of timelog.
- Time tracking with start/stop timer.
- Categories for different types of activity.
- Daily log.
- Insights with daily and weekly breakdowns.
- Local data storage.
- PWA support.