<p align="center">
  <img src="assets/logo.png" width="150" alt="OpenCut Controller Logo">
</p>

# 🎬 OpenCut Controller (Servidor MCP)

🌐 **Read in English: [README.md](./README.md)**


[![Model Context Protocol](https://img.shields.io/badge/MCP-1.29.0-blue)](https://modelcontextprotocol.io/)
[![npm version](https://img.shields.io/npm/v/opencut-controller.svg)](https://www.npmjs.com/package/opencut-controller)
[![Bun](https://img.shields.io/badge/Bun-%E2%89%A51.3-black)](https://bun.sh/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> [!NOTE]
> **OpenCut Controller** es un robusto servidor basado en el [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) diseñado para automatizar y controlar de forma total el [Editor de Video OpenCut](https://opencut.io) directamente desde modelos de Inteligencia Artificial (como Claude, o agentes dentro de n8n).

Al utilizar **Playwright** en segundo plano, este servidor se inyecta de forma fluida en el entorno del navegador de OpenCut. Esto otorga a los LLMs acceso programático para manipular la línea de tiempo, escenas, recursos multimedia y el motor de renderizado—convirtiendo efectivamente a OpenCut en una poderosa herramienta de edición de video autónoma impulsada por IA.

---

## ✨ Características Principales

- **161 Herramientas MCP**: Control programático exhaustivo sobre las capacidades principales de edición de OpenCut.
- **Soporte de Transporte Dual**: Conéctate localmente mediante `stdio` (por defecto) o intégralo remotamente a través de `HTTP Streamable`.
- **Parchear el Editor Local**:
   Para habilitar el control MCP, necesitas aplicar pequeños parches al código fuente de OpenCut. Proporcionamos un script automatizado para esto:
   ```bash
   bun run scripts/patch-editor.ts ../ruta-a-opencut
   ```

- **Instalar e Iniciar el Editor**:
   ```bash
   cd ../ruta-a-opencut
   bun install
   bun dev:web
   ```
para manipular el estado de la aplicación en tiempo real.
- **Recursos Contextuales**: Inspecciona en vivo el estado del editor, los proyectos actuales y las pistas en la línea de tiempo.
- **Prompts MCP Predefinidos**: Plantillas listas para usar en tareas de edición complejas.

## 🚀 Instalación

Asegúrate de tener [Bun](https://bun.sh/) instalado en tu sistema.

```bash
# Clona el repositorio
git clone https://github.com/JXUE0/opencut-controller.git
cd opencut-controller

# Instala las dependencias (el navegador de Playwright se instalará automáticamente)
bun install
```

> [!TIP]
> El comando `bun install` ejecutará automáticamente un script `postinstall` para descargar los binarios necesarios de Chromium para Playwright. ¡No se necesita configuración manual del navegador!

## 💻 Modo de Uso

El servidor puede iniciarse utilizando dos protocolos de transporte distintos, dependiendo del entorno de tu cliente.

### 1. Transporte `stdio` (Predeterminado)
Ideal para clientes MCP locales estándar como Claude Desktop.

```bash
bun run src/index.ts
```

### 2. Transporte `HTTP` (Streamable)
Ideal para integrar con herramientas de flujo de trabajo externas como n8n o servicios remotos. El servidor escuchará en `http://localhost:3002/mcp`.

> [!WARNING]
> La sintaxis para establecer variables de entorno cambia según tu sistema operativo. Asegúrate de usar el comando correcto a continuación para evitar errores en la terminal.

**Linux / macOS (Bash):**
```bash
TRANSPORT_TYPE=http PORT=3002 bun run src/index.ts
```

**Windows (PowerShell):**
```powershell
$env:TRANSPORT_TYPE="http"; $env:PORT="3002"; bun run src/index.ts
```

## 🛠️ Herramientas MCP Disponibles (161)

El controlador expone 161 herramientas altamente detalladas al LLM, categorizadas de la siguiente manera:

| Categoría | Herramientas | Descripción |
|-----------|--------------|-------------|
| **📁 Proyecto** | 6 | Crear, abrir, guardar y exportar proyectos de OpenCut. |
| **🎬 Escenas** | 8 | Gestionar el ciclo de vida de la escena, renombrado y estado activo. |
| **▶️ Reproducción** | 5 | Controlar la línea de tiempo: reproducir, pausar, detener y buscar. |
| **⏱️ Pistas (Tracks)** | 7 | Añadir, eliminar, bloquear y gestionar la visibilidad de las pistas. |
| **🧩 Elementos (Clips)** | 12 | Manipular clips: recortar, dividir, mover, duplicar y seleccionar. |
| **✨ Efectos** | 9 | Aplicar y ajustar efectos visuales y preajustes (*presets*). |
| **📌 Keyframes** | 8 | Control granular sobre la interpolación de animación y el *easing*. |
| **🎯 Selección/Portapapeles**| 10 | Operaciones estándar de edición (copiar, cortar, pegar, eliminar). |
| **🕰️ Historial** | 5 | Navegar por el historial de deshacer/rehacer (*undo/redo*). |
| **🎞️ Multimedia** | 10 | Importar, buscar, recortar y optimizar archivos multimedia raw. |
| **📝 Texto** | 7 | Generar y formatear superposiciones de texto y animaciones. |
| **🎵 Audio** | 11 | Buscar música/SFX, mezclar volúmenes y aplicar fundidos (*fades*). |
| **🎨 Stickers/Canvas**| 11 | Añadir superposiciones, gestionar el zoom, la resolución y la vista. |
| **⚙️ Transcripción/Exportación**| 10 | Transcribir audio automáticamente y gestionar el renderizado final. |
| **🔖 Marcadores/Paneles** | 10 | Navegar por la interfaz y guardar distribuciones de pantalla. |
| **🔑 Auth y Almacenamiento**| 13 | Gestionar sesiones, copias de seguridad de proyectos y sincronización. |
| **🌐 API** | 8 | Interactuar directamente con el *backend* de OpenCut. |

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

> Asegúrate de reemplazar `/ruta/absoluta/a/opencut-controller` con la ruta de la carpeta real en tu computadora.

Para conectar OpenCut Controller a tu aplicación local de Claude Desktop, añade lo siguiente a tu `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "opencut-controller": {
      "command": "bun",
      "args": ["run", "src/index.ts"],
      "cwd": "/ruta/absoluta/a/opencut-controller"
    }
  }
}
```

## ⚠️ Solución de Problemas

- **"Playwright browser not found"**: Asegúrate de que el comando `postinstall` se ejecutó correctamente. Puedes lanzarlo manualmente con `bun run playwright install chromium`.
- **"PowerShell: The term 'TRANSPORT_TYPE=http' is not recognized"**: Estás usando la sintaxis de Bash en Windows. Utiliza `$env:TRANSPORT_TYPE="http"; bun run src/index.ts` en su lugar.
- **Connection Refused**: Asegúrate de que el editor de OpenCut esté accesible para que Playwright se conecte.

> [!TIP]
> Si encuentras errores de TypeScript durante el desarrollo, puedes verificar los tipos localmente ejecutando `bun run build` (el cual ejecuta `tsc --noEmit`).

## 🛠 Solución de Problemas (Troubleshooting)

### 1. Error: `window.__opencut is undefined`
**Causa**: Estás intentando usar el servidor MCP con la web pública (`opencut.app`).
**Solución**: Debes ejecutar el editor de OpenCut localmente. El sitio público no expone los "hooks" internos necesarios para el control MCP por seguridad.

### 2. Error: `Incompatible React versions`
**Causa**: Las versiones de `react` y `react-dom` no coinciden en el monorepo.
**Solución**: Asegúrate de que ambas tengan la misma versión exacta (ej. `19.0.0`) en el `package.json` raíz y ejecuta `bun install`.

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
