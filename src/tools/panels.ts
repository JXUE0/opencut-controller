import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const panelsTools: Tool[] = [
  {
    name: "panel_set_size",
    description: "Set a panel's size percentage",
    inputSchema: {
      type: "object",
      properties: {
        panelId: { type: "string", enum: ["tools", "preview", "properties", "mainContent", "timeline"] },
        size: { type: "number", description: "Size as percentage" },
      },
      required: ["panelId", "size"],
    },
  },
  {
    name: "panel_reset",
    description: "Reset all panels to default sizes",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "panel_get_sizes",
    description: "Get all current panel sizes",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "panel_set_active_tab",
    description: "Set the active tab in the assets panel",
    inputSchema: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: ["media", "sounds", "text", "stickers", "effects", "transitions", "captions", "filters", "adjustment", "settings"],
        },
      },
      required: ["tab"],
    },
  },
  {
    name: "panel_set_media_view_mode",
    description: "Set the media view mode (grid or list)",
    inputSchema: {
      type: "object",
      properties: { mode: { type: "string", enum: ["grid", "list"] } },
      required: ["mode"],
    },
  },
  {
    name: "panel_set_media_sort",
    description: "Set the media sort key and order",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", enum: ["name", "type", "duration", "size"] },
        order: { type: "string", enum: ["asc", "desc"] },
      },
      required: ["key", "order"],
    },
  },
  {
    name: "panel_get_active_tab",
    description: "Get the currently active assets panel tab",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const panelsHandlers: [string, Handler][] = [
  ["panel_set_size", async (args) => {
    const { panelId, size } = z.object({
      panelId: z.enum(["tools", "preview", "properties", "mainContent", "timeline"]),
      size: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ panelId, size }: any) => {
      (window as any).__stores?.panel?.getState()?.setPanel(panelId, size);
    }, { panelId, size });
    return { success: true };
  }],

  ["panel_reset", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.panel?.getState()?.resetPanels();
    });
    return { success: true };
  }],

  ["panel_get_sizes", async () => {
    const sizes = await browserManager.evaluate(() => {
      return (window as any).__stores?.panel?.getState()?.panels;
    });
    return { sizes };
  }],

  ["panel_set_active_tab", async (args) => {
    const { tab } = z.object({
      tab: z.enum(["media", "sounds", "text", "stickers", "effects", "transitions", "captions", "filters", "adjustment", "settings"]),
    }).parse(args);
    await browserManager.evaluateWithArg((t: string) => {
      (window as any).__stores?.assets?.getState()?.setActiveTab(t);
    }, tab);
    return { success: true, tab };
  }],

  ["panel_set_media_view_mode", async (args) => {
    const { mode } = z.object({ mode: z.enum(["grid", "list"]) }).parse(args);
    await browserManager.evaluateWithArg((m: string) => {
      (window as any).__stores?.assets?.getState()?.setMediaViewMode(m);
    }, mode);
    return { success: true, mode };
  }],

  ["panel_set_media_sort", async (args) => {
    const { key, order } = z.object({
      key: z.enum(["name", "type", "duration", "size"]),
      order: z.enum(["asc", "desc"]),
    }).parse(args);
    await browserManager.evaluateWithArg(({ key, order }: any) => {
      (window as any).__stores?.assets?.getState()?.setMediaSort(key, order);
    }, { key, order });
    return { success: true };
  }],

  ["panel_get_active_tab", async () => {
    const tab = await browserManager.evaluate(() => {
      return (window as any).__stores?.assets?.getState()?.activeTab;
    });
    return { tab };
  }],
];
