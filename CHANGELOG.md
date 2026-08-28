# Changelog

All notable changes to timelog are documented here.

## [0.3.11] - 2026-08-28

### Fixed
- Network-first service worker requests now bypass the browser HTTP cache so updated assets are used immediately after deployment.

---

## [0.3.10] - 2026-08-28

### Fixed
- Service worker asset installs now bypass the browser HTTP cache so updated app files are loaded reliably.

---

## [0.3.9] - 2026-08-28

### Fixed
- Active notifications now replace one tagged notification in place so the elapsed time can update live without creating a notification every second.
- Notification and time-format switches no longer appear enabled just because the app is using the light theme.

---

## [0.3.8] - 2026-08-27

### Added
- Notifications toggle in the menu. When enabled and permission is granted, a system notification appears when a timer starts, showing the current activity name, category, and elapsed time — mirroring the header display. The notification updates every minute and is dismissed when the timer stops.

---

## [0.3.7] - 2026-08-27

### Fixed
- Scrollbars now match the app's light/dark theme instead of rendering with the browser's default (white) styling.

---

## [0.3.6] - 2026-08-27

### Added
- Appearance setting now cycles through Light, Dark and System, with System automatically following the device's light/dark mode and updating live if it changes.

### Fixed
- The dropdown menu and its backdrop now align to the header's actual height instead of an assumed fixed height, so they no longer blur or overlap part of the header/menu button when the header grows taller (e.g. long activity names).
- On narrow screens, the app title/subtitle now wrap onto extra lines instead of the recorded activity or menu button being squeezed or pushed off-screen; the hamburger button and current activity stay right-aligned at their normal size.
- The dropdown menu's right edge now aligns with the hamburger button's right edge, with the gap below the header matching the gap to the screen's right edge.
- The header timer box now has a fixed width instead of growing with the elapsed time; on mobile it reserves space for "xxm xxs" and switches to "xxh xxm" (no seconds) past one hour, while desktop always reserves space for "xxh xxm xxs".

---

## [0.3.5] - 2026-08-26

### Changed
- Split activity time entry now uses separate hour and minute fields with a colon between them.

### Fixed
- AM/PM controls are now hidden in 24-hour mode and remain available in 12-hour mode.

---

## [0.3.4] - 2026-08-26

### Fixed
- Restored edit controls for untracked activities that begin at midnight.
- Restored delete controls for tracked activities that begin at midnight.
- Fixed controls for records whose IDs are strings after midnight splitting.

---

## [0.3.3] - 2026-08-26

### Added
- Added a menu toggle for 12-hour and 24-hour time formats.
- Split-time input now follows the selected time format.

### Changed
- Log activities are ordered from most recent to oldest.
- Activities are split at local midnight and never displayed across two calendar days.

### Fixed
- Prevented adjacent matching activities from merging across a midnight boundary.

---

## [0.3.2] - 2026-08-25

### Changed
- Adjacent log entries with the same category and name now automatically merge into one entry.
- Untracked periods that touch or match adjacent untracked periods are merged automatically.
- This also applies when entries are recreated or renamed to match an adjacent activity.

### Fixed
- Prevented duplicated adjacent activities from persisting in the log after saves and reloads.

---

## [0.3.1] - 2026-08-25

### Changed
- Separated the category menu into distinct Add category and Manage categories actions.
- Standardised the category menu titles to consistent capitalisation.
- Removed the duplicate add-category label from the add form.
- Updated the day's breakdown on the Insights page to show all configured categories, including zero-time categories for the selected day.

### Fixed
- Fixed the category modal so each menu opens the correct view.

---

## [0.3.0] - 2026-08-24

### Added
- Category manager to the menu
- Create new categories. Assign name, emoji, colour
- Edit existing categories
- Delete categories and migrate previous activities to a new category

---

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