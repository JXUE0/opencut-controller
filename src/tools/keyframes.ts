import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const keyframesTools: Tool[] = [
  {
    name: "keyframe_upsert",
    description: "Create or update a keyframe on an element property",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        propertyPath: { type: "string", description: "Property path (e.g. 'transform.x', 'opacity')" },
        time: { type: "number", description: "Time in seconds" },
        value: { description: "Keyframe value (number, string, or object)" },
        interpolation: { type: "string", enum: ["linear", "hold"], description: "Interpolation type" },
      },
      required: ["trackId", "elementId", "propertyPath", "time", "value"],
    },
  },
  {
    name: "keyframe_remove",
    description: "Remove a keyframe from an element property by keyframe ID",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        propertyPath: { type: "string" },
        keyframeId: { type: "string", description: "Keyframe ID to remove" },
      },
      required: ["trackId", "elementId", "propertyPath", "keyframeId"],
    },
  },
  {
    name: "keyframe_retime",
    description: "Move a keyframe to a new time",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        propertyPath: { type: "string" },
        keyframeId: { type: "string" },
        time: { type: "number", description: "New time in seconds" },
      },
      required: ["trackId", "elementId", "propertyPath", "keyframeId", "time"],
    },
  },
  {
    name: "keyframe_effect_param_upsert",
    description: "Create or update a keyframe on an effect parameter",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectId: { type: "string" },
        paramKey: { type: "string" },
        time: { type: "number" },
        value: { type: "number", description: "Parameter value" },
        interpolation: { type: "string", enum: ["linear", "hold"] },
      },
      required: ["trackId", "elementId", "effectId", "paramKey", "time", "value"],
    },
  },
  {
    name: "keyframe_effect_param_remove",
    description: "Remove a keyframe from an effect parameter",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        effectId: { type: "string" },
        paramKey: { type: "string" },
        keyframeId: { type: "string" },
      },
      required: ["trackId", "elementId", "effectId", "paramKey", "keyframeId"],
    },
  },
  {
    name: "keyframe_list",
    description: "List all keyframes for an element",
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

export const keyframesHandlers: [string, Handler][] = [
  ["keyframe_upsert", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(), propertyPath: z.string(),
      time: z.number(), value: z.unknown(),
      interpolation: z.enum(["linear", "hold"]).optional(),
    });
    const parsed = schema.parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      (window as any).__opencut.timeline.upsertKeyframes({
        keyframes: [{
          trackId: p.trackId,
          elementId: p.elementId,
          propertyPath: p.propertyPath,
          time: p.time,
          value: p.value,
          interpolation: p.interpolation,
        }],
      });
    }, parsed);
    return { success: true };
  }],

  ["keyframe_remove", async (args) => {
    const parsed = z.object({
      trackId: z.string(), elementId: z.string(), propertyPath: z.string(), keyframeId: z.string(),
    }).parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      (window as any).__opencut.timeline.removeKeyframes({
        keyframes: [{ trackId: p.trackId, elementId: p.elementId, propertyPath: p.propertyPath, keyframeId: p.keyframeId }],
      });
    }, parsed);
    return { success: true };
  }],

  ["keyframe_retime", async (args) => {
    const parsed = z.object({
      trackId: z.string(), elementId: z.string(), propertyPath: z.string(),
      keyframeId: z.string(), time: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      (window as any).__opencut.timeline.retimeKeyframe({
        trackId: p.trackId,
        elementId: p.elementId,
        propertyPath: p.propertyPath,
        keyframeId: p.keyframeId,
        time: p.time,
      });
    }, parsed);
    return { success: true };
  }],

  ["keyframe_effect_param_upsert", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(), effectId: z.string(),
      paramKey: z.string(), time: z.number(), value: z.number(),
      interpolation: z.enum(["linear", "hold"]).optional(),
    });
    const parsed = schema.parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      (window as any).__opencut.timeline.upsertEffectParamKeyframe(p);
    }, parsed);
    return { success: true };
  }],

  ["keyframe_effect_param_remove", async (args) => {
    const parsed = z.object({
      trackId: z.string(), elementId: z.string(), effectId: z.string(),
      paramKey: z.string(), keyframeId: z.string(),
    }).parse(args);
    await browserManager.evaluateWithArg((p: any) => {
      (window as any).__opencut.timeline.removeEffectParamKeyframe(p);
    }, parsed);
    return { success: true };
  }],

  ["keyframe_list", async (args) => {
    const { trackId, elementId } = z.object({ trackId: z.string(), elementId: z.string() }).parse(args);
    const keyframes = await browserManager.evaluateWithArg(({ trackId, elementId }: any) => {
      const track = (window as any).__opencut.timeline.getTrackById({ trackId });
      const el = track?.elements.find((e: any) => e.id === elementId);
      return el?.animations ?? {};
    }, { trackId, elementId });
    return { keyframes };
  }],
];
