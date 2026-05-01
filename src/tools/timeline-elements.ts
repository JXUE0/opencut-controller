import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const timelineElementsTools: Tool[] = [
  {
    name: "timeline_element_insert",
    description: "Insert an element into a track",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        element: { type: "object", description: "Element definition (type, name, duration, startTime, mediaId, content, etc.)" },
      },
      required: ["trackId", "element"],
    },
  },
  {
    name: "timeline_element_delete",
    description: "Delete one or more elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
          description: "List of {trackId, elementId} pairs",
        },
      },
      required: ["elements"],
    },
  },
  {
    name: "timeline_element_duplicate",
    description: "Duplicate one or more elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
        offset: { type: "number", description: "Time offset for duplicated elements in seconds" },
      },
      required: ["elements"],
    },
  },
  {
    name: "timeline_element_move",
    description: "Move an element to a different track or time",
    inputSchema: {
      type: "object",
      properties: {
        sourceTrackId: { type: "string" },
        targetTrackId: { type: "string" },
        elementId: { type: "string" },
        newStartTime: { type: "number", description: "New start time in seconds" },
      },
      required: ["sourceTrackId", "targetTrackId", "elementId", "newStartTime"],
    },
  },
  {
    name: "timeline_element_split",
    description: "Split elements at a specific time",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
        splitTime: { type: "number", description: "Time to split at in seconds" },
      },
      required: ["elements", "splitTime"],
    },
  },
  {
    name: "timeline_element_trim",
    description: "Trim the in/out points of an element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        trimStart: { type: "number", description: "Trim in-point in seconds" },
        trimEnd: { type: "number", description: "Trim out-point in seconds" },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "timeline_element_update_duration",
    description: "Update the duration of an element",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        duration: { type: "number", description: "New duration in seconds" },
      },
      required: ["trackId", "elementId", "duration"],
    },
  },
  {
    name: "timeline_element_update_start_time",
    description: "Update the start time of elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
        startTime: { type: "number", description: "New start time in seconds" },
      },
      required: ["elements", "startTime"],
    },
  },
  {
    name: "timeline_element_toggle_visibility",
    description: "Show or hide elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
        hidden: { type: "boolean" },
      },
      required: ["elements", "hidden"],
    },
  },
  {
    name: "timeline_element_toggle_mute",
    description: "Mute or unmute elements",
    inputSchema: {
      type: "object",
      properties: {
        elements: {
          type: "array",
          items: { type: "object", properties: { trackId: { type: "string" }, elementId: { type: "string" } }, required: ["trackId", "elementId"] },
        },
        muted: { type: "boolean" },
      },
      required: ["elements", "muted"],
    },
  },
  {
    name: "timeline_element_update",
    description: "Update arbitrary properties of an element (opacity, transform, blendMode, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
        updates: { type: "object", description: "Key-value pairs to update on the element" },
      },
      required: ["trackId", "elementId", "updates"],
    },
  },
  {
    name: "timeline_element_get",
    description: "Get an element by track ID and element ID",
    inputSchema: {
      type: "object",
      properties: {
        trackId: { type: "string" },
        elementId: { type: "string" },
      },
      required: ["trackId", "elementId"],
    },
  },
  {
    name: "timeline_element_preview",
    description: "Apply temporary (uncommitted) updates to elements for live preview. Call timeline_element_preview_commit to persist or timeline_element_preview_discard to revert.",
    inputSchema: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          description: "Array of element updates to preview",
          items: {
            type: "object",
            properties: {
              trackId: { type: "string" },
              elementId: { type: "string" },
              updates: { type: "object", description: "Partial element fields to apply" },
            },
            required: ["trackId", "elementId", "updates"],
          },
        },
      },
      required: ["updates"],
    },
  },
  {
    name: "timeline_element_preview_commit",
    description: "Commit the active preview as an undoable action",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "timeline_element_preview_discard",
    description: "Discard the active preview and revert elements to their original state",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const timelineElementsHandlers: [string, Handler][] = [
  ["timeline_element_insert", async (args) => {
    const { trackId, element } = z.object({ trackId: z.string(), element: z.record(z.string(), z.unknown()) }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, element }: { trackId: string; element: any }) => {
      (window as any).__opencut.timeline.insertElement({ element, placement: { mode: "explicit", trackId } });
    }, { trackId, element });
    return { success: true };
  }],

  ["timeline_element_delete", async (args) => {
    const { elements } = z.object({ elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })) }).parse(args);
    await browserManager.evaluateWithArg((els: { trackId: string; elementId: string }[]) => {
      (window as any).__opencut.timeline.deleteElements({ elements: els });
    }, elements);
    return { success: true };
  }],

  ["timeline_element_duplicate", async (args) => {
    const { elements, offset } = z.object({
      elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })),
      offset: z.number().optional(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ elements, offset }: { elements: any[]; offset?: number }) => {
      (window as any).__opencut.timeline.duplicateElements({ elements, offset });
    }, { elements, offset });
    return { success: true };
  }],

  ["timeline_element_move", async (args) => {
    const schema = z.object({
      sourceTrackId: z.string(),
      targetTrackId: z.string(),
      elementId: z.string(),
      newStartTime: z.number(),
    });
    const parsed = schema.parse(args);
    await browserManager.evaluateWithArg((p: typeof parsed) => {
      (window as any).__opencut.timeline.moveElement(p);
    }, parsed);
    return { success: true };
  }],

  ["timeline_element_split", async (args) => {
    const { elements, splitTime } = z.object({
      elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })),
      splitTime: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ elements, splitTime }: { elements: any[]; splitTime: number }) => {
      (window as any).__opencut.timeline.splitElements({ elements, splitTime });
    }, { elements, splitTime });
    return { success: true };
  }],

  ["timeline_element_trim", async (args) => {
    const schema = z.object({
      trackId: z.string(),
      elementId: z.string(),
      trimStart: z.number().optional(),
      trimEnd: z.number().optional(),
    });
    const parsed = schema.parse(args);
    await browserManager.evaluateWithArg((p: typeof parsed) => {
      (window as any).__opencut.timeline.updateElementTrim(p);
    }, parsed);
    return { success: true };
  }],

  ["timeline_element_update_duration", async (args) => {
    const { trackId, elementId, duration } = z.object({
      trackId: z.string(), elementId: z.string(), duration: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, duration }: any) => {
      (window as any).__opencut.timeline.updateElementDuration({ trackId, elementId, duration });
    }, { trackId, elementId, duration });
    return { success: true };
  }],

  ["timeline_element_update_start_time", async (args) => {
    const { elements, startTime } = z.object({
      elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })),
      startTime: z.number(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ elements, startTime }: any) => {
      (window as any).__opencut.timeline.updateElementStartTime({ elements, startTime });
    }, { elements, startTime });
    return { success: true };
  }],

  ["timeline_element_toggle_visibility", async (args) => {
    const { elements, hidden } = z.object({
      elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })),
      hidden: z.boolean(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ elements, hidden }: any) => {
      (window as any).__opencut.timeline.toggleElementsVisibility({ elements, hidden });
    }, { elements, hidden });
    return { success: true };
  }],

  ["timeline_element_toggle_mute", async (args) => {
    const { elements, muted } = z.object({
      elements: z.array(z.object({ trackId: z.string(), elementId: z.string() })),
      muted: z.boolean(),
    }).parse(args);
    await browserManager.evaluateWithArg(({ elements, muted }: any) => {
      (window as any).__opencut.timeline.toggleElementsMuted({ elements, muted });
    }, { elements, muted });
    return { success: true };
  }],

  ["timeline_element_update", async (args) => {
    const { trackId, elementId, updates } = z.object({
      trackId: z.string(),
      elementId: z.string(),
      updates: z.record(z.string(), z.unknown()),
    }).parse(args);
    await browserManager.evaluateWithArg(({ trackId, elementId, updates }: any) => {
      (window as any).__opencut.timeline.updateElements({ updates: [{ trackId, elementId, updates }] });
    }, { trackId, elementId, updates });
    return { success: true };
  }],

  ["timeline_element_get", async (args) => {
    const { trackId, elementId } = z.object({ trackId: z.string(), elementId: z.string() }).parse(args);
    const element = await browserManager.evaluateWithArg(({ trackId, elementId }: { trackId: string; elementId: string }) => {
      const track = (window as any).__opencut.timeline.getTrackById({ trackId });
      return track?.elements.find((e: any) => e.id === elementId) ?? null;
    }, { trackId, elementId });
    return { element };
  }],

  ["timeline_element_preview", async (args) => {
    const { updates } = z.object({
      updates: z.array(z.object({
        trackId: z.string(),
        elementId: z.string(),
        updates: z.record(z.string(), z.unknown()),
      })),
    }).parse(args);
    await browserManager.evaluateWithArg((updates: any[]) => {
      (window as any).__opencut.timeline.previewElements({ updates });
    }, updates);
    return { success: true };
  }],

  ["timeline_element_preview_commit", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.timeline.commitPreview(); });
    return { success: true };
  }],

  ["timeline_element_preview_discard", async () => {
    await browserManager.evaluate(() => { (window as any).__opencut.timeline.discardPreview(); });
    return { success: true };
  }],
];
