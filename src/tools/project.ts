import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const projectTools: Tool[] = [
  {
    name: "project_create",
    description: "Create a new project and navigate to it. Returns the new project ID.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Project name" } },
      required: ["name"],
    },
  },
  {
    name: "project_load",
    description: "Load a project by ID into the editor",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Project ID" } },
      required: ["id"],
    },
  },
  {
    name: "project_save",
    description: "Save the currently active project",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_delete",
    description: "Delete a project by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Project ID to delete" } },
      required: ["id"],
    },
  },
  {
    name: "project_list",
    description: "List all saved projects with metadata",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_get_active",
    description: "Get info about the currently active project",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_rename",
    description: "Rename the active project",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "New project name" } },
      required: ["name"],
    },
  },
  {
    name: "project_update_settings",
    description: "Update project settings such as FPS, canvas size, and background",
    inputSchema: {
      type: "object",
      properties: {
        fps: { type: "number", description: "Frames per second (e.g. 24, 30, 60)" },
        canvasWidth: { type: "number", description: "Canvas width in pixels" },
        canvasHeight: { type: "number", description: "Canvas height in pixels" },
        backgroundType: { type: "string", enum: ["color", "blur"], description: "Background type" },
        backgroundColor: { type: "string", description: "Background color (hex, e.g. #000000)" },
        blurIntensity: { type: "number", description: "Background blur intensity" },
      },
      required: [],
    },
  },
  {
    name: "project_get_timeline_view_state",
    description: "Get the current timeline view state (zoom, scroll, playhead)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_set_timeline_view_state",
    description: "Set the timeline view state",
    inputSchema: {
      type: "object",
      properties: {
        zoomLevel: { type: "number" },
        scrollLeft: { type: "number" },
        playheadTime: { type: "number" },
      },
      required: [],
    },
  },
  {
    name: "project_get_export_state",
    description: "Get the current export state (progress, isExporting, result)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_cancel_export",
    description: "Cancel an in-progress export",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_clear_export_state",
    description: "Clear the export state after completion",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_close",
    description: "Close the active project and navigate to the projects page",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_get_total_duration",
    description: "Get the total duration of the active project in seconds",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "project_duplicate",
    description: "Duplicate one or more projects by ID. Returns the new project IDs.",
    inputSchema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "string" }, description: "Project IDs to duplicate" } },
      required: ["ids"],
    },
  },
];

