import { z } from "zod";
import { browserManager, timesToSeconds } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const timelineTracksTools: Tool[] = [
  {
    name: "timeline_track_add",
    description: "Not supported by OpenCut: empty tracks are pruned right after creation. Tracks are created automatically when inserting an element without a trackId.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["video", "audio", "text", "sticker", "effect"], description: "Track type" },
        index: { type: "number", description: "Optional index to insert at" },
      },
      required: ["type"],
    },
  },
  {
    name: "timeline_track_remove",
    description: "Remove a track by ID",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
  {
    name: "timeline_track_toggle_mute",
    description: "Toggle mute on a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        muted: { type: "boolean", description: "Set mute state explicitly (omit to toggle)" },
      },
      required: ["trackId"],
    },
  },
  {
    name: "timeline_track_toggle_visibility",
    description: "Toggle visibility on a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        hidden: { type: "boolean", description: "Set hidden state explicitly (omit to toggle)" },
      },
      required: ["trackId"],
    },
  },
  {
    name: "timeline_track_list",
    description: "List all tracks in the current scene",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "timeline_track_get",
    description: "Get a track by ID",
    inputSchema: {
      type: "object",
      properties: { trackId: { type: "string" } },
      required: ["trackId"],
    },
  },
];

export const timelineTracksHandlers: [string, Handler][] = [
  ["timeline_track_add", async (args) => {
    const schema = z.object({
      type: z.enum(["video", "audio", "text", "sticker", "effect"]),
      index: z.number().optional(),
    });
    schema.parse(args);
    // EditorCore's command reactor removes empty overlay/audio tracks, so addTrack() ids never persist
    throw new Error("OpenCut removes empty tracks immediately, so a track can't be added on its own. Insert an element without trackId (media_add_to_timeline, text_create, ...) and a track is created for it.");
  }],

  ["timeline_track_remove", async (args) => {
    const { trackId } = z.object({ trackId: z.string() }).parse(args);
    await browserManager.evaluateWithArg((id: string) => {
      (window as any).__opencut.timeline.removeTrack({ trackId: id });
    }, trackId);
    return { success: true };
  }],

  ["timeline_track_toggle_mute", async (args) => {
    const { trackId } = z.object({ trackId: z.string(), muted: z.boolean().optional() }).parse(args);
    await browserManager.evaluateWithArg((id: string) => {
      (window as any).__opencut.timeline.toggleTrackMute({ trackId: id });
    }, trackId);
    return { success: true };
  }],

  ["timeline_track_toggle_visibility", async (args) => {
    const { trackId } = z.object({ trackId: z.string(), hidden: z.boolean().optional() }).parse(args);
    await browserManager.evaluateWithArg((id: string) => {
      (window as any).__opencut.timeline.toggleTrackVisibility({ trackId: id });
    }, trackId);
    return { success: true };
  }],

  ["timeline_track_list", async () => {
    const tracks = await browserManager.evaluate(() => {
      // OpenCut keeps tracks as SceneTracks { main, overlay[], audio[] }, not a flat list
      const st = (window as any).__opencut.scenes.getActiveScene().tracks;
      return [st.main, ...st.overlay, ...st.audio].map((t: any) => ({
        id: t.id,
        type: t.type,
        muted: t.muted,
        hidden: t.hidden,
        elementCount: t.elements.length,
      }));
    });
    return { tracks };
  }],

  ["timeline_track_get", async (args) => {
    const { trackId } = z.object({ trackId: z.string() }).parse(args);
    const track = await browserManager.evaluateWithArg((id: string) => {
      const t = (window as any).__opencut.timeline.getTrackById({ trackId: id });
      if (!t) return null;
      return {
        id: t.id,
        type: t.type,
        muted: t.muted,
        hidden: t.hidden,
        elements: t.elements.map((e: any) => ({
          id: e.id,
          type: e.type,
          name: e.name,
          startTime: e.startTime,
          duration: e.duration,
        })),
      };
    }, trackId);
    return { track: track ? { ...track, elements: track.elements.map(timesToSeconds) } : null };
  }],
];
