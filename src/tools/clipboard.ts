import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const clipboardTools: Tool[] = [
  {
    name: "clipboard_copy",
    description: "Copy currently selected elements to the clipboard",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "clipboard_paste",
    description: "Paste elements from the clipboard at the current playhead time",
    inputSchema: {
      type: "object",
      properties: {
        time: { type: "number", description: "Time to paste at in seconds (defaults to current playhead)" },
      },
      required: [],
    },
  },
];

export const clipboardHandlers: [string, Handler][] = [
  ["clipboard_copy", async () => {
    await browserManager.evaluate(() => {
      const editor = (window as any).__opencut;
      const selected = editor.selection.getSelectedElements();
      const results = editor.timeline.getElementsWithTracks({ elements: selected });
      const items = results.map(({ track, element }: any) => {
        const { id: _, ...elementWithoutId } = element;
        return { trackId: track.id, trackType: track.type, element: elementWithoutId };
      });
      (window as any).__stores?.timeline?.getState()?.setClipboard({ items });
    });
    return { success: true };
  }],

  ["clipboard_paste", async (args) => {
    const { time } = z.object({ time: z.number().optional() }).parse(args);
    await browserManager.evaluateWithArg((t?: number) => {
      const editor = (window as any).__opencut;
      const pasteTime = t ?? editor.playback.getCurrentTime();
      const clipboard = (window as any).__stores?.timeline?.getState()?.clipboard;
      if (!clipboard?.items?.length) return;
      editor.timeline.pasteAtTime({ time: pasteTime, clipboardItems: clipboard.items });
    }, time);
    return { success: true };
  }],
];
