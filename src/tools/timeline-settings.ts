import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const timelineSettingsTools: Tool[] = [
  {
    name: "timeline_toggle_snapping",
    description: "Toggle timeline snapping on or off",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "timeline_toggle_ripple_editing",
    description: "Toggle ripple editing mode on or off",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "timeline_set_zoom",
    description: "Set the timeline zoom level",
    inputSchema: {
      type: "object",
      properties: { zoomLevel: { type: "number", description: "Zoom level (e.g. 1 = 100%, 2 = 200%)" } },
      required: ["zoomLevel"],
    },
  },
  {
    name: "timeline_set_scroll",
    description: "Set the timeline horizontal scroll position",
    inputSchema: {
      type: "object",
      properties: { scrollLeft: { type: "number", description: "Scroll position in pixels" } },
      required: ["scrollLeft"],
    },
  },
];

export const timelineSettingsHandlers: [string, Handler][] = [
  ["timeline_toggle_snapping", async () => {
    const enabled = await browserManager.evaluate(() => {
      (window as any).__stores?.timeline?.getState()?.toggleSnapping();
      return (window as any).__stores?.timeline?.getState()?.snappingEnabled;
    });
    return { success: true, snappingEnabled: enabled };
  }],

  ["timeline_toggle_ripple_editing", async () => {
    const enabled = await browserManager.evaluate(() => {
      (window as any).__stores?.timeline?.getState()?.toggleRippleEditing();
      return (window as any).__stores?.timeline?.getState()?.rippleEditingEnabled;
    });
    return { success: true, rippleEditingEnabled: enabled };
  }],

  ["timeline_set_zoom", async (args) => {
    const { zoomLevel } = z.object({ zoomLevel: z.number() }).parse(args);
    await browserManager.evaluateWithArg((zoom: number) => {
      (window as any).__opencut.project.setTimelineViewState?.({ viewState: { zoomLevel: zoom } });
    }, zoomLevel);
    return { success: true, zoomLevel };
  }],

  ["timeline_set_scroll", async (args) => {
    const { scrollLeft } = z.object({ scrollLeft: z.number() }).parse(args);
    await browserManager.evaluateWithArg((scroll: number) => {
      (window as any).__opencut.project.setTimelineViewState?.({ viewState: { scrollLeft: scroll } });
    }, scrollLeft);
    return { success: true, scrollLeft };
  }],
];
