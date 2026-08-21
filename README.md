# timelog

timelog is a personal productivity time tracker for recording how time is spent. It is a client-side progressive web app (PWA) with no backend, build process, or database.

## Features

- Start and stop activities with an optional description.
- Categorise activities as Focus, Admin, Life, Leisure, Sleep, or Wasted.
- Track time that is not covered by an activity as untracked time.
- Convert untracked periods into categorised entries later.
- See today's tracked entries from the Track view.
- Browse the complete history in the Log view.
- See the currently running activity in the Log as a live `CURRENT` entry.
- Delete saved entries; deleted time becomes untracked.
- View daily category breakdowns, weekly timelines, and all-time statistics in Insights.
- Switch between dark and light themes.
- Install the app as a PWA on supported desktop and mobile browsers.
- Continue using the app offline after its assets have been cached.

## Categories

- 🎯 Focus
- 📋 Admin
- 🏠 Life
- 🌿 Leisure
- 😴 Sleep
- ⏳ Wasted

## How time is calculated

Tracked activities are stored as start and end timestamps. The app builds a non-overlapping timeline for each day:

- Tracked activity takes priority over untracked time.
- Gaps between activities are displayed as untracked time.
- Activities crossing midnight are split between the affected days.
- Daily and weekly Insights use the same timeline model as the Log.
- Currently running activities are included up to the current time.

The app also migrates older category IDs to the current category names when it starts.

## Technology

- HTML
- CSS
- JavaScript
- Browser `localStorage`
- Web App Manifest
- Service worker for caching and offline use

No server or database is required for tracking data.

## Running locally

There is no build step. For basic UI work, open `index.html` directly in a browser.

For full PWA behavior, use a local web server such as the VS Code Live Server extension. Service workers generally require HTTPS or a local development origin such as `localhost`.

## Data storage

Entries, active timers, theme preferences, and untracked periods are stored in the browser's `localStorage`.

Data is specific to the browser and device being used. Clearing the browser's site data removes the stored entries. There is currently no account system or synchronisation between devices.

## Releases and PWA updates

The current version is stored in `version.json` and is used by the service worker to create a versioned cache. When releasing a change:

1. Update the `version` value in `version.json`.
2. Add a matching release entry to `CHANGELOG.md`.
3. Deploy the project to Netlify.

The app registers the service worker with the version as a query parameter, which prompts the browser to check for a new worker when the PWA is opened or revisited. The service worker installs the new versioned cache, removes older timelog caches, and activates the new version.

Edit `sw.js` only when changing service-worker behavior itself.

## Hosting

The project is intended to be hosted on Netlify. Netlify can serve the static files directly without a build command.