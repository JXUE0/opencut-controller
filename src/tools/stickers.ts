import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const stickersTools: Tool[] = [
  {
    name: "sticker_search",
    description: "Search for stickers by query",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        category: { type: "string", enum: ["all", "emoji", "flags", "icons", "shapes"] },
        limit: { type: "number", description: "Max results (default: 50)" },
      },
      required: ["query"],
    },
  },
  {
    name: "sticker_browse_category",
    description: "Browse stickers by category",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["all", "emoji", "flags", "icons", "shapes"] },
      },
      required: ["category"],
    },
  },
  {
    name: "sticker_add_to_timeline",
    description: "Add a sticker to the timeline",
    inputSchema: {
      type: "object",
      properties: {
        stickerId: { type: "string", description: "Sticker ID (e.g. 'emoji:😀', 'icons:mdi:home')" },
        name: { type: "string", description: "Display name" },
        startTime: { type: "number", description: "Start time in seconds" },
        duration: { type: "number", description: "Duration in seconds (default: 3)" },
        x: { type: "number", description: "X position" },
        y: { type: "number", description: "Y position" },
        scale: { type: "number", description: "Scale (default: 1)" },
      },
      required: ["stickerId"],
    },
  },
  {
    name: "sticker_list_recent",
    description: "List recently used stickers",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "sticker_clear_recent",
    description: "Clear the recent stickers list",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "sticker_set_category",
    description: "Set the active sticker category in the UI",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", enum: ["all", "emoji", "flags", "icons", "shapes"] },
      },
      required: ["category"],
    },
  },
];

export const stickersHandlers: [string, Handler][] = [
  ["sticker_search", async (args) => {
    const { query, category, limit } = z.object({
      query: z.string(),
      category: z.enum(["all", "emoji", "flags", "icons", "shapes"]).optional(),
      limit: z.number().optional(),
    }).parse(args);
    const results = await browserManager.evaluateWithArg(async ({ query, category, limit }: any) => {
      (window as any).__stores?.stickers?.getState()?.setSearchQuery({ query });
      await (window as any).__stores?.stickers?.getState()?.searchStickers({ query });
      return (window as any).__stores?.stickers?.getState()?.searchResults;
    }, { query, category, limit });
    return { results };
  }],

  ["sticker_browse_category", async (args) => {
    const { category } = z.object({ category: z.enum(["all", "emoji", "flags", "icons", "shapes"]) }).parse(args);
    await browserManager.evaluateWithArg((cat: string) => {
      (window as any).__stores?.stickers?.getState()?.setSelectedCategory({ category: cat });
    }, category);
    return { success: true, category };
  }],

  ["sticker_add_to_timeline", async (args) => {
    const schema = z.object({
      stickerId: z.string(),
      name: z.string().optional(),
      startTime: z.number().optional(),
      duration: z.number().optional(),
      x: z.number().optional(),
      y: z.number().optional(),
      scale: z.number().optional(),
    });
    const p = schema.parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      const editor = (window as any).__opencut;
      const trackId = editor.timeline.addTrack({ type: "sticker" });
      const dur = p.duration ?? 3;
      editor.timeline.insertElement({
        element: {
          id: crypto.randomUUID(),
          type: "sticker",
          name: p.name ?? p.stickerId,
          stickerId: p.stickerId,
          duration: dur,
          startTime: p.startTime ?? editor.playback.getCurrentTime(),
          trimStart: 0,
          trimEnd: dur,
          opacity: 1,
          transform: { x: p.x ?? 0, y: p.y ?? 0, scaleX: p.scale ?? 1, scaleY: p.scale ?? 1, rotation: 0 },
        },
        placement: { mode: "explicit", trackId },
      });
      (window as any).__stores?.stickers?.getState()?.addToRecentStickers({ stickerId: p.stickerId });
    }, p);
    return { success: true };
  }],

  ["sticker_list_recent", async () => {
    const recent = await browserManager.evaluate(() => {
      return (window as any).__stores?.stickers?.getState()?.recentStickers ?? [];
    });
    return { recent };
  }],

  ["sticker_clear_recent", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.stickers?.getState()?.clearRecentStickers();
    });
    return { success: true };
  }],

  ["sticker_set_category", async (args) => {
    const { category } = z.object({ category: z.enum(["all", "emoji", "flags", "icons", "shapes"]) }).parse(args);
    await browserManager.evaluateWithArg((cat: string) => {
      (window as any).__stores?.stickers?.getState()?.setSelectedCategory({ category: cat });
    }, category);
    return { success: true };
  }],
];
