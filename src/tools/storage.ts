import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const storageTools: Tool[] = [
  {
    name: "storage_get_migration_state",
    description: "Get the current storage schema migration state",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "storage_list_projects",
    description: "List all projects directly from storage (doesn't require an active project)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "storage_get_is_dirty",
    description: "Check if the active project has unsaved changes",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const storageHandlers: [string, Handler][] = [
  ["storage_get_migration_state", async () => {
    const state = await browserManager.evaluate(() => {
      return (window as any).__opencut?.project?.getMigrationState?.() ?? { status: "unknown" };
    });
    return { state };
  }],

  ["storage_list_projects", async () => {
    const deadline = Date.now() + 10_000;
    let projects: unknown[] | null = null;
    while (Date.now() < deadline) {
      projects = await browserManager.evaluate(() => {
        const pm = (window as any).__opencut?.project;
        if (!pm || !pm.getIsInitialized?.()) return null;
        return pm.getSavedProjects();
      });
      if (projects !== null) break;
      await new Promise((r) => setTimeout(r, 300));
    }
    return { projects: projects ?? [] };
  }],

  ["storage_get_is_dirty", async () => {
    const isDirty = await browserManager.evaluate(() => {
      return (window as any).__opencut?.save?.getIsDirty?.() ?? false;
    });
    return { isDirty };
  }],
];
