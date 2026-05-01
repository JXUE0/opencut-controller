import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const selectionTools: Tool[] = [
  {
    name: "selection_select",
    description: "Select one or more timeline elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
      },
      required: ["elements"],
    },
  },
  {
    name: "selection_deselect_all",
    description: "Deselect all elements",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "selection_get",
    description: "Get currently selected elements",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "selection_is_selected",
    description: "Check if a specific element is selected",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
      },
      required: ["trackId", "elementId"],
    },
  },
];

export const selectionHandlers: [string, Handler][] = [
  ["selection_select", async (args) => {
    const { elements } = z.object({ elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })) }).parse(args);
    await browserManager.evaluateWithArg((els: any[]) => {
      (window as any).__opencut.selection.setSelectedElements({ elements: els });
    }, elements);
    return { success: true };
  }],

  ["selection_deselect_all", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.selection.clearSelection(); });
    return { success: true };
  }],

  ["selection_get", async () => {
    const selected = await browserManager.evaluate(() => {
      return (window as any).__opencut.selection.getSelectedElements();
    });
    return { selected };
  }],

  ["selection_is_selected", async (args) => {
    const { trackId, elementId } = z.object({ trackId: z.string(), elementId: z.string() }).parse(args);
    const isSelected = await browserManager.evaluateWithArg(({ trackId, elementId }: any) => {
      const selected = (window as any).__opencut.selection.getSelectedElements();
      return selected.some((e: any) => e.trackId === trackId && e.elementId === elementId);
    }, { trackId, elementId });
    return { isSelected };
  }],
];
