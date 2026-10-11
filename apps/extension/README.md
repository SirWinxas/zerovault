# @zerovault/extension

Chrome (Manifest V3) extension for ZeroVault. Slice 1: scaffold only (popup, service worker, content-script stub).

## Build

```sh
npm run build -w apps/extension
```

Output goes to `apps/extension/dist`. Set `VITE_API_URL` at build time for the API base (used in later slices).

## Load unpacked in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select `apps/extension/dist`.
