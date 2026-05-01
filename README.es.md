# OpenCut Controller

Controla el editor de video OpenCut mediante el Protocolo de Contexto de Modelo (MCP). Proporciona 161 herramientas, 3 recursos y 3 plantillas de prompts para automatización completa de edición de video.

## Características

- **161 herramientas MCP** para control total de OpenCut
- **Transporte dual**: stdio (predeterminado) y HTTP Streamable
- **3 Recursos MCP** para inspeccionar estado del editor
- **3 Plantillas de Prompts** para tareas comunes de edición
- **Integración con navegador** mediante Playwright

## Instalación

```bash
cd opencut-controller
bun install
```

## Uso

### Transporte stdio (predeterminado)

```bash
cd opencut-controller
bun run src/index.ts
```

### Transporte HTTP Streamable

```bash
cd opencut-controller
TRANSPORT_TYPE=http PORT=3002 bun run src/index.ts
```

El servidor escuchará en `http://localhost:3002/mcp`

## Herramientas Disponibles (161)

### Proyecto (6 herramientas)
- `project_new` - Crear nuevo proyecto
- `project_open` - Abrir proyecto existente
- `project_save` - Guardar proyecto actual
- `project_export` - Exportar proyecto
- `project_get_info` - Obtener información del proyecto
- `project_close` - Cerrar proyecto actual

### Escenas (8 herramientas)
- `scene_add` - Añadir nueva escena
- `scene_remove` - Eliminar escena
- `scene_rename` - Renombrar escena
- `scene_duplicate` - Duplicar escena
- `scene_reorder` - Reordenar escenas
- `scene_get_active` - Obtener escena activa
- `scene_set_active` - Establecer escena activa
- `scene_list` - Listar todas las escenas

### Reproducción (5 herramientas)
- `playback_play` - Reproducir
- `playback_pause` - Pausar
- `playback_stop` - Detener
- `playback_seek` - Buscar tiempo específico
- `playback_set_speed` - Establecer velocidad de reproducción

### Pistas de Timeline (7 herramientas)
- `timeline_track_add` - Añadir pista
- `timeline_track_remove` - Eliminar pista
- `timeline_track_rename` - Renombrar pista
- `timeline_track_reorder` - Reordenar pistas
- `timeline_track_toggle_visibility` - Alternar visibilidad
- `timeline_track_toggle_lock` - Alternar bloqueo
- `timeline_track_list` - Listar pistas

### Elementos de Timeline (12 herramientas)
- `timeline_element_add` - Añadir elemento
- `timeline_element_remove` - Eliminar elemento
- `timeline_element_update` - Actualizar elemento
- `timeline_element_move` - Mover elemento
- `timeline_element_trim_start` - Recortar inicio
- `timeline_element_trim_end` - Recortar fin
- `timeline_element_split` - Dividir elemento
- `timeline_element_duplicate` - Duplicar elemento
- `timeline_element_select` - Seleccionar elemento
- `timeline_element_deselect` - Deseleccionar
- `timeline_element_list` - Listar elementos
- `timeline_element_get_info` - Obtener información

### Efectos de Timeline (9 herramientas)
- `timeline_effect_add` - Añadir efecto
- `timeline_effect_remove` - Eliminar efecto
- `timeline_effect_update` - Actualizar efecto
- `timeline_effect_toggle` - Alternar efecto
- `timeline_effect_list` - Listar efectos
- `timeline_effect_preset_apply` - Aplicar preset
- `timeline_effect_keyframe_add` - Añadir keyframe
- `timeline_effect_keyframe_remove` - Eliminar keyframe
- `timeline_effect_keyframe_update` - Actualizar keyframe

### Keyframes (8 herramientas)
- `keyframe_add` - Añadir keyframe
- `keyframe_remove` - Eliminar keyframe
- `keyframe_update` - Actualizar keyframe
- `keyframe_list` - Listar keyframes
- `keyframe_interpolation_set` - Establecer interpolación
- `keyframe_easing_set` - Establecer easing
- `keyframe_copy` - Copiar keyframe
- `keyframe_paste` - Pegar keyframe

