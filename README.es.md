<p align="center">
  <img src="assets/logo.png" width="150" alt="OpenCut Controller Logo">
</p>

# 🎬 OpenCut Controller (Servidor MCP)

🌐 **Read in English: [README.md](./README.md)**


[![Model Context Protocol](https://img.shields.io/badge/MCP-1.29.0-blue)](https://modelcontextprotocol.io/)
[![npm version](https://img.shields.io/npm/v/opencut-controller.svg)](https://www.npmjs.com/package/opencut-controller)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!NOTE]
> **OpenCut Controller** es un robusto servidor basado en el [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) diseñado para automatizar y controlar de forma total el [Editor de Video OpenCut](https://opencut.app/) directamente desde modelos de Inteligencia Artificial (como Claude, o agentes dentro de n8n).

Al utilizar **Playwright** en segundo plano, este servidor se inyecta de forma fluida en el entorno del navegador de OpenCut. Esto otorga a los LLMs acceso programático para manipular la línea de tiempo, escenas, recursos multimedia y el motor de renderizado—convirtiendo efectivamente a OpenCut en una poderosa herramienta de edición de video autónoma impulsada por IA.

---

## ✨ Características Principales

- **161 Herramientas MCP**: Control programático exhaustivo sobre las capacidades principales de edición de OpenCut.
- **Soporte de Transporte Dual**: Conéctate localmente mediante `stdio` (por defecto) o intégralo remotamente a través de `HTTP Streamable`.
- **Integración con Playwright**: Se conecta directamente a la interfaz web de OpenCut para manipular el estado de la aplicación en tiempo real.
- **Recursos Contextuales**: Inspecciona en vivo el estado del editor, los proyectos actuales y las pistas en la línea de tiempo.
- **Prompts MCP Predefinidos**: Plantillas listas para usar en tareas de edición complejas.

## 🚀 Instalación

Asegúrate de tener [pnpm](https://pnpm.io/) (o Bun) instalado en tu sistema.

> [!IMPORTANT]
> **OpenCut Controller requiere el OpenCut Legacy (Next.js App Router)** — la versión con editor completo, línea de tiempo y stores.
> El repo público actual (`OpenCut-app/OpenCut`) es un *rewrite* temprano (núcleo en Rust + app de escritorio GPUI + web en Vite) que aún no tiene editor implementado, así que no hay nada que controlar.
> **Usa el repo legacy archivado:** [`OpenCut-app/opencut-classic`](https://github.com/OpenCut-app/opencut-classic) — el propio upstream lo recomienda por ahora.

```bash
# 1. Clona el editor legacy de OpenCut (requerido para que el MCP funcione)
git clone https://github.com/OpenCut-app/opencut-classic.git
cd opencut-classic

# 2. Clona este controlador MCP
cd ..
git clone https://github.com/JXUE0/opencut-controller.git
cd opencut-controller

# 3. Instala dependencias (Playwright Chromium se instala automático)
pnpm install

# 4. Parchear el Editor Local:
# Para habilitar el control MCP, necesitas aplicar pequeños parches al código fuente de OpenCut.
# Proporcionamos un script automatizado para esto:
pnpm run patch-editor ../opencut-classic

# 5. Instala e inicia el editor en el puerto 3001 (el que el MCP espera por defecto)
cd ../opencut-classic
bun install
cd apps/web && bunx next dev --turbopack -p 3001
```

> [!TIP]
> El comando `pnpm install` ejecutará automáticamente un script `postinstall` para descargar los binarios necesarios de Chromium para Playwright. ¡No se necesita configuración manual del navegador!

> [!NOTE]
> El patcher es idempotente: ejecutarlo de nuevo sobre un editor ya parcheado no hace nada. Si parcheaste con una versión anterior a la 1.32.0, restaura `apps/web/src/components/providers/editor-provider.tsx` desde git antes de volver a ejecutarlo: el parche antiguo exponía el estado de los stores en lugar de los stores.

## ⚙️ Configuración

| Variable | Por defecto | Descripción |
|----------|-------------|-------------|
| `OPENCUT_URL` | `http://localhost:3001` | URL del editor OpenCut local parcheado. |
| `MCP_HEADLESS` | `true` | Ponlo en `false` para ver el navegador mientras trabaja el MCP. |
| `CHROMIUM_PATH` | — | Usa un binario concreto de Chromium/Chrome en lugar del de Playwright. |
| `TRANSPORT_TYPE` | `stdio` | `stdio` o `http`. |
| `PORT` | `3002` | Puerto del transporte HTTP. |
| `MCP_AUTH_TOKEN` | — | Token bearer para el transporte HTTP (muy recomendado). |

**Convenciones:** todos los tiempos (`startTime`, `duration`, `time`, `trimStart`, …) van en **segundos**; el controlador los convierte a los ticks internos de OpenCut. Los FPS aceptan números normales (`30`, `29.97`). El volumen de los elementos va en **dB** (de `-60` a `20`, `0` = original).

## 💻 Modo de Uso

El servidor puede iniciarse utilizando dos protocolos de transporte distintos, dependiendo de tu entorno de cliente.

### 1. Transporte `stdio` (Predeterminado)
Ideal para clientes MCP locales estándar como Claude Desktop.

```bash
npx -y opencut-controller
```

Última versión directamente desde GitHub (se compila al instalar): `npx -y github:JXUE0/opencut-controller`.
Desde un clon de este repo: `pnpm build && node dist/index.js`.

### 2. Transporte `HTTP` (Streamable)
Ideal para integrar con herramientas de flujo de trabajo externas como n8n o servicios remotos. El servidor escucha en `http://localhost:3002/mcp`.

> [!WARNING]
> La sintaxis para variables de entorno cambia según tu sistema operativo. Asegúrate de usar el comando correcto a continuación para evitar errores.

**Linux / macOS (Bash):**
```bash
TRANSPORT_TYPE=http PORT=3002 npx -y opencut-controller
```

**Windows (PowerShell):**
```powershell
$env:TRANSPORT_TYPE="http"; $env:PORT="3002"; npx -y opencut-controller
```

### 3. HTTP con Autenticación
Para acceso remoto seguro, establece un token bearer:

```bash
MCP_AUTH_TOKEN=tu-token-seguro TRANSPORT_TYPE=http PORT=3002 npx -y opencut-controller
```

Luego incluye `Authorization: Bearer tu-token-seguro` en las peticiones.

## 🛠️ Herramientas MCP Disponibles (161)

El controlador expone 161 herramientas altamente granulares al LLM, categorizadas de la siguiente manera:

| Categoría | Herramientas | Descripción |
|-----------|--------------|-------------|
| **📁 Proyecto** | 16 | Crear, cargar, guardar, duplicar proyectos y cambiar sus ajustes. |
| **🎬 Escenas** | 6 | Gestionar el ciclo de vida de la escena, renombrado y estado activo. |
| **▶️ Reproducción** | 10 | Reproducir, pausar, detener, buscar, volumen y silencio. |
| **⏱️ Pistas y ajustes del timeline** | 10 | Listar, inspeccionar, silenciar y ocultar pistas; ajustes del timeline. |
| **🧩 Elementos (Clips)** | 15 | Insertar, recortar, dividir, mover, duplicar y actualizar clips. |
| **✨ Efectos** | 5 | Aplicar y ajustar efectos de clip. |
| **📌 Keyframes** | 6 | Añadir, mover y eliminar keyframes de animación. |
| **🎯 Selección/Portapapeles**| 6 | Seleccionar elementos, copiar y pegar. |
| **🕰️ Historial** | 4 | Deshacer y rehacer. |
| **🎞️ Multimedia** | 7 | Importar archivos y colocarlos en el timeline. |
| **📝 Texto** | 9 | Crear y dar estilo a textos superpuestos. |
| **🎵 Audio** | 8 | Buscar música/SFX y ajustar el volumen de elementos. |
| **🎨 Stickers/Canvas**| 13 | Añadir stickers; tamaño del canvas, FPS y fondo. |
| **⚙️ Transcripción/Exportación**| 11 | Subtítulos desde transcripciones; exportar a archivos MP4/WebM. |
| **🔖 Marcadores/Paneles/Atajos** | 23 | Marcadores del timeline, paneles de la interfaz y atajos. |
| **🔑 Auth y Almacenamiento**| 9 | Sesiones de usuario y almacenamiento. |
| **🌐 API** | 3 | Health check y búsqueda de sonidos vía el *backend* de OpenCut. |

> [!NOTE]
> La pista principal de OpenCut es magnética: su primer clip siempre empieza en `0`. Para posicionar libremente usa un elemento superpuesto (texto, sticker, un segundo clip). Las pistas se crean solas al insertar un elemento sin `trackId`; OpenCut borra las pistas vacías, por eso `timeline_track_add` devuelve un error explicativo.

`export_project` acepta `outputPath` para guardar en disco el `.mp4`/`.webm` renderizado.

## 📦 Recursos MCP
Los recursos proporcionan contexto directamente al LLM sobre el estado actual de OpenCut:
- `opencut://projects` - Array JSON de todos los proyectos disponibles.
- `opencut://editor/state` - Seguimiento en vivo del proyecto activo, escena, tiempo de reproducción y estado del editor.
- `opencut://timeline/tracks` - Desglose detallado de las pistas en la escena activa.

## 🤖 Prompts MCP
Plantillas de inicio rápido para acciones complejas:
- `create_intro_video` - Automatiza la creación de una intro de 10 segundos con textos superpuestos.
- `add_background_music` - Busca en la biblioteca de sonidos de OpenCut y ajusta la música a la duración del video.
- `apply_transition` - Mezcla dos clips utilizando un efecto de transición específico.

## 🔌 Integración con Claude Desktop

Para conectar OpenCut Controller a tu aplicación local de Claude Desktop, añade lo siguiente a tu `claude_desktop_config.json`:

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

El navegador se cierra solo cuando el cliente se desconecta.

## ⚠️ Solución de Problemas

- **"Playwright browser not found"**: Asegúrate de que el comando `postinstall` se ejecutó correctamente. Puedes lanzarlo manualmente con `npx playwright install chromium`.
- **"PowerShell: The term 'TRANSPORT_TYPE=http' is not recognized"**: Estás usando sintaxis de Bash en Windows. Usa `$env:TRANSPORT_TYPE="http"; npx -y opencut-controller` en su lugar.
- **Connection Refused / `ERR_CONNECTION_REFUSED`**: OpenCut no está corriendo en `OPENCUT_URL` (puerto `3001` por defecto, no el `3000` de Next.js).

> [!TIP]
> Para revisar tipos durante el desarrollo ejecuta `pnpm run typecheck`; `pnpm run build` genera `dist/`.

### 1. Error: `window.__opencut is undefined` / `Editor not ready after 30000ms`
**Causa**: Estás intentando usar el servidor MCP con la web pública (`opencut.app`), o el editor local no está parcheado o no compila.
**Solución**: Ejecuta el editor de OpenCut parcheado en local (`pnpm run patch-editor <ruta>`). El sitio público no expone los "hooks" internos necesarios para el control MCP. Si el editor no compila, revisa su terminal en busca de errores de módulos no encontrados.

### Notas de exportación
La exportación MP4 fuerza la codificación H.264 por software (`--disable-accelerated-video-encode`) porque el codificador por hardware de Windows bloquea el exportador de OpenCut, y usa el modo headless nuevo de Chromium porque el headless antiguo se cae al renderizar.

### 2. Error: `Incompatible React versions`
**Causa**: Las versiones de `react` y `react-dom` no coinciden en el monorepo.
**Solución**: Asegúrate de que ambas tengan la misma versión exacta (ej. `19.2.0`) en el `package.json` raíz y ejecuta `pnpm install`.

### 3. Error: `Invalid input: expected string, received undefined` (Error de Zod)
**Causa**: Faltan variables de entorno en `apps/web/.env`.
**Solución**: Asegúrate de tener un archivo `.env` en `apps/web/`. Hemos actualizado el código para que la mayoría sean opcionales, pero `BETTER_AUTH_SECRET` podría seguir siendo necesario.

### 4. Tiempo de espera agotado (Connection Timeout)
**Causa**: El servidor local de OpenCut (Next.js) aún se está compilando.
**Solución**: Espera a ver el mensaje `✓ Ready` en la terminal del editor antes de iniciar el servidor MCP.

---

## 📄 Créditos y Agradecimientos

El código original y el concepto de este proyecto se inspiraron en el trabajo base realizado en [RavenMeld/OpenCut-MCP](https://github.com/RavenMeld/OpenCut-MCP). Extendemos nuestro más sincero agradecimiento a RavenMeld por su trabajo pionero al conectar OpenCut a través del Model Context Protocol.

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.
