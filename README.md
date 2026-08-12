# timelog

A simple personal time tracker for recording how I spend my time.

## Features

- Start and stop a timer
- Categorise tracked time
- Add an optional description to each entry
- View today's tracked time
- Browse a complete log of previous entries
- Delete individual entries
- View today's time breakdown
- View all-time statistics
- Data is saved locally in the browser using `localStorage`
- Designed to work on desktop and mobile devices

## Categories

- 🧠 Deep Work
- 📋 Shallow Work
- 🔧 Maintenance
- 🌿 Rest & Leisure
- ⏳ Wasted Time

## Technology

timelog is a simple client-side web application built with:

- HTML
- CSS
- JavaScript
- Browser `localStorage`

No server or database is currently required.

## Running locally

No build process is required.

Simply open `index.html` in a web browser.

Alternatively, the project can be served using a local development server such as the VS Code Live Server extension.

## Data

Tracked entries are currently stored in the browser's `localStorage`.

This means data is specific to the browser/device being used. Clearing the browser's site data will also remove the stored entries.

Future versions may add online synchronisation between devices.

## Hosting

The website is intended to be hosted using Netlify.