import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const bookmarksTools: Tool[] = [
  {
    name: "bookmark_toggle",
    description: "Toggle a bookmark at the current playhead time or a specified time",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number", description: "Time in seconds (defaults to current playhead)" } },
      required: [],
    },
  },
  {
    name: "bookmark_update",
    description: "Update a bookmark's note, color, or duration",
    inputSchema: {
      type: "object",
      properties: {
        time: { type: "number", description: "Bookmark time to identify it" },
        note: { type: "string" },
        color: { type: "string", description: "Color hex" },
        duration: { type: "number" },
      },
      required: ["time"],
    },
  },
  {
    name: "bookmark_move",
    description: "Move a bookmark to a new time",
    inputSchema: {
      type: "object",
      properties: {
        oldTime: { type: "number" },
        newTime: { type: "number" },
      },
      required: ["oldTime", "newTime"],
    },
  },
  {
    name: "bookmark_remove",
    description: "Remove a bookmark at a specific time",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number" } },
      required: ["time"],
    },
  },
  {
    name: "bookmark_list",
    description: "List all bookmarks in the current scene",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "bookmark_get_at_time",
    description: "Get the bookmark at a specific time (returns null if none)",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number" } },
      required: ["time"],
    },
  },
  {
    name: "bookmark_is_bookmarked",
    description: "Check if there is a bookmark at a specific time",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number" } },
      required: ["time"],
    },
  },
  {
    name: "bookmark_toggle_overlay",
    description: "Toggle the bookmark overlay visibility in the preview",
    inputSchema: {
      type: "object",
      properties: { visible: { type: "boolean", description: "Set visibility explicitly (omit to toggle)" } },
      required: [],
    },
  },
];

export const bookmarksHandlers: [string, Handler][] = [
  ["bookmark_toggle", async (args) => {
    const { time } = z.object({ time: z.number().optional() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (t: number | undefined) => {
      const editor = (window as any).__opencut;
      const bookmarkTime = t ?? editor.playback.getCurrentTime();
      await editor.scenes.toggleBookmark({ time: bookmarkTime });
    }, time);
    return { success: true };
  }],

  ["bookmark_update", async (args) => {
    const schema = z.object({
      time: z.number(),
      note: z.string().optional(),
      color: z.string().optional(),
      duration: z.number().optional(),
    });
    const { time, ...rest } = schema.parse(args);
    const updates = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    await browserManager.evaluateAsyncWithArg(async ({ time, updates }: any) => {
      await (window as any).__opencut.scenes.updateBookmark({ time, updates });
    }, { time, updates });
    return { success: true };
  }],

  ["bookmark_move", async (args) => {
    const { oldTime, newTime } = z.object({ oldTime: z.number(), newTime: z.number() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async ({ fromTime, toTime }: any) => {
      await (window as any).__opencut.scenes.moveBookmark({ fromTime, toTime });
    }, { fromTime: oldTime, toTime: newTime });
    return { success: true };
  }],

  ["bookmark_remove", async (args) => {
    const { time } = z.object({ time: z.number() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (t: number) => {
      await (window as any).__opencut.scenes.removeBookmark({ time: t });
    }, time);
    return { success: true };
  }],

  ["bookmark_list", async () => {
    const bookmarks = await browserManager.evaluate(() => {
      const scene = (window as any).__opencut.scenes.getActiveScene();
      return scene?.bookmarks ?? [];
    });
    return { bookmarks };
  }],

  ["bookmark_get_at_time", async (args) => {
    const { time } = z.object({ time: z.number() }).parse(args);
    const bookmark = await browserManager.evaluateWithArg((t: number) => {
      return (window as any).__opencut.scenes.getBookmarkAtTime({ time: t }) ?? null;
    }, time);
    return { bookmark };
  }],

  ["bookmark_is_bookmarked", async (args) => {
    const { time } = z.object({ time: z.number() }).parse(args);
    const isBookmarked = await browserManager.evaluateWithArg((t: number) => {
      return (window as any).__opencut.scenes.isBookmarked({ time: t });
    }, time);
    return { isBookmarked };
  }],

  ["bookmark_toggle_overlay", async (args) => {
    const { visible } = z.object({ visible: z.boolean().optional() }).parse(args);
    await browserManager.evaluateWithArg((v?: boolean) => {
      const store = (window as any).__stores?.preview?.getState();
      if (v !== undefined) {
        store?.setOverlayVisibility?.({ overlay: "bookmarks", isVisible: v });
      } else {
        store?.toggleOverlayVisibility?.({ overlay: "bookmarks" });
      }
    }, visible);
    return { success: true };
  }],
];
