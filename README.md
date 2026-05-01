# OpenCut Controller

Control OpenCut video editor via the Model Context Protocol (MCP). Provides 161 tools, 3 resources, and 3 prompt templates for complete video editing automation.

## Features

- **161 MCP tools** for full OpenCut control
- **Dual transport**: stdio (default) and HTTP Streamable
- **3 MCP Resources** to inspect editor state
- **3 MCP Prompts** for common editing tasks
- **Browser integration** via Playwright

## Installation

```bash
cd opencut-controller
bun install
```

## Usage

### stdio Transport (Default)

```bash
cd opencut-controller
bun run src/index.ts
```

### HTTP Streamable Transport

```bash
cd opencut-controller
TRANSPORT_TYPE=http PORT=3002 bun run src/index.ts
```

Server listens at `http://localhost:3002/mcp`

## Available Tools (161)

### Project (6 tools)
- `project_new` - Create new project
- `project_open` - Open existing project
- `project_save` - Save current project
- `project_export` - Export project
- `project_get_info` - Get project information
- `project_close` - Close current project

### Scenes (8 tools)
- `scene_add` - Add new scene
- `scene_remove` - Remove scene
- `scene_rename` - Rename scene
- `scene_duplicate` - Duplicate scene
- `scene_reorder` - Reorder scenes
- `scene_get_active` - Get active scene
- `scene_set_active` - Set active scene
- `scene_list` - List all scenes

### Playback (5 tools)
- `playback_play` - Play
- `playback_pause` - Pause
- `playback_stop` - Stop
- `playback_seek` - Seek to specific time
- `playback_set_speed` - Set playback speed

### Timeline Tracks (7 tools)
- `timeline_track_add` - Add track
- `timeline_track_remove` - Remove track
- `timeline_track_rename` - Rename track
- `timeline_track_reorder` - Reorder tracks
- `timeline_track_toggle_visibility` - Toggle visibility
- `timeline_track_toggle_lock` - Toggle lock
- `timeline_track_list` - List tracks

### Timeline Elements (12 tools)
- `timeline_element_add` - Add element
- `timeline_element_remove` - Remove element
- `timeline_element_update` - Update element
- `timeline_element_move` - Move element
- `timeline_element_trim_start` - Trim start
- `timeline_element_trim_end` - Trim end
- `timeline_element_split` - Split element
- `timeline_element_duplicate` - Duplicate element
- `timeline_element_select` - Select element
- `timeline_element_deselect` - Deselect
- `timeline_element_list` - List elements
- `timeline_element_get_info` - Get info

### Timeline Effects (9 tools)
- `timeline_effect_add` - Add effect
- `timeline_effect_remove` - Remove effect
- `timeline_effect_update` - Update effect
- `timeline_effect_toggle` - Toggle effect
- `timeline_effect_list` - List effects
- `timeline_effect_preset_apply` - Apply preset
- `timeline_effect_keyframe_add` - Add keyframe
- `timeline_effect_keyframe_remove` - Remove keyframe
- `timeline_effect_keyframe_update` - Update keyframe

### Keyframes (8 tools)
- `keyframe_add` - Add keyframe
- `keyframe_remove` - Remove keyframe
- `keyframe_update` - Update keyframe
- `keyframe_list` - List keyframes
- `keyframe_interpolation_set` - Set interpolation
- `keyframe_easing_set` - Set easing
- `keyframe_copy` - Copy keyframe
- `keyframe_paste` - Paste keyframe

### Selection (6 tools)
- `selection_select_all` - Select all
- `selection_deselect_all` - Deselect all
- `selection_invert` - Invert selection
- `selection_copy` - Copy selection
- `selection_cut` - Cut selection
- `selection_delete` - Delete selection

### Clipboard (4 tools)
- `clipboard_copy` - Copy to clipboard
- `clipboard_cut` - Cut to clipboard
- `clipboard_paste` - Paste from clipboard
- `clipboard_clear` - Clear clipboard

### History (5 tools)
- `history_undo` - Undo
- `history_redo` - Redo
- `history_clear` - Clear history
- `history_list` - List history
- `history_jump_to` - Jump to specific state

### Media (10 tools)
- `media_import` - Import media file
- `media_remove` - Remove media
- `media_update_metadata` - Update metadata
- `media_get_info` - Get info
- `media_list` - List media
- `media_search` - Search media
- `media_preview` - Preview media
- `media_trim` - Trim media
- `media_split` - Split media
- `media_optimize` - Optimize media

### Text (7 tools)
- `text_add` - Add text
- `text_update` - Update text
- `text_set_font` - Set font
- `text_set_size` - Set size
- `text_set_color` - Set color
- `text_set_position` - Set position
- `text_animate` - Animate text

### Audio (11 tools)
- `audio_sound_search` - Search sound effects
- `audio_sound_add_to_timeline` - Add sound to timeline
- `audio_music_search` - Search music
- `audio_music_add_to_timeline` - Add music to timeline
- `audio_volume_set` - Set volume
- `audio_fade_in` - Fade in
- `audio_fade_out` - Fade out
- `audio_trim` - Trim audio
- `audio_split` - Split audio
- `audio_mixer_open` - Open mixer
- `audio_effect_apply` - Apply audio effect

