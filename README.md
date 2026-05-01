# 🎬 OpenCut Controller (MCP Server)

[![Model Context Protocol](https://img.shields.io/badge/MCP-1.29.0-blue)](https://modelcontextprotocol.io/)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.3-black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**OpenCut Controller** is a robust [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server designed to fully automate and control the [OpenCut Video Editor](https://opencut.io) directly from AI models (like Claude or agents inside n8n). 

By leveraging **Playwright** under the hood, this server seamlessly injects into the OpenCut browser environment, granting LLMs programmatic access to manipulate the timeline, scenes, media assets, rendering engine, and more—effectively turning OpenCut into an AI-driven, headless video editing powerhouse.

---

## ✨ Key Features

- **161 Comprehensive MCP Tools**: Full programmatic control over OpenCut's core editing capabilities.
- **Dual Transport Support**: Connect locally via `stdio` (default) or integrate remotely via modern `HTTP Streamable` transport.
- **Playwright Integration**: Connects directly to the OpenCut web interface to manipulate application state in real-time.
- **Contextual Resources**: Inspect the editor's live state, current projects, and timeline tracks.
- **Pre-built MCP Prompts**: Ready-to-use templates for common high-level editing tasks.

## 🚀 Installation

Ensure you have [Bun](https://bun.sh/) installed on your system.

```bash
# Clone the repository
git clone https://github.com/JXUE0/opencut-controller-MCP.git
cd opencut-controller-MCP

# Install dependencies (Playwright browsers will install automatically)
bun install
```

## 💻 Usage

The server can be launched using two different transport protocols depending on your client environment.

### 1. `stdio` Transport (Default)
Ideal for standard local MCP clients like Claude Desktop.

```bash
bun run src/index.ts
```

### 2. `HTTP` Streamable Transport
Ideal for integrating with external workflow tools like n8n or remote services. The server listens at `http://localhost:3002/mcp`.

**Linux / macOS (Bash):**
```bash
TRANSPORT_TYPE=http PORT=3002 bun run src/index.ts
```

**Windows (PowerShell):**
```powershell
$env:TRANSPORT_TYPE="http"; $env:PORT="3002"; bun run src/index.ts
```

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

To connect OpenCut Controller to your local Claude Desktop app, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/absolute/path/to/opencut-controller-MCP"
    }
  }
}
```

## ⚠️ Troubleshooting

- **"Playwright browser not found"**: Ensure `postinstall` ran successfully. You can trigger it manually with `bun run playwright install chromium`.
- **"PowerShell: The term 'TRANSPORT_TYPE=http' is not recognized"**: You are using bash syntax in Windows. Use `$env:TRANSPORT_TYPE="http"; bun run src/index.ts` instead.
- **Connection Refused**: Ensure OpenCut is open and accessible by Playwright.

## 📄 License
This project is licensed under the MIT License.