### Selección (6 herramientas)
- `selection_select_all` - Seleccionar todo
- `selection_deselect_all` - Deseleccionar todo
- `selection_invert` - Invertir selección
- `selection_copy` - Copiar selección
- `selection_cut` - Cortar selección
- `selection_delete` - Eliminar selección

### Portapapeles (4 herramientas)
- `clipboard_copy` - Copiar al portapapeles
- `clipboard_cut` - Cortar al portapapeles
- `clipboard_paste` - Pegar del portapapeles
- `clipboard_clear` - Limpiar portapapeles

### Historial (5 herramientas)
- `history_undo` - Deshacer
- `history_redo` - Rehacer
- `history_clear` - Limpiar historial
- `history_list` - Listar historial
- `history_jump_to` - Saltar a estado específico

### Medios (10 herramientas)
- `media_import` - Importar archivo multimedia
- `media_remove` - Eliminar medio
- `media_update_metadata` - Actualizar metadatos
- `media_get_info` - Obtener información
- `media_list` - Listar medios
- `media_search` - Buscar en medios
- `media_preview` - Previsualizar medio
- `media_trim` - Recortar medio
- `media_split` - Dividir medio
- `media_optimize` - Optimizar medio

### Texto (7 herramientas)
- `text_add` - Añadir texto
- `text_update` - Actualizar texto
- `text_set_font` - Establecer fuente
- `text_set_size` - Establecer tamaño
- `text_set_color` - Establecer color
- `text_set_position` - Establecer posición
- `text_animate` - Animar texto

### Audio (11 herramientas)
- `audio_sound_search` - Buscar efectos de sonido
- `audio_sound_add_to_timeline` - Añadir sonido a timeline
- `audio_music_search` - Buscar música
- `audio_music_add_to_timeline` - Añadir música a timeline
- `audio_volume_set` - Establecer volumen
- `audio_fade_in` - Fundido de entrada
- `audio_fade_out` - Fundido de salida
- `audio_trim` - Recortar audio
- `audio_split` - Dividir audio
- `audio_mixer_open` - Abrir mezclador
- `audio_effect_apply` - Aplicar efecto de audio

### Stickers (5 herramientas)
- `sticker_add` - Añadir sticker
- `sticker_remove` - Eliminar sticker
- `sticker_update` - Actualizar sticker
- `sticker_search` - Buscar stickers
- `sticker_list` - Listar stickers

### Transcripción (4 herramientas)
- `transcription_start` - Iniciar transcripción
- `transcription_stop` - Detener transcripción
- `transcription_get` - Obtener transcripción
- `transcription_export` - Exportar transcripción

### Exportación (6 herramientas)
- `export_render` - Renderizar video
- `export_cancel` - Cancelar exportación
- `export_get_status` - Obtener estado
- `export_set_preset` - Establecer preset
- `export_set_format` - Establecer formato
- `export_set_quality` - Establecer calidad

### Marcadores (5 herramientas)
- `bookmark_add` - Añadir marcador
- `bookmark_remove` - Eliminar marcador
- `bookmark_update` - Actualizar marcador
- `bookmark_list` - Listar marcadores
- `bookmark_jump_to` - Saltar a marcador

### Canvas (6 herramientas)
- `canvas_zoom_set` - Establecer zoom
- `canvas_zoom_reset` - Restablecer zoom
- `canvas_pan` - Desplazar canvas
- `canvas_fit_to_screen` - Ajustar a pantalla
- `canvas_set_resolution` - Establecer resolución
- `canvas_get_info` - Obtener información

### Paneles (5 herramientas)
- `panel_toggle` - Alternar panel
- `panel_resize` - Redimensionar panel
- `panel_focus` - Enfocar panel
- `panel_reset_layout` - Restablecer diseño
- `panel_save_layout` - Guardar diseño

