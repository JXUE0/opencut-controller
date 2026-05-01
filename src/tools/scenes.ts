import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const scenesTools: Tool[] = [
  {
    name: "scene_create",
    description: "Create a new scene",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Scene name" } },
      required: ["name"],
    },
  },
  {
    name: "scene_delete",
    description: "Delete a scene by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Scene ID" } },
      required: ["id"],
    },
  },
  {
    name: "scene_rename",
    description: "Rename a scene",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Scene ID" },
        name: { type: "string", description: "New name" },
      },
      required: ["id", "name"],
    },
  },
  {
    name: "scene_switch",
    description: "Switch to a scene by ID",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "Scene ID to switch to" } },
      required: ["id"],
    },
  },
  {
    name: "scene_list",
    description: "List all scenes in the active project",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "scene_get_current",
    description: "Get the currently active scene",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const scenesHandlers: [string, Handler][] = [
  ["scene_create", async (args) => {
    const { name } = z.object({ name: z.string() }).parse(args);
    const id = await browserManager.evaluateAsyncWithArg(async (n: string) => {
      return await (window as any).__opencut.scenes.createScene({ name: n, isMain: false });
    }, name);
    return { success: true, id };
  }],

  ["scene_delete", async (args) => {
    const { id } = z.object({ id: z.string() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (sceneId: string) => {
      await (window as any).__opencut.scenes.deleteScene({ sceneId });
    }, id);
    return { success: true };
  }],

  ["scene_rename", async (args) => {
    const { id, name } = z.object({ id: z.string(), name: z.string() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async ({ id, name }: { id: string; name: string }) => {
      await (window as any).__opencut.scenes.renameScene({ sceneId: id, name });
    }, { id, name });
    return { success: true };
  }],

  ["scene_switch", async (args) => {
    const { id } = z.object({ id: z.string() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (sceneId: string) => {
      await (window as any).__opencut.scenes.switchToScene({ sceneId });
    }, id);
    return { success: true };
  }],

  ["scene_list", async () => {
    const scenes = await browserManager.evaluate(() => {
      return (window as any).__opencut.scenes.getScenes().map((s: any) => ({
        id: s.id,
        name: s.name,
        isMain: s.isMain,
        trackCount: s.tracks.length,
        createdAt: s.createdAt,
      }));
    });
    return { scenes };
  }],

  ["scene_get_current", async () => {
    const scene = await browserManager.evaluate(() => {
      const s = (window as any).__opencut.scenes.getActiveScene();
      return {
        id: s.id,
        name: s.name,
        isMain: s.isMain,
        trackCount: s.tracks.length,
        bookmarkCount: s.bookmarks?.length ?? 0,
      };
    });
    return { scene };
  }],
];
