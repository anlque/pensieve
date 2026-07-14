# Extension QA Checklist

Use this checklist after running:

```bash
npm run check:extension
```

Load `dist-extension/` from `chrome://extensions` with Developer mode enabled

## Install And Launch

- The unpacked extension loads without manifest errors
- The toolbar icon appears with the Memory Bowl icon
- Clicking the toolbar icon opens the full app page
- Clicking the toolbar icon again focuses the existing app tab instead of opening duplicates
- Reloading the extension does not show service worker errors

## Storage

- Add at least two thoughts, reload the extension tab, and confirm they remain
- Change language, reload, and confirm the selected language remains
- Change wallpaper, reload, and confirm the selected wallpaper remains
- Upload a custom wallpaper, reload, and confirm it remains
- Release all thoughts, reload, and confirm the bowl stays empty

## Core Flows

- Add a thought with Enter
- Add a thought with the visual submit button
- Open mixing mode and confirm thoughts orbit around the bowl
- Click a thought in mixing mode and confirm the modal opens above the overlay
- Edit a thought from the modal
- Delete a thought from the modal
- Drag a thought out of the bowl and confirm it dissolves
- Use the close button to exit mixing mode

## Responsive

- Test the extension page at full desktop width
- Narrow the window to tablet/mobile widths and confirm controls do not overlap
- Confirm the bowl stays visible in mixing mode
- Confirm the thought stream still ends on the wand light

## Console

- Open DevTools for the extension page
- Confirm there are no CSP, storage, asset loading, or runtime errors
- Inspect the service worker from `chrome://extensions` and confirm there are no toolbar-click errors

## Store Readiness Later

- Replace placeholder SVG icons with final PNG store icons
- Finish franchise-safe naming for all public copy
- Prepare screenshots and a local-only privacy statement
