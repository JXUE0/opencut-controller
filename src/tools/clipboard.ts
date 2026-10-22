import { z } from "zod";
import { browserManager, secondsToTicks } from "../browser.js";
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
    const copied = await browserManager.evaluate(() => (window as any).__opencut.clipboard.copy());
    return { success: copied, ...(copied ? {} : { error: "Nothing selected to copy" }) };
  }],

  ["clipboard_paste", async (args) => {
    const { time } = z.object({ time: z.number().optional() }).parse(args);
    // OpenCut defaults to the playhead when time is omitted
    const pasted = await browserManager.evaluateWithArg((t?: number) => {
      return (window as any).__opencut.clipboard.paste(t === undefined ? {} : { time: t });
    }, time === undefined ? undefined : secondsToTicks(time));
    return { success: pasted, ...(pasted ? {} : { error: "Clipboard is empty or paste was rejected" }) };
  }],
];
