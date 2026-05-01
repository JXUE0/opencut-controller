import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const playbackTools: Tool[] = [
  {
    name: "playback_play",
    description: "Start playback from the current time position",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_pause",
    description: "Pause playback",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_toggle",
    description: "Toggle between play and pause",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_stop",
    description: "Pause playback and seek to time 0",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_seek",
    description: "Seek to a specific time in seconds",
    inputSchema: {
      type: "object",
      properties: { time: { type: "number", description: "Time in seconds" } },
      required: ["time"],
    },
  },
  {
    name: "playback_set_volume",
    description: "Set the playback volume (0.0 to 1.0)",
    inputSchema: {
      type: "object",
      properties: { volume: { type: "number", minimum: 0, maximum: 1, description: "Volume level 0.0-1.0" } },
      required: ["volume"],
    },
  },
  {
    name: "playback_mute",
    description: "Mute audio",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_unmute",
    description: "Unmute audio",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_toggle_mute",
    description: "Toggle mute state",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "playback_get_state",
    description: "Get current playback state including currentTime, volume, isPlaying, and isMuted",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const playbackHandlers: [string, Handler][] = [
  ["playback_play", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.play(); });
    return { success: true };
  }],
  ["playback_pause", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.pause(); });
    return { success: true };
  }],
  ["playback_toggle", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.toggle(); });
    return { success: true };
  }],
  ["playback_stop", async () => {
    await browserManager.evaluate(() => {
      const pb = (window as any).__opencut.playback;
      pb.pause();
      pb.seek({ time: 0 });
    });
    return { success: true };
  }],
  ["playback_seek", async (args) => {
    const { time } = z.object({ time: z.number() }).parse(args);
    await browserManager.evaluateWithArg((t: number) => {
      (window as any).__opencut.playback.seek({ time: t });
    }, time);
    return { success: true, time };
  }],
  ["playback_set_volume", async (args) => {
    const { volume } = z.object({ volume: z.number().min(0).max(1) }).parse(args);
    await browserManager.evaluateWithArg((v: number) => {
      (window as any).__opencut.playback.setVolume({ volume: v });
    }, volume);
    return { success: true, volume };
  }],
  ["playback_mute", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.mute(); });
    return { success: true };
  }],
  ["playback_unmute", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.unmute(); });
    return { success: true };
  }],
  ["playback_toggle_mute", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.playback.toggleMute(); });
    return { success: true };
  }],
  ["playback_get_state", async () => {
    return await browserManager.evaluate(() => {
      const pb = (window as any).__opencut.playback;
      return {
        isPlaying: pb.getIsPlaying(),
        currentTime: pb.getCurrentTime(),
        volume: pb.getVolume(),
        isMuted: pb.isMuted(),
      };
    });
  }],
];
