import { z } from "zod";
import { browserManager, buildTextElement, ticksToSeconds, timesToSeconds } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const textTools: Tool[] = [
  {
    name: "text_create",
    description: "Create a text element on the timeline",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string", description: "Track ID to add text to (omit to auto-create text track)" },
        content: { type: "string", description: "Text content" },
        startTime: { type: "number", description: "Start time in seconds" },
        duration: { type: "number", description: "Duration in seconds (default: 3)" },
        fontSize: { type: "number", description: "Font size in pixels" },
        fontFamily: { type: "string", description: "Font family name" },
        color: { type: "string", description: "Text color (hex)" },
        textAlign: { type: "string", enum: ["left", "center", "right"] },
        fontWeight: { type: "string", enum: ["normal", "bold"] },
        fontStyle: { type: "string", enum: ["normal", "italic"] },
        x: { type: "number", description: "X position" },
        y: { type: "number", description: "Y position" },
      },
      required: ["content"],
    },
  },
  {
    name: "text_update_content",
    description: "Update the text content of a text element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        content: { type: "string" },
      },
      required: ["trackId", "elementId", "content"],
    },
  },
  {
    name: "text_update_font",
    description: "Update font properties of a text element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        fontFamily: { type: "string" },
        fontSize: { type: "number" },
        fontWeight: { type: "string", enum: ["normal", "bold"] },
        fontStyle: { type: "string", enum: ["normal", "italic"] },
        textDecoration: { type: "string", enum: ["none", "underline", "line-through"] },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "text_update_style",
    description: "Update style properties of a text element (color, alignment, spacing)",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        color: { type: "string", description: "Text color (hex)" },
        textAlign: { type: "string", enum: ["left", "center", "right"] },
        letterSpacing: { type: "number" },
        lineHeight: { type: "number" },
        opacity: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "text_update_background",
    description: "Update the background of a text element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        enabled: { type: "boolean" },
        color: { type: "string", description: "Background color (hex)" },
        cornerRadius: { type: "number" },
        paddingX: { type: "number" },
        paddingY: { type: "number" },
        offsetX: { type: "number" },
        offsetY: { type: "number" },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "text_update_transform",
    description: "Update the position and scale of a text element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        scaleX: { type: "number" },
        scaleY: { type: "number" },
        rotation: { type: "number" },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "text_update_blend_mode",
    description: "Update the blend mode of a text element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        blendMode: { type: "string", description: "CSS blend mode (normal, multiply, screen, overlay, etc.)" },
      },
      required: ["trackId", "elementId", "blendMode"],
    },
  },
  {
    name: "text_list",
    description: "List all text elements across all tracks",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "text_delete",
    description: "Delete a text element",
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

export const textHandlers: [string, Handler][] = [
  ["text_create", async (args) => {
    const schema = z.object({
      trackId: z.string().optional(),
      content: z.string(),
      startTime: z.number().optional(),
      duration: z.number().optional(),
      fontSize: z.number().optional(),
      fontFamily: z.string().optional(),
      color: z.string().optional(),
      textAlign: z.enum(["left", "center", "right"]).optional(),
      fontWeight: z.enum(["normal", "bold"]).optional(),
      fontStyle: z.enum(["normal", "italic"]).optional(),
      x: z.number().optional(),
      y: z.number().optional(),
    });
    const p = schema.parse(args);
    const startTime = p.startTime ?? ticksToSeconds(await browserManager.evaluate(() => (window as any).__opencut.playback.getCurrentTime()));
    const element = buildTextElement({ ...p, startTime, duration: p.duration ?? 5 });
    const placed = await browserManager.insertElement(element, p.trackId);
    if (!placed) throw new Error("OpenCut rejected the text element (no free space on the target track?)");
    return { success: true, ...placed };
  }],

  ["text_update_content", async (args) => {
    const { trackId, elementId, content } = z.object({ trackId: z.string(), elementId: z.string(), content: z.string() }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, content }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, patch: { content } }] });
    }, { trackId, elementId, content });
    return { success: true };
  }],

  ["text_update_font", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(),
      fontFamily: z.string().optional(), fontSize: z.number().optional(),
      fontWeight: z.enum(["normal", "bold"]).optional(),
      fontStyle: z.enum(["normal", "italic"]).optional(),
      textDecoration: z.enum(["none", "underline", "line-through"]).optional(),
    });
    const { trackId, elementId, ...updates } = schema.parse(args);
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await browserManager.evaluateWithArg(({ trackId, elementId, updates }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, patch: updates }] });
    }, { trackId, elementId, updates: filtered });
    return { success: true };
  }],

  ["text_update_style", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(),
      color: z.string().optional(), textAlign: z.enum(["left", "center", "right"]).optional(),
      letterSpacing: z.number().optional(), lineHeight: z.number().optional(),
      opacity: z.number().min(0).max(1).optional(),
    });
    const { trackId, elementId, ...updates } = schema.parse(args);
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await browserManager.evaluateWithArg(({ trackId, elementId, updates }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, patch: updates }] });
    }, { trackId, elementId, updates: filtered });
    return { success: true };
  }],

  ["text_update_background", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(),
      enabled: z.boolean().optional(), color: z.string().optional(),
      cornerRadius: z.number().optional(), paddingX: z.number().optional(),
      paddingY: z.number().optional(), offsetX: z.number().optional(), offsetY: z.number().optional(),
    });
    const { trackId, elementId, ...bgUpdates } = schema.parse(args);
    const filtered = Object.fromEntries(Object.entries(bgUpdates).filter(([, v]) => v !== undefined));
    await browserManager.evaluateWithArg(({ trackId, elementId, bg }: any) => {
      const track = (window as any).__opencut.timeline.getTrackById({ trackId });
      const el = track?.elements.find((e: any) => e.id === elementId);
      (window as any).__opencut.timeline.updateElements({
        updates: [{ trackId, elementId, patch: { background: { ...el?.background, ...bg } } }],
      });
    }, { trackId, elementId, bg: filtered });
    return { success: true };
  }],

  ["text_update_transform", async (args) => {
    const schema = z.object({
      trackId: z.string(), elementId: z.string(),
      x: z.number().optional(), y: z.number().optional(),
      scaleX: z.number().optional(), scaleY: z.number().optional(),
      rotation: z.number().optional(),
    });
    const { trackId, elementId, x, y, scaleX, scaleY, rotation } = schema.parse(args);
    // OpenCut's Transform is { scaleX, scaleY, position: { x, y }, rotate }
    const tf = Object.fromEntries(Object.entries({ scaleX, scaleY, rotate: rotation }).filter(([, v]) => v !== undefined));
    await browserManager.evaluateWithArg(({ trackId, elementId, tf, x, y }: any) => {
      const track = (window as any).__opencut.timeline.getTrackById({ trackId });
      const el = track?.elements.find((e: any) => e.id === elementId);
      const position = { ...el?.transform?.position, ...(x !== undefined ? { x } : {}), ...(y !== undefined ? { y } : {}) };
      (window as any).__opencut.timeline.updateElements({
        updates: [{ trackId, elementId, patch: { transform: { ...el?.transform, ...tf, position } } }],
      });
    }, { trackId, elementId, tf, x, y });
    return { success: true };
  }],

  ["text_update_blend_mode", async (args) => {
    const { trackId, elementId, blendMode } = z.object({ trackId: z.string(), elementId: z.string(), blendMode: z.string() }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, blendMode }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, patch: { blendMode } }] });
    }, { trackId, elementId, blendMode });
    return { success: true };
  }],

  ["text_list", async () => {
    const elements = await browserManager.evaluate(() => {
      const st = (window as any).__opencut.scenes.getActiveScene().tracks;
      const textEls: any[] = [];
      for (const t of [st.main, ...st.overlay, ...st.audio]) {
        for (const el of t.elements) {
          if (el.type === "text") {
            textEls.push({ trackId: t.id, elementId: el.id, content: el.content, startTime: el.startTime, duration: el.duration });
          }
        }
      }
      return textEls;
    });
    return { elements: elements.map(timesToSeconds) };
  }],

  ["text_delete", async (args) => {
    const { trackId, elementId } = z.object({ trackId: z.string(), elementId: z.string() }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId }: any) => {
      (window as any).__opencut.timeline.deleteElements({ elements: [{ trackId, elementId }] });
    }, { trackId, elementId });
    return { success: true };
  }],
];
