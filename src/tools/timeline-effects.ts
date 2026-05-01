import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const timelineEffectsTools: Tool[] = [
  {
    name: "timeline_effect_add",
    description: "Add an effect to a timeline element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectType: { type: "string", description: "Effect type (e.g. 'blur')" },
      },
      required: ["trackId", "elementId", "effectType"],
    },
  },
  {
    name: "timeline_effect_remove",
    description: "Remove an effect from a timeline element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectId: { type: "string" },
      },
      required: ["trackId", "elementId", "effectId"],
    },
  },
  {
    name: "timeline_effect_update_params",
    description: "Update parameters of an effect",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectId: { type: "string" },
        params: { type: "object", description: "Effect parameter key-value pairs (e.g. {radius: 10})" },
      },
      required: ["trackId", "elementId", "effectId", "params"],
    },
  },
  {
    name: "timeline_effect_toggle",
    description: "Enable or disable an effect",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectId: { type: "string" },
        enabled: { type: "boolean" },
      },
      required: ["trackId", "elementId", "effectId", "enabled"],
    },
  },
  {
    name: "timeline_effect_reorder",
    description: "Reorder effects on an element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        fromIndex: { type: "number" },
        toIndex: { type: "number" },
      },
      required: ["trackId", "elementId", "fromIndex", "toIndex"],
    },
  },
];

export const timelineEffectsHandlers: [string, Handler][] = [
  ["timeline_effect_add", async (args) => {
    const { trackId, elementId, effectType } = z.object({
      trackId: z.string(), elementId: z.string(), effectType: z.string(),
    }).parse(args);
    const effectId = await browserManager.evaluateWithArg(({ trackId, elementId, effectType }: any) => {
      return (window as any).__opencut.timeline.addClipEffect({ trackId, elementId, effectType });
    }, { trackId, elementId, effectType });
    return { success: true, effectId };
  }],

  ["timeline_effect_remove", async (args) => {
    const { trackId, elementId, effectId } = z.object({
      trackId: z.string(), elementId: z.string(), effectId: z.string(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, effectId }: any) => {
      (window as any).__opencut.timeline.removeClipEffect({ trackId, elementId, effectId });
    }, { trackId, elementId, effectId });
    return { success: true };
  }],

  ["timeline_effect_update_params", async (args) => {
    const { trackId, elementId, effectId, params } = z.object({
      trackId: z.string(), elementId: z.string(), effectId: z.string(),
      params: z.record(z.string(), z.unknown()),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, effectId, params }: any) => {
      (window as any).__opencut.timeline.updateClipEffectParams({ trackId, elementId, effectId, params });
    }, { trackId, elementId, effectId, params });
    return { success: true };
  }],

  ["timeline_effect_toggle", async (args) => {
    const { trackId, elementId, effectId, enabled } = z.object({
      trackId: z.string(), elementId: z.string(), effectId: z.string(), enabled: z.boolean(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, effectId, enabled }: any) => {
      (window as any).__opencut.timeline.toggleClipEffect({ trackId, elementId, effectId, enabled });
    }, { trackId, elementId, effectId, enabled });
    return { success: true };
  }],

  ["timeline_effect_reorder", async (args) => {
    const { trackId, elementId, fromIndex, toIndex } = z.object({
      trackId: z.string(), elementId: z.string(), fromIndex: z.number(), toIndex: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, fromIndex, toIndex }: any) => {
      (window as any).__opencut.timeline.reorderClipEffects({ trackId, elementId, fromIndex, toIndex });
    }, { trackId, elementId, fromIndex, toIndex });
    return { success: true };
  }],
];