export const projectHandlers: [string, Handler][] = [
  ["project_create", async (args) => {
    const { name } = z.object({ name: z.string() }).parse(args);
    // Navigate to editor with a nonexistent ID — editor-provider creates a new project and redirects
    const id = await browserManager.navigateToNewProject();
    // Rename from "Untitled Project" to the requested name
    await browserManager.evaluateAsyncWithArg(async ({ id, name }: { id: string; name: string }) => {
      await (window as any).__opencut.project.renameProject({ id, name });
    }, { id, name });
    return { success: true, id };
  }],

  ["project_load", async (args) => {
    const { id } = z.object({ id: z.string() }).parse(args);
    await browserManager.navigateToEditor(id);
    return { success: true, id };
  }],

  ["project_save", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.save.flush(); });
    return { success: true };
  }],

  ["project_delete", async (args) => {
    const { id } = z.object({ id: z.string() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (projectId: string) => {
      await (window as any).__opencut.project.deleteProjects({ ids: [projectId] });
    }, id);
    return { success: true };
  }],

  ["project_list", async () => {
    // Poll until project manager is initialized (loadAllProjects may still be running)
    const deadline = Date.now() + 10_000;
    let projects: unknown[] | null = null;
    while (Date.now() < deadline) {
      projects = await browserManager.evaluate(() => {
        const pm = (window as any).__opencut?.project;
        if (!pm || !pm.getIsInitialized()) return null;
        return pm.getSavedProjects();
      });
      if (projects !== null) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    return { projects: projects ?? [] };
  }],

  ["project_get_active", async () => {
    const project = await browserManager.evaluate(() => {
      const p = (window as any).__opencut.project.getActiveOrNull();
      if (!p) return null;
      return {
        id: p.metadata.id,
        name: p.metadata.name,
        duration: p.metadata.duration,
        fps: p.settings.fps,
        canvasSize: p.settings.canvasSize,
        background: p.settings.background,
        sceneCount: p.scenes.length,
        currentSceneId: p.currentSceneId,
        version: p.version,
      };
    });
    return { project };
  }],

  ["project_rename", async (args) => {
    const { name } = z.object({ name: z.string() }).parse(args);
    const id = await browserManager.evaluate(() => (window as any).__opencut.project.getActive().metadata.id);
    await browserManager.evaluateAsyncWithArg(async ({ id, name }: { id: string; name: string }) => {
      await (window as any).__opencut.project.renameProject({ id, name });
    }, { id, name });
    return { success: true };
  }],

  ["project_update_settings", async (args) => {
    const schema = z.object({
      fps: z.number().optional(),
      canvasWidth: z.number().optional(),
      canvasHeight: z.number().optional(),
      backgroundType: z.enum(["color", "blur"]).optional(),
      backgroundColor: z.string().optional(),
      blurIntensity: z.number().optional(),
    });
    const parsed = schema.parse(args);
    await browserManager.evaluateWithArg((p: typeof parsed) => {
      const settings: any = {};
      if (p.fps !== undefined) settings.fps = p.fps;
      if (p.canvasWidth !== undefined || p.canvasHeight !== undefined) {
        const current = (window as any).__opencut.project.getActive().settings.canvasSize;
        settings.canvasSize = {
          width: p.canvasWidth ?? current.width,
          height: p.canvasHeight ?? current.height,
        };
      }
      if (p.backgroundType !== undefined || p.backgroundColor !== undefined || p.blurIntensity !== undefined) {
        const current = (window as any).__opencut.project.getActive().settings.background;
        settings.background = {
          type: p.backgroundType ?? current.type,
          color: p.backgroundColor ?? current.color,
          blurIntensity: p.blurIntensity ?? current.blurIntensity,
        };
      }
      (window as any).__opencut.project.updateSettings({ settings });
    }, parsed);
    return { success: true };
  }],

  ["project_get_timeline_view_state", async () => {
    const state = await browserManager.evaluate(() => {
      return (window as any).__opencut.project.getTimelineViewState();
    });
    return { state };
  }],

  ["project_set_timeline_view_state", async (args) => {
    const schema = z.object({
      zoomLevel: z.number().optional(),
      scrollLeft: z.number().optional(),
      playheadTime: z.number().optional(),
    });
    const viewState = schema.parse(args);
    await browserManager.evaluateWithArg((vs: typeof viewState) => {
      (window as any).__opencut.project.setTimelineViewState({ viewState: vs });
    }, viewState);
    return { success: true };
  }],

  ["project_get_export_state", async () => {
    const state = await browserManager.evaluate(() => {
      return (window as any).__opencut.project.getExportState();
    });
    return { state };
  }],

  ["project_cancel_export", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.project.cancelExport(); });
    return { success: true };
  }],

  ["project_clear_export_state", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.project.clearExportState(); });
    return { success: true };
  }],

  ["project_close", async () => {
    await browserManager.evaluateAsyncWithArg(async (_: null) => {
      await (window as any).__opencut.project.prepareExit();
      (window as any).__opencut.project.closeProject();
    }, null);
    await browserManager.navigateToHome();
    return { success: true };
  }],

  ["project_get_total_duration", async () => {
    const duration = await browserManager.evaluate(() => {
      return (window as any).__opencut.timeline.getTotalDuration();
    });
    return { duration };
  }],

  ["project_duplicate", async (args) => {
    const { ids } = z.object({ ids: z.array(z.string()) }).parse(args);
    const newIds = await browserManager.evaluateAsyncWithArg(async (ids: string[]) => {
      return await (window as any).__opencut.project.duplicateProjects({ ids });
    }, ids);
    return { success: true, newIds };
  }],
];
