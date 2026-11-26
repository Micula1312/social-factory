# SOCIAL FACTORY_

**Automated editorial engine — from URL to carousel.**

An experimental local tool to capture web projects and assemble Instagram-ready editorial slides. No external API keys required.

## Start

```bash
npm install
npx playwright install chromium
npm run dev
```

Open http://localhost:5173. Paste a public URL or a running localhost URL and click **HARVEST**. The first run launches a Playwright Chromium browser on your machine, captures a set of page views and stores images under `exports/<slug>/captures/`. When finished, choose the captured views inside the interface and click **GENERATE**. You can edit titles, subtitle, credits and colors. Export a ZIP of six 1080 × 1350 PNG slides.

## Optional command-line capture

```bash
npm run capture -- https://example.com my-project
```

## Notes

- This app's Vite development server includes a **local-only capture API**. Do not expose it on a public network. The capture endpoint binds to local requests and blocks cloud metadata/private network targets except localhost. It is still intended only for trusted local development.
- Captures are saved to `exports/` and are ignored by Git. Capture happens from the machine where the server runs; a localhost project must be running there.
- The current release exports carousel PNGs. Animated reel export, assisted interaction recording and Instagram publishing are future steps.
- Capturing a site doesn't automatically confer permission to republish third-party imagery. Use projects and media you have rights to share.
