# ArcadeWire

ArcadeWire is a human-first exchange system with near-zero cognitive load.
It should feel like *connecting*, not *running a protocol*.

## Product principles (v1)

- **Single atomic exchange**: created once, resolved once. No visible intermediate steps.
- **One artifact**: the only thing a user shares or enters is a short code.
- **Server is the source of truth**: codes are identifiers, not shared secrets.
- **Immediate determinism**: entering a code resolves or fails with a clear reason.
- **Human UX > mechanical transparency**: protocol details never leak into the UI.

## Run locally

Requirements: Node.js 25+.

```bash
npm run dev
```

Open `http://localhost:8787`.

If PowerShell blocks `npm` scripts on your machine, use:

```bash
"C:\\Program Files\\nodejs\\npm.cmd" run dev
```

Or run Node directly:

```bash
node --watch --experimental-strip-types src/server.ts
```

## GitHub Pages (static demo)

This repo includes a static GitHub Pages site under `docs/` that publishes the browser UI.

To enable it:
- GitHub repo → **Settings** → **Pages**
- **Source**: Deploy from a branch
- **Branch**: `main`
- **Folder**: `/docs`

Note: GitHub Pages can’t run the Node server, so the static deployment uses local device storage to demo the Create/Enter flows.
