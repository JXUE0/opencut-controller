<p align="center">
  <img src="assets/logo.png" width="150" alt="OpenCut Controller Logo">
</p>

# 🎬 OpenCut Controller (MCP Server)

🌐 **Leer en Español: [README.es.md](./README.es.md)**


[![Model Context Protocol](https://img.shields.io/badge/MCP-1.29.0-blue)](https://modelcontextprotocol.io/)
[![npm version](https://img.shields.io/npm/v/opencut-controller.svg)](https://www.npmjs.com/package/opencut-controller)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!NOTE]
> **OpenCut Controller** is a robust [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server designed to fully automate and control the [OpenCut Video Editor](https://opencut.app/) directly from AI models (like Claude or agents inside n8n). 

By leveraging **Playwright** under the hood, this server seamlessly injects into the OpenCut browser environment, granting LLMs programmatic access to manipulate the timeline, scenes, media assets, rendering engine, and more—effectively turning OpenCut into an AI-driven, headless video editing powerhouse.

---

## ✨ Key Features

- **161 Comprehensive MCP Tools**: Full programmatic control over OpenCut's core editing capabilities.
- **Dual Transport Support**: Connect locally via `stdio` (default) or integrate remotely via modern `HTTP Streamable` transport.
- **Playwright Integration**: Connects directly to the OpenCut web interface to manipulate application state in real-time.
- **Contextual Resources**: Inspect the editor's live state, current projects, and timeline tracks.
- **Pre-built MCP Prompts**: Ready-to-use templates for common high-level editing tasks.

## 🚀 Installation

Ensure you have [pnpm](https://pnpm.io/) (or Bun) installed on your system.

> [!IMPORTANT]
> **OpenCut Controller requires the Legacy OpenCut (Next.js App Router)** — the version with a complete editor, timeline, and stores.
> The current public repo (`OpenCut-app/OpenCut`) is an early rewrite (Rust core + GPUI desktop app + Vite web shell) whose editor is not implemented yet, so there is nothing to control there.
> **Use the archived legacy repo:** [`OpenCut-app/opencut-classic`](https://github.com/OpenCut-app/opencut-classic) — upstream itself recommends it for now.

```bash
# 1. Clone the legacy OpenCut editor (required for MCP to work)
git clone https://github.com/OpenCut-app/opencut-classic.git
cd opencut-classic

# 2. Clone this MCP controller
cd ..
git clone https://github.com/JXUE0/opencut-controller.git
cd opencut-controller

# 3. Install dependencies (Playwright Chromium installs automatically)
pnpm install

# 4. Patch the Local Editor:
# To enable MCP control, apply small patches to the OpenCut source code.
# We provide an automated script for this:
pnpm run patch-editor ../opencut-classic

# 5. Install & run the editor on port 3001 (the port the MCP expects by default)
cd ../opencut-classic
bun install
cd apps/web && bunx next dev --turbopack -p 3001
```

> [!TIP]
> The `pnpm install` command will automatically trigger a `postinstall` script to download the required Playwright Chromium binaries. No manual browser setup is needed!

> [!NOTE]
> The patcher is idempotent: running it again on an already patched editor is a no-op. If you patched with a version older than 1.32.0, restore `apps/web/src/components/providers/editor-provider.tsx` from git before re-running it — the old patch exposed store state instead of the stores.

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCUT_URL` | `http://localhost:3001` | URL of the patched local OpenCut editor. |
| `MCP_HEADLESS` | `true` | Set to `false` to watch the browser while the MCP works. |
| `CHROMIUM_PATH` | — | Use a specific Chromium/Chrome binary instead of Playwright's. |
| `TRANSPORT_TYPE` | `stdio` | `stdio` or `http`. |
| `PORT` | `3002` | HTTP transport port. |
| `MCP_AUTH_TOKEN` | — | Bearer token for the HTTP transport (strongly recommended). |

**Conventions:** every time value (`startTime`, `duration`, `time`, `trimStart`, …) is in **seconds**; the controller converts to OpenCut's internal ticks. FPS accepts plain numbers (`30`, `29.97`). Element volume is in **dB** (`-60` to `20`, `0` = original).

## 💻 Usage

The server can be launched using two different transport protocols depending on your client environment.

### 1. `stdio` Transport (Default)
Ideal for standard local MCP clients like Claude Desktop.

```bash
npx -y opencut-controller
```

Latest version straight from GitHub (built on install): `npx -y --allow-git=all github:JXUE0/opencut-controller` (`--allow-git` is required since npm 12).
From a clone of this repo: `pnpm build && node dist/index.js`.

### 2. `HTTP` Streamable Transport
Ideal for integrating with external workflow tools like n8n or remote services. The server listens at `http://localhost:3002/mcp`.

> [!WARNING]
> Environment variable syntax varies depending on your operating system. Make sure to use the correct command below to prevent errors.

**Linux / macOS (Bash):**
```bash
TRANSPORT_TYPE=http PORT=3002 npx -y opencut-controller
```

**Windows (PowerShell):**
```powershell
$env:TRANSPORT_TYPE="http"; $env:PORT="3002"; npx -y opencut-controller
```

### 3. HTTP with Authentication
For secure remote access, set a bearer token:

```bash
MCP_AUTH_TOKEN=your-secure-token TRANSPORT_TYPE=http PORT=3002 npx -y opencut-controller
```

Then include `Authorization: Bearer your-secure-token` in requests.

## 🛠️ Available MCP Tools (161)

The controller exposes 161 highly granular tools to the LLM, categorized as follows:

| Category | Tools | Description |
|----------|-------|-------------|
| **📁 Project** | 16 | Create, load, save, duplicate projects and change their settings. |
| **🎬 Scenes** | 6 | Manage scene lifecycle, renaming, and active state. |
| **▶️ Playback** | 10 | Play, pause, stop, seek, volume, and mute. |
| **⏱️ Timeline Tracks & Settings** | 10 | List, inspect, mute, hide tracks; timeline settings. |
| **🧩 Timeline Elements** | 15 | Insert, trim, split, move, duplicate, and update clips. |
| **✨ Timeline Effects** | 5 | Apply and tweak clip effects. |
| **📌 Keyframes** | 6 | Add, retime, and remove animation keyframes. |
| **🎯 Selection/Clipboard** | 6 | Select elements, copy and paste. |
| **🕰️ History** | 4 | Undo and redo. |
| **🎞️ Media** | 7 | Import media files and place them on the timeline. |
| **📝 Text** | 9 | Create and style text overlays. |
| **🎵 Audio** | 8 | Search music/SFX and set element volume. |
| **🎨 Stickers/Canvas**| 13 | Add stickers; canvas size, FPS, and background. |
| **⚙️ Transcribe/Export** | 11 | Captions from transcripts; export to MP4/WebM files. |
| **🔖 Bookmarks/Panels/Keybindings** | 23 | Timeline bookmarks, UI panels, and shortcuts. |
| **🔑 Auth & Storage** | 9 | User sessions and storage. |
| **🌐 API** | 3 | Health check and sound search via OpenCut's backend. |

> [!NOTE]
> OpenCut's main track is magnetic: its first clip always starts at `0`. Use an overlay element (text, sticker, a second clip) for free positioning. Tracks are created automatically when an element is inserted without `trackId`; OpenCut deletes empty tracks, so `timeline_track_add` returns an explanatory error.

`export_project` accepts `outputPath` to write the rendered `.mp4`/`.webm` file to disk.

## 📦 MCP Resources
Resources provide context directly to the LLM about the current state of OpenCut:
- `opencut://projects` - JSON array of all available OpenCut projects.
- `opencut://editor/state` - Live tracking of the active project, scene, playhead time, and playback status.
- `opencut://timeline/tracks` - Detailed breakdown of tracks in the active scene.

## 🤖 MCP Prompts
Quick-start templates for complex actions:
- `create_intro_video` - Automates creating a 10-second intro with text overlays.
- `add_background_music` - Searches the OpenCut sound library and trims music to fit.
- `apply_transition` - Seamlessly blends two clips with a specified effect.

## 🔌 Integrating with Claude Desktop

To connect OpenCut Controller to your local Claude Desktop app, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "npx",
      "args": ["-y", "opencut-controller"],
      "env": { "OPENCUT_URL": "http://localhost:3001" }
    }
  }
}
```

The browser is closed automatically when the client disconnects.

## ⚠️ Troubleshooting

- **"Playwright browser not found"**: Ensure `postinstall` ran successfully. You can trigger it manually with `npx playwright install chromium`. npm 12+ blocks install scripts by default, so with `npx` run `npx playwright install chromium` once before first use.
- **"PowerShell: The term 'TRANSPORT_TYPE=http' is not recognized"**: You are using bash syntax in Windows. Use `$env:TRANSPORT_TYPE="http"; npx -y opencut-controller` instead.
- **Connection Refused / `ERR_CONNECTION_REFUSED`**: OpenCut is not running on `OPENCUT_URL` (default port `3001`, not Next.js' default `3000`).

> [!TIP]
> To check types during development run `pnpm run typecheck`; `pnpm run build` bundles `dist/`.

### 1. Error: `window.__opencut is undefined` / `Editor not ready after 30000ms`
**Cause**: You are trying to use the MCP server with the production web app (`opencut.app`).
**Fix**: You must run the patched OpenCut editor locally (`pnpm run patch-editor <path>`). The production site doesn't expose the internal hooks required for MCP control. If the editor fails to compile, check its terminal for module-not-found errors.

### Export notes
MP4 export forces software H.264 encoding (`--disable-accelerated-video-encode`) because the Windows hardware encoder stalls OpenCut's exporter, and runs in Chromium's new headless mode because the legacy headless shell crashes while rendering.

### 2. Error: `Incompatible React versions`
**Cause**: `react` and `react-dom` versions mismatch in the monorepo.
**Fix**: Ensure both are set to the exact same version (e.g., `19.2.0`) in the root `package.json` and run `pnpm install`.

### 3. Error: `Invalid input: expected string, received undefined` (Zod Error)
**Cause**: Missing environment variables in `apps/web/.env`.
**Fix**: Ensure you have a `.env` file in `apps/web/`. We have updated the code to make most variables optional, but `BETTER_AUTH_SECRET` may still be needed for some features.

### 4. Connection Timeout
**Cause**: The local OpenCut server (Next.js) is still compiling.
**Fix**: Wait until you see `✓ Ready` in the editor terminal before starting the MCP server.

---

## 📄 Credits & Acknowledgments

This project's original codebase and concept were inspired by and built upon the foundational work done in [RavenMeld/OpenCut-MCP](https://github.com/RavenMeld/OpenCut-MCP). We extend our sincere gratitude to RavenMeld for their pioneering work on connecting OpenCut via the Model Context Protocol.

## 📄 License
This project is licensed under the MIT License.
