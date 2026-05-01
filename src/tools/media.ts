import { z } from "zod";
import * as fs from "node:fs";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const mediaTools: Tool[] = [
  {
    name: "media_list",
    description: "List all media assets in the current project",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "media_add_file",
    description: "Add a local file as a media asset to the project by clicking the upload area",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Absolute path to the local file to upload" },
      },
      required: ["filePath"],
    },
  },
  {
    name: "media_remove",
    description: "Remove a media asset from the project",
    inputSchema: {
      type: "object",
      properties: { mediaId: { type: "string" } },
      required: ["mediaId"],
    },
  },
  {
    name: "media_clear_all",
    description: "Remove all media assets from the project",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "media_get",
    description: "Get info about a specific media asset",
    inputSchema: {
      type: "object",
      properties: { mediaId: { type: "string" } },
      required: ["mediaId"],
    },
  },
  {
    name: "media_add_to_timeline",
    description: "Add a media asset to the timeline at a specific track and time",
    inputSchema: {
      type: "object",
      properties: {
        mediaId: { type: "string" },
        trackId: { type: "string", description: "Target track ID (omit to auto-create)" },
        startTime: { type: "number", description: "Start time in seconds (default: 0)" },
      },
      required: ["mediaId"],
    },
  },
  {
    name: "media_is_loading",
    description: "Check if media is currently being loaded",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const mediaHandlers: [string, Handler][] = [
  ["media_list", async () => {
    const assets = await browserManager.evaluate(() => {
      return (window as any).__opencut.media.getAssets().map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        duration: a.duration,
        width: a.width,
        height: a.height,
      }));
    });
    return { assets };
  }],

  ["media_add_file", async (args) => {
    const { filePath } = z.object({ filePath: z.string() }).parse(args);
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
    const page = await browserManager.getPage();
    // Navigate to media tab and trigger file upload
    await page.evaluate(() => {
      (window as any).__stores?.assets?.getState()?.setActiveTab("media");
    });
    // Find or create the hidden file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
    // Wait briefly for upload to process
    await new Promise((r) => setTimeout(r, 2000));
    const assets = await browserManager.evaluate(() => {
      return (window as any).__opencut.media.getAssets().map((a: any) => ({ id: a.id, name: a.name, type: a.type }));
    });
    return { success: true, assets };
  }],

  ["media_remove", async (args) => {
    const { mediaId } = z.object({ mediaId: z.string() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (id: string) => {
      const projectId = (window as any).__opencut.project.getActive().metadata.id;
      await (window as any).__opencut.media.removeMediaAsset({ projectId, id });
    }, mediaId);
    return { success: true };
  }],

  ["media_clear_all", async () => {
    await browserManager.evaluate(() => {
      (window as any).__opencut.media.clearAllAssets();
    });
    return { success: true };
  }],

  ["media_get", async (args) => {
    const { mediaId } = z.object({ mediaId: z.string() }).parse(args);
    const asset = await browserManager.evaluateWithArg((id: string) => {
      return (window as any).__opencut.media.getAssets().find((a: any) => a.id === id) ?? null;
    }, mediaId);
    return { asset };
  }],

  ["media_add_to_timeline", async (args) => {
    const { mediaId, trackId, startTime } = z.object({
      mediaId: z.string(),
      trackId: z.string().optional(),
      startTime: z.number().optional(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ mediaId, trackId, startTime }: any) => {
      const editor = (window as any).__opencut;
      const asset = editor.media.getAssets().find((a: any) => a.id === mediaId);
      if (!asset) throw new Error(`Media asset ${mediaId} not found`);
      const targetTrackId = trackId ?? editor.timeline.addTrack({ type: asset.type === "audio" ? "audio" : "video" });
      editor.timeline.insertElement({
        element: {
          id: crypto.randomUUID(),
          type: asset.type,
          name: asset.name,
          mediaId: asset.id,
          duration: asset.duration ?? 5,
          startTime: startTime ?? 0,
          trimStart: 0,
          trimEnd: asset.duration ?? 5,
        },
        placement: { mode: "explicit", trackId: targetTrackId },
      });
    }, { mediaId, trackId, startTime });
    return { success: true };
  }],

  ["media_is_loading", async () => {
    const isLoading = await browserManager.evaluate(() => {
      return (window as any).__opencut.media.isLoadingMedia();
    });
    return { isLoading };
  }],
];