### Keybindings (8 herramientas)
- `keybinding_set` - Establecer atajo
- `keybinding_remove` - Eliminar atajo
- `keybinding_reset` - Restablecer atajos
- `keybinding_list` - Listar atajos
- `keybinding_import` - Importar atajos
- `keybinding_export` - Exportar atajos
- `keybinding_search` - Buscar atajos
- `keybinding_conflict_check` - Verificar conflictos

### Configuración de Timeline (5 herramientas)
- `timeline_settings_set_snap` - Establecer ajuste
- `timeline_settings_set_zoom` - Establecer zoom
- `timeline_settings_set_auto_scroll` - Establecer auto-scroll
- `timeline_settings_set_ripple_edit` - Establecer edición ripple
- `timeline_settings_set_ripple_delete` - Establecer eliminación ripple

### Almacenamiento (10 herramientas)
- `storage_get` - Obtener valor
- `storage_set` - Establecer valor
- `storage_remove` - Eliminar valor
- `storage_clear` - Limpiar almacenamiento
- `storage_list` - Listar almacenamiento
- `storage_export` - Exportar almacenamiento
- `storage_import` - Importar almacenamiento
- `storage_sync` - Sincronizar
- `storage_backup` - Respaldar
- `storage_restore` - Restaurar

### Autenticación (3 herramientas)
- `auth_login` - Iniciar sesión
- `auth_logout` - Cerrar sesión
- `auth_get_status` - Obtener estado

### API (8 herramientas)
- `api_request` - Hacer solicitud API
- `api_get_user` - Obtener usuario
- `api_get_projects` - Obtener proyectos
- `api_get_templates` - Obtener plantillas
- `api_search_assets` - Buscar assets
- `api_upload_asset` - Subir asset
- `api_get_renders` - Obtener renders
- `api_cancel_render` - Cancelar render

## Recursos MCP

### `opencut://projects`
Lista todos los proyectos de OpenCut. Devuelve JSON con array de proyectos.

### `opencut://editor/state`
Estado actual del editor. Devuelve JSON con:
- `activeProject` - ID del proyecto activo
- `currentScene` - ID de la escena actual
- `isPlaying` - Si está reproduciendo
- `currentTime` - Tiempo actual en timeline

### `opencut://timeline/tracks`
Pistas en la escena actual. Devuelve JSON con array de pistas.

## Prompts MCP

### `create_intro_video`
Crea un video introductorio de 10 segundos con texto.

**Argumentos:**
- `text` (requerido) - Texto a mostrar
- `duration` (opcional) - Duración en segundos (defecto: 10)

**Ejemplo:**
```json
{
  "name": "create_intro_video",
  "arguments": {
    "text": "Bienvenido",
    "duration": 10
  }
}
```

### `add_background_music`
Busca y añade música de fondo al timeline.

**Argumentos:**
- `query` (requerido) - Consulta de búsqueda
- `duration` (opcional) - Duración a recortar en segundos (defecto: 30)

### `apply_transition`
Aplica un efecto de transición entre dos clips.

**Argumentos:**
- `effect` (requerido) - Nombre del efecto (fade, dissolve, etc.)
- `duration` (opcional) - Duración de la transición en segundos (defecto: 1)

## Configuración de Claude Desktop

Agrega esto a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/path/to/opencut-controller"
    }
  }
}
```

Para usar HTTP en lugar de stdio:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/path/to/opencut-controller",
      "env": {
        "TRANSPORT_TYPE": "http",
        "PORT": "3002"
      }
    }
  }
}
```

## Requisitos

- Bun v1.3.13 o superior
- Navegador Chromium/Chrome instalado (para Playwright)
- OpenCut ejecutándose en navegador

## Solución de Problemas

### El servidor no inicia
Verifica que Bun esté instalado: `bun --version`
Verifica que las dependencias estén instaladas: `bun install`

### No se conecta al navegador
Asegúrate de que OpenCut esté abierto en el navegador antes de usar las herramientas.

### Error de tipos TypeScript
```bash
cd opencut-controller
npx tsc --noEmit
```

## Licencia

MIT
