# Pensieve

A small calming web app for unloading thoughts into a visual "memory bowl". The app is intentionally local-first: thoughts and wallpaper preferences are stored in the browser via `localStorage`.

## Features

- Add a thought through a wand animation.
- Watch thoughts float in the pensieve.
- Drag a thought out of the bowl to release/delete it.
- Release all thoughts with a soft reset animation.
- Open a close-up mixing mode where thoughts orbit around the bowl.
- Click a thought in mixing mode to view, edit, or delete it.
- Change the wallpaper from the settings icon.
- Upload a custom wallpaper image; the app compresses it locally before saving.
- Switch between Russian and English.
- Open the info dialog for a short in-app guide.

## Getting Started

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Type check:

```bash
npx tsc --noEmit
```

## Project Structure

- `index.html` contains the static app shell, dialogs, controls, and critical anti-flash styles.
- `src/main.ts` contains app state, localStorage persistence, animations, and UI event handling.
- `src/styles.css` contains the visual system, responsive layout, and CSS animations.
- `src/assets/hand-wand.png` is the wand/hand visual asset used in the capture flow.

## Local Storage

The app uses these keys:

- `pensieve.thoughts.v1` stores thought text.
- `pensieve.wallpaper.v1` stores the active wallpaper key.
- `pensieve.customWallpaper.v1` stores the compressed custom wallpaper data URL.
- `pensieve.language.v1` stores the selected language.

Clearing browser site data resets the app.

## Notes

This is currently a web app, not a packaged browser extension. The visual direction is inspired by a magical memory bowl, but a public product should avoid franchise names, protected terms, and recognizable copyrighted/trademarked designs unless properly licensed.

## Future Ideas

- Mood tags or color tint per thought.
- Optional reminders to revisit thoughts.
- Export/import thoughts as JSON.
- Private lock mode with a passcode.
- A daily "release ritual" summary.
- Multiple bowls or named spaces.
- Sound toggle for subtle ambient feedback.
- PWA install support for desktop/mobile.
