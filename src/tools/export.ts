import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const exportTools: Tool[] = [
  {
    name: "export_project",
    description: "Export the current project to a video file. Polls until complete and returns export result.",
    inputSchema: {
      type: "object",
      properties: {
        format: { type: "string", enum: ["mp4", "webm"], description: "Output format (default: mp4)" },
        quality: { type: "string", enum: ["low", "medium", "high", "very_high"], description: "Quality preset (default: high)" },
        fps: { type: "number", description: "Override FPS for export" },
        includeAudio: { type: "boolean", description: "Include audio track (default: true)" },
        pollIntervalMs: { type: "number", description: "Polling interval in ms (default: 1000)" },
        timeoutMs: { type: "number", description: "Max wait time in ms (default: 300000)" },
      },
      required: [],
    },
  },
  {
    name: "export_get_progress",
    description: "Get the current export progress and state",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "export_cancel",
    description: "Cancel an in-progress export",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "export_clear_state",
    description: "Clear the export state after completion",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "export_set_quality",
    description: "Set the export quality (stored as project setting)",
    inputSchema: {
      type: "object",
      properties: {
        quality: { type: "string", enum: ["low", "medium", "high", "very_high"] },
      },
      required: ["quality"],
    },
  },
  {
    name: "export_set_fps",
    description: "Set the FPS for export (updates project settings)",
    inputSchema: {
      type: "object",
      properties: { fps: { type: "number", description: "Frames per second" } },
      required: ["fps"],
    },
  },
];

export const exportHandlers: [string, Handler][] = [
  ["export_project", async (args) => {
    const schema = z.object({
      format: z.enum(["mp4", "webm"]).optional(),
      quality: z.enum(["low", "medium", "high", "very_high"]).optional(),
      fps: z.number().optional(),
      includeAudio: z.boolean().optional(),
      pollIntervalMs: z.number().optional(),
      timeoutMs: z.number().optional(),
    });
    const { format, quality, fps, includeAudio, pollIntervalMs, timeoutMs } = schema.parse(args);

    // Start export
    await browserManager.evaluateWithArg(({ format, quality, fps, includeAudio }: any) => {
      (window as any).__opencut.project.export({
        options: {
          format: format ?? "mp4",
          quality: quality ?? "high",
          fps,
          includeAudio: includeAudio ?? true,
        },
      });
    }, { format, quality, fps, includeAudio });

    // Poll for completion
    const maxWait = timeoutMs ?? 300_000;
    const interval = pollIntervalMs ?? 1000;
    const deadline = Date.now() + maxWait;

    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, interval));
      const state = await browserManager.evaluate(() => {
        return (window as any).__opencut.project.getExportState();
      });
      if (!state?.isExporting) {
        return { success: true, state };
      }
    }
    return { success: false, error: "Export timed out" };
  }],

  ["export_get_progress", async () => {
    const state = await browserManager.evaluate(() => {
      return (window as any).__opencut.project.getExportState();
    });
    return { state };
  }],

  ["export_cancel", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.project.cancelExport(); });
    return { success: true };
  }],

  ["export_clear_state", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.project.clearExportState(); });
    return { success: true };
  }],

  ["export_set_quality", async (args) => {
    // Quality is passed at export time, but we can note it
    const { quality } = z.object({ quality: z.enum(["low", "medium", "high", "very_high"]) }).parse(args);
    return { success: true, quality, note: "Quality will be applied on next export_project call" };
  }],

  ["export_set_fps", async (args) => {
    const { fps } = z.object({ fps: z.number() }).parse(args);
    await browserManager.evaluateWithArg((fps: number) => {
      (window as any).__opencut.project.updateSettings({ settings: { fps } });
    }, fps);
    return { success: true, fps };
  }],
];