### Stickers (5 tools)
- `sticker_add` - Add sticker
- `sticker_remove` - Remove sticker
- `sticker_update` - Update sticker
- `sticker_search` - Search stickers
- `sticker_list` - List stickers

### Transcription (4 tools)
- `transcription_start` - Start transcription
- `transcription_stop` - Stop transcription
- `transcription_get` - Get transcription
- `transcription_export` - Export transcription

### Export (6 tools)
- `export_render` - Render video
- `export_cancel` - Cancel export
- `export_get_status` - Get status
- `export_set_preset` - Set preset
- `export_set_format` - Set format
- `export_set_quality` - Set quality

### Bookmarks (5 tools)
- `bookmark_add` - Add bookmark
- `bookmark_remove` - Remove bookmark
- `bookmark_update` - Update bookmark
- `bookmark_list` - List bookmarks
- `bookmark_jump_to` - Jump to bookmark

### Canvas (6 tools)
- `canvas_zoom_set` - Set zoom
- `canvas_zoom_reset` - Reset zoom
- `canvas_pan` - Pan canvas
- `canvas_fit_to_screen` - Fit to screen
- `canvas_set_resolution` - Set resolution
- `canvas_get_info` - Get info

### Panels (5 tools)
- `panel_toggle` - Toggle panel
- `panel_resize` - Resize panel
- `panel_focus` - Focus panel
- `panel_reset_layout` - Reset layout
- `panel_save_layout` - Save layout

### Keybindings (8 tools)
- `keybinding_set` - Set shortcut
- `keybinding_remove` - Remove shortcut
- `keybinding_reset` - Reset shortcuts
- `keybinding_list` - List shortcuts
- `keybinding_import` - Import shortcuts
- `keybinding_export` - Export shortcuts
- `keybinding_search` - Search shortcuts
- `keybinding_conflict_check` - Check conflicts

### Timeline Settings (5 tools)
- `timeline_settings_set_snap` - Set snap
- `timeline_settings_set_zoom` - Set zoom
- `timeline_settings_set_auto_scroll` - Set auto-scroll
- `timeline_settings_set_ripple_edit` - Set ripple edit
- `timeline_settings_set_ripple_delete` - Set ripple delete

### Storage (10 tools)
- `storage_get` - Get value
- `storage_set` - Set value
- `storage_remove` - Remove value
- `storage_clear` - Clear storage
- `storage_list` - List storage
- `storage_export` - Export storage
- `storage_import` - Import storage
- `storage_sync` - Sync
- `storage_backup` - Backup
- `storage_restore` - Restore

### Auth (3 tools)
- `auth_login` - Login
- `auth_logout` - Logout
- `auth_get_status` - Get status

### API (8 tools)
- `api_request` - Make API request
- `api_get_user` - Get user
- `api_get_projects` - Get projects
- `api_get_templates` - Get templates
- `api_search_assets` - Search assets
- `api_upload_asset` - Upload asset
- `api_get_renders` - Get renders
- `api_cancel_render` - Cancel render

## MCP Resources

### `opencut://projects`
Lists all OpenCut projects. Returns JSON with projects array.

### `opencut://editor/state`
Current editor state. Returns JSON with:
- `activeProject` - Active project ID
- `currentScene` - Current scene ID
- `isPlaying` - Whether playing
- `currentTime` - Current timeline time

### `opencut://timeline/tracks`
Tracks in current scene. Returns JSON with tracks array.

## MCP Prompts

### `create_intro_video`
Creates a 10-second intro video with text overlay.

**Arguments:**
- `text` (required) - Text to display
- `duration` (optional) - Duration in seconds (default: 10)

**Example:**
```json
{
  "name": "create_intro_video",
  "arguments": {
    "text": "Welcome",
    "duration": 10
  }
}
```

### `add_background_music`
Search and add background music to timeline.

**Arguments:**
- `query` (required) - Search query
- `duration` (optional) - Duration to trim in seconds (default: 30)

### `apply_transition`
Apply a transition effect between two clips.

**Arguments:**
- `effect` (required) - Effect name (fade, dissolve, etc.)
- `duration` (optional) - Transition duration in seconds (default: 1)

## Claude Desktop Configuration

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "opencut-controller"
    }
  }
}
```

For HTTP instead of stdio:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "opencut-controller",
      "env": {
        "TRANSPORT_TYPE": "http",
        "PORT": "3002"
      }
    }
  }
}
```

## Requirements

- Bun v1.3.13 or higher
- Chromium/Chrome browser installed (for Playwright)
- OpenCut running in browser

## Troubleshooting

### Server won't start
Verify Bun is installed: `bun --version`
Verify dependencies are installed: `bun install`

### Can't connect to browser
Ensure OpenCut is open in the browser before using tools.

### TypeScript errors
```bash
cd opencut-controller
npx tsc --noEmit
```

## License

MIT
