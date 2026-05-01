import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const audioTools: Tool[] = [
  {
    name: "audio_set_element_volume",
    description: "Set the volume of an audio element on the timeline",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        volume: { type: "number", minimum: 0, maximum: 1 },
      },
      required: ["trackId", "elementId", "volume"],
    },
  },
  {
    name: "audio_sound_search",
    description: "Search for sound effects from the Freesound library",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        type: { type: "string", enum: ["songs", "effects"], description: "Sound type" },
        page: { type: "number", description: "Page number (default: 1)" },
        pageSize: { type: "number", description: "Results per page (default: 20, max: 150)" },
        sort: { type: "string", enum: ["downloads", "rating", "created", "score"] },
        minRating: { type: "number", minimum: 0, maximum: 5 },
        commercialOnly: { type: "boolean", description: "Only commercial-use sounds" },
      },
      required: ["query"],
    },
  },
  {
    name: "audio_sound_save",
    description: "Save a sound effect to the user's saved sounds library",
    inputSchema: {
      type: "object",
      properties: {
        soundEffect: { type: "object", description: "Sound effect object from search results" },
      },
      required: ["soundEffect"],
    },
  },
  {
    name: "audio_sound_remove_saved",
    description: "Remove a sound from the saved sounds library",
    inputSchema: {
      type: "object",
      properties: { soundId: { type: "number", description: "Numeric sound ID from saved sounds list" } },
      required: ["soundId"],
    },
  },
  {
    name: "audio_sound_list_saved",
    description: "List all saved sounds in the user's library",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "audio_sound_toggle_commercial_filter",
    description: "Toggle the commercial-only filter for sound search",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "audio_sound_add_to_timeline",
    description: "Add a sound from the library to the timeline",
    inputSchema: {
      type: "object",
      properties: {
        sourceUrl: { type: "string", description: "Sound preview/download URL" },
        name: { type: "string", description: "Sound name" },
        duration: { type: "number", description: "Duration in seconds" },
        startTime: { type: "number", description: "Start time on timeline in seconds" },
      },
      required: ["sourceUrl", "name"],
    },
  },
  {
    name: "audio_sound_clear_saved",
    description: "Clear all saved sounds from the library",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const audioHandlers: [string, Handler][] = [
  ["audio_set_element_volume", async (args) => {
    const { trackId, elementId, volume } = z.object({
      trackId: z.string(), elementId: z.string(), volume: z.number().min(0).max(1),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, volume }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, updates: { volume } }] });
    }, { trackId, elementId, volume });
    return { success: true };
  }],

  ["audio_sound_search", async (args) => {
    const schema = z.object({
      query: z.string(),
      type: z.enum(["songs", "effects"]).optional(),
      page: z.number().optional(),
      pageSize: z.number().optional(),
      sort: z.enum(["downloads", "rating", "created", "score"]).optional(),
      minRating: z.number().optional(),
      commercialOnly: z.boolean().optional(),
    });
    const p = schema.parse(args);
    const params = new URLSearchParams({ q: p.query });
    if (p.type) params.set("type", p.type);
    if (p.page) params.set("page", String(p.page));
    if (p.pageSize) params.set("page_size", String(p.pageSize));
    if (p.sort) params.set("sort", p.sort);
    if (p.minRating !== undefined) params.set("min_rating", String(p.minRating));
    if (p.commercialOnly !== undefined) params.set("commercial_only", String(p.commercialOnly));
    const res = await browserManager.fetchApi(`/api/sounds/search?${params}`);
    const data = await res.json();
    return data;
  }],

  ["audio_sound_save", async (args) => {
    const { soundEffect } = z.object({ soundEffect: z.record(z.string(), z.unknown()) }).parse(args);
    await browserManager.evaluateWithArg(async (se: any) => {
      await (window as any).__stores?.sounds?.getState()?.saveSoundEffect({ soundEffect: se });
    }, soundEffect);
    return { success: true };
  }],

  ["audio_sound_remove_saved", async (args) => {
    const { soundId } = z.object({ soundId: z.number() }).parse(args);
    await browserManager.evaluateAsyncWithArg(async (id: number) => {
      await (window as any).__stores?.sounds?.getState()?.removeSavedSound({ soundId: id });
    }, soundId);
    return { success: true };
  }],

  ["audio_sound_list_saved", async () => {
    const sounds = await browserManager.evaluate(() => {
      return (window as any).__stores?.sounds?.getState()?.savedSounds ?? [];
    });
    return { sounds };
  }],

  ["audio_sound_toggle_commercial_filter", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.sounds?.getState()?.toggleCommercialFilter();
    });
    const current = await browserManager.evaluate(() => {
      return (window as any).__stores?.sounds?.getState()?.showCommercialOnly;
    });
    return { success: true, showCommercialOnly: current };
  }],

  ["audio_sound_add_to_timeline", async (args) => {
    const { sourceUrl, name, duration, startTime } = z.object({
      sourceUrl: z.string(),
      name: z.string(),
      duration: z.number().optional(),
      startTime: z.number().optional(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ sourceUrl, name, duration, startTime }: any) => {
      const editor = (window as any).__opencut;
      const trackId = editor.timeline.addTrack({ type: "audio" });
      const dur = duration ?? 30;
      editor.timeline.insertElement({
        element: {
          id: crypto.randomUUID(),
          type: "audio",
          name,
          sourceType: "library",
          sourceUrl,
          duration: dur,
          startTime: startTime ?? editor.playback.getCurrentTime(),
          trimStart: 0,
          trimEnd: dur,
          volume: 1,
        },
        placement: { mode: "explicit", trackId },
      });
    }, { sourceUrl, name, duration, startTime });
    return { success: true };
  }],

  ["audio_sound_clear_saved", async () => {
    await browserManager.evaluate(async () => {
      await (window as any).__stores?.sounds?.getState()?.clearSavedSounds();
    });
    return { success: true };
  }],
];
