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
> The current public repo (`OpenCut-app/OpenCut`) is an incomplete rewrite (Vite + TanStack Router).
> **Use the archived legacy repo:** [`OpenCut-app/opencut-classic`](https://github.com/OpenCut-app/opencut-classic)

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

# 5. Install & Run Editor:
cd ../opencut-classic
pnpm install
pnpm dev:web
```

> [!TIP]
> The `pnpm install` command will automatically trigger a `postinstall` script to download the required Playwright Chromium binaries. No manual browser setup is needed!

## 💻 Usage

The server can be launched using two different transport protocols depending on your client environment.

### 1. `stdio` Transport (Default)
Ideal for standard local MCP clients like Claude Desktop.

```bash
pnpm run src/index.ts
```

### 2. `HTTP` Streamable Transport
Ideal for integrating with external workflow tools like n8n or remote services. The server listens at `http://localhost:3002/mcp`.

> [!WARNING]
> Environment variable syntax varies depending on your operating system. Make sure to use the correct command below to prevent errors.

**Linux / macOS (Bash):**
```bash
TRANSPORT_TYPE=http PORT=3002 pnpm run src/index.ts
```

**Windows (PowerShell):**
```powershell
$env:TRANSPORT_TYPE="http"; $env:PORT="3002"; pnpm run src/index.ts
```

### 3. HTTP with Authentication
For secure remote access, set a bearer token:

```bash
MCP_AUTH_TOKEN=your-secure-token TRANSPORT_TYPE=http PORT=3002 pnpm run src/index.ts
```

Then include `Authorization: Bearer your-secure-token` in requests.

## 🛠️ Available MCP Tools (161)

The controller exposes 161 highly granular tools to the LLM, categorized as follows:

| Category | Tools | Description |
|----------|-------|-------------|
| **📁 Project** | 6 | Create, open, save, and export OpenCut projects. |
| **🎬 Scenes** | 8 | Manage scene lifecycle, renaming, and active state. |
| **▶️ Playback** | 5 | Control timeline playback, pause, stop, and seek. |
| **⏱️ Timeline Tracks** | 7 | Add, remove, lock, and manage track visibility. |
| **🧩 Timeline Elements** | 12 | Manipulate clips: trim, split, move, duplicate, and select. |
| **✨ Timeline Effects** | 9 | Apply and tweak visual effects and presets. |
| **📌 Keyframes** | 8 | Granular control over animation interpolation and easing. |
| **🎯 Selection/Clipboard** | 10 | Standard editing operations (copy, cut, paste, delete). |
| **🕰️ History** | 5 | Time-travel through undo/redo states. |
| **🎞️ Media** | 10 | Import, search, trim, and optimize raw media files. |
| **📝 Text** | 7 | Generate and format text overlays and animations. |
| **🎵 Audio** | 11 | Search music/SFX, mix volumes, and apply audio fades. |
| **🎨 Stickers/Canvas**| 11 | Add overlays, manage canvas zoom, resolution, and pan. |
| **⚙️ Transcribe/Export** | 10 | Auto-transcribe audio and manage the final video rendering. |
| **🔖 Bookmarks/Panels** | 10 | Navigate the UI and manage layout layouts. |
| **🔑 Auth & Storage** | 13 | Manage user sessions, project state backups, and sync. |
| **🌐 API** | 8 | Directly interact with OpenCut's backend endpoints. |

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

> Make sure to replace `/absolute/path/to/opencut-controller` with the actual path on your local machine.

To connect OpenCut Controller to your local Claude Desktop app, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "pnpm",
      "args": ["run", "src/index.ts"],
      "cwd": "/absolute/path/to/opencut-controller"
    }
  }
}
```

## ⚠️ Troubleshooting

- **"Playwright browser not found"**: Ensure `postinstall` ran successfully. You can trigger it manually with `pnpm run playwright install chromium`.
- **"PowerShell: The term 'TRANSPORT_TYPE=http' is not recognized"**: You are using bash syntax in Windows. Use `$env:TRANSPORT_TYPE="http"; pnpm run src/index.ts` instead.
- **Connection Refused**: Ensure OpenCut is open and accessible by Playwright.

> [!TIP]
> If you encounter TypeScript errors during development or execution, you can verify your types locally by running `pnpm run build` (which executes `tsc --noEmit`).

## 🛠 Troubleshooting (Solución de problemas)

### 1. Error: `window.__opencut is undefined`
**Cause**: You are trying to use the MCP server with the production web app (`opencut.app`).
**Fix**: You must run the OpenCut editor locally. The production site doesn't expose the internal hooks required for MCP control.

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
