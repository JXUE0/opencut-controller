import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const historyTools: Tool[] = [
  {
    name: "history_undo",
    description: "Undo the last action",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "history_redo",
    description: "Redo the last undone action",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "history_can_undo",
    description: "Check if undo is available",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "history_can_redo",
    description: "Check if redo is available",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const historyHandlers: [string, Handler][] = [
  ["history_undo", async () => {
    const success = await browserManager.evaluate(() => {
      const cmd = (window as any).__opencut.command;
      if (!cmd.canUndo()) return false;
      cmd.undo();
      return true;
    });
    return { success };
  }],

  ["history_redo", async () => {
    const success = await browserManager.evaluate(() => {
      const cmd = (window as any).__opencut.command;
      if (!cmd.canRedo()) return false;
      cmd.redo();
      return true;
    });
    return { success };
  }],

  ["history_can_undo", async () => {
    const canUndo = await browserManager.evaluate(() => (window as any).__opencut.command.canUndo());
    return { canUndo };
  }],

  ["history_can_redo", async () => {
    const canRedo = await browserManager.evaluate(() => (window as any).__opencut.command.canRedo());
    return { canRedo };
  }],
];
