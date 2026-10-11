# @zerovault/extension

Chrome (Manifest V3) extension for ZeroVault: unlock your vault from the popup, copy credentials (clipboard auto-clears) and autofill login forms on the matching site. The vault locks itself after 15 minutes of inactivity.

## Build

```sh
npm run build -w apps/extension
```

Output goes to `apps/extension/dist`. A dev build needs the API URL at build time:

```sh
VITE_API_URL=http://localhost:3000 npm run build -w apps/extension
```

## Load unpacked in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `apps/extension/dist`.

## Web Store packaging

Zip the contents of `apps/extension/dist` and upload the archive in the Chrome Web Store developer dashboard.
