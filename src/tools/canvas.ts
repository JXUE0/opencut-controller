import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const canvasTools: Tool[] = [
  {
    name: "canvas_set_size",
    description: "Set the canvas size for the project",
    inputSchema: {
      type: "object",
      properties: {
        width: { type: "number", description: "Width in pixels" },
        height: { type: "number", description: "Height in pixels" },
        preset: {
          type: "string",
          enum: ["16:9", "9:16", "1:1", "4:3"],
          description: "Use a preset instead of custom dimensions",
        },
      },
      required: [],
    },
  },
  {
    name: "canvas_set_fps",
    description: "Set the project frame rate",
    inputSchema: {
      type: "object",
      properties: { fps: { type: "number", enum: [24, 25, 30, 60, 120] } },
      required: ["fps"],
    },
  },
  {
    name: "canvas_set_background",
    description: "Set the project background (color or blur)",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["color", "blur"] },
        color: { type: "string", description: "Background color hex (for type=color)" },
        blurIntensity: { type: "number", description: "Blur intensity (for type=blur)" },
      },
      required: ["type"],
    },
  },
  {
    name: "canvas_set_layout_guide",
    description: "Set a layout guide overlay on the preview (e.g. TikTok safe zone)",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["tiktok"], description: "Platform layout guide" },
      },
      required: ["platform"],
    },
  },
  {
    name: "canvas_toggle_layout_guide",
    description: "Toggle a layout guide overlay on or off",
    inputSchema: {
      type: "object",
      properties: {
        platform: { type: "string", enum: ["tiktok"] },
      },
      required: ["platform"],
    },
  },
  {
    name: "canvas_clear_layout_guide",
    description: "Remove the active layout guide",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "canvas_get_settings",
    description: "Get current canvas settings (size, FPS, background)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

const PRESETS: Record<string, { width: number; height: number }> = {
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  "1:1": { width: 1080, height: 1080 },
  "4:3": { width: 1440, height: 1080 },
};

export const canvasHandlers: [string, Handler][] = [
  ["canvas_set_size", async (args) => {
    const schema = z.object({
      width: z.number().optional(),
      height: z.number().optional(),
      preset: z.enum(["16:9", "9:16", "1:1", "4:3"]).optional(),
    });
    const { width, height, preset } = schema.parse(args);
    const size = preset ? PRESETS[preset] : { width: width!, height: height! };
    if (!size || !size.width || !size.height) throw new Error("Provide width/height or a preset");
    await browserManager.evaluateWithArg((s: { width: number; height: number }) => {
      (window as any).__opencut.project.updateSettings({ settings: { canvasSize: s } });
    }, size);
    return { success: true, ...size };
  }],

  ["canvas_set_fps", async (args) => {
    const { fps } = z.object({ fps: z.number() }).parse(args);
    await browserManager.evaluateWithArg((fps: number) => {
      (window as any).__opencut.project.updateSettings({ settings: { fps } });
    }, fps);
    return { success: true, fps };
  }],

  ["canvas_set_background", async (args) => {
    const schema = z.object({
      type: z.enum(["color", "blur"]),
      color: z.string().optional(),
      blurIntensity: z.number().optional(),
    });
    const bg = schema.parse(args);
    await browserManager.evaluateWithArg((bg: any) => {
      (window as any).__opencut.project.updateSettings({ settings: { background: bg } });
    }, bg);
    return { success: true };
  }],

  ["canvas_set_layout_guide", async (args) => {
    const { platform } = z.object({ platform: z.enum(["tiktok"]) }).parse(args);
    await browserManager.evaluateWithArg((p: string) => {
      (window as any).__stores?.preview?.getState()?.setLayoutGuide({ platform: p });
    }, platform);
    return { success: true, platform };
  }],

  ["canvas_toggle_layout_guide", async (args) => {
    const { platform } = z.object({ platform: z.enum(["tiktok"]) }).parse(args);
    await browserManager.evaluateWithArg((p: string) => {
      (window as any).__stores?.preview?.getState()?.toggleLayoutGuide(p);
    }, platform);
    return { success: true };
  }],

  ["canvas_clear_layout_guide", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.preview?.getState()?.setLayoutGuide({ platform: null });
    });
    return { success: true };
  }],

  ["canvas_get_settings", async () => {
    const settings = await browserManager.evaluate(() => {
      const p = (window as any).__opencut.project.getActiveOrNull();
      if (!p) return null;
      return p.settings;
    });
    return { settings };
  }],
];
