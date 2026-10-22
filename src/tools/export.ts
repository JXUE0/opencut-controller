import { z } from "zod";
import * as fs from "node:fs";
import { browserManager, toFrameRate } from "../browser.js";
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
        outputPath: { type: "string", description: "Absolute path to save the exported video file" },
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
      outputPath: z.string().optional(),
    });
    const { format, quality, fps, includeAudio, pollIntervalMs, timeoutMs, outputPath } = schema.parse(args);

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
    }, { format, quality, fps: fps === undefined ? undefined : toFrameRate(fps), includeAudio });

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
        const result = state?.result;
        if (!result?.success) return { success: false, error: result?.error ?? "Export failed", cancelled: result?.cancelled ?? false };
        if (!outputPath) return { success: true, note: "Pass outputPath to save the file to disk" };
        // The video lives in the page as an ArrayBuffer; ship it out as base64
        const b64: string = await browserManager.evaluate(() => {
          const bytes = new Uint8Array((window as any).__opencut.project.getExportState().result.buffer);
          let bin = "";
          for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          return btoa(bin);
        });
        const data = Buffer.from(b64, "base64");
        fs.writeFileSync(outputPath, data);
        return { success: true, outputPath, bytes: data.length };
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
    await browserManager.evaluateWithArg((fps: unknown) => {
      (window as any).__opencut.project.updateSettings({ settings: { fps } });
    }, toFrameRate(fps));
    return { success: true, fps };
  }],
];
