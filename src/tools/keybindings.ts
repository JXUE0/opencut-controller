import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const keybindingsTools: Tool[] = [
  {
    name: "keybinding_get_all",
    description: "Get all keybinding configurations",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "keybinding_update",
    description: "Update a keybinding for a specific key combination",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Key combination (e.g. 'ctrl+z', 'space')" },
        action: { type: "string", description: "Action name (e.g. 'toggle-play', 'undo')" },
      },
      required: ["key", "action"],
    },
  },
  {
    name: "keybinding_remove",
    description: "Remove a keybinding for a specific key",
    inputSchema: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"],
    },
  },
  {
    name: "keybinding_reset_defaults",
    description: "Reset all keybindings to their defaults",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "keybinding_import",
    description: "Import a keybinding configuration",
    inputSchema: {
      type: "object",
      properties: { config: { type: "object", description: "Keybinding config object" } },
      required: ["config"],
    },
  },
  {
    name: "keybinding_export",
    description: "Export the current keybinding configuration",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "keybinding_enable",
    description: "Enable keybindings",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "keybinding_disable",
    description: "Disable keybindings",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const keybindingsHandlers: [string, Handler][] = [
  ["keybinding_get_all", async () => {
    const keybindings = await browserManager.evaluate(() => {
      return (window as any).__stores?.keybindings?.getState()?.keybindings;
    });
    return { keybindings };
  }],

  ["keybinding_update", async (args) => {
    const { key, action } = z.object({ key: z.string(), action: z.string() }).parse(args);
    await browserManager.evaluateWithArg(({ key, action }: any) => {
      (window as any).__stores?.keybindings?.getState()?.updateKeybinding(key, action);
    }, { key, action });
    return { success: true };
  }],

  ["keybinding_remove", async (args) => {
    const { key } = z.object({ key: z.string() }).parse(args);
    await browserManager.evaluateWithArg((k: string) => {
      (window as any).__stores?.keybindings?.getState()?.removeKeybinding(k);
    }, key);
    return { success: true };
  }],

  ["keybinding_reset_defaults", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.keybindings?.getState()?.resetToDefaults();
    });
    return { success: true };
  }],

  ["keybinding_import", async (args) => {
    const { config } = z.object({ config: z.record(z.string(), z.unknown()) }).parse(args);
    await browserManager.evaluateWithArg((cfg: any) => {
      (window as any).__stores?.keybindings?.getState()?.importKeybindings(cfg);
    }, config);
    return { success: true };
  }],

  ["keybinding_export", async () => {
    const config = await browserManager.evaluate(() => {
      return (window as any).__stores?.keybindings?.getState()?.exportKeybindings();
    });
    return { config };
  }],

  ["keybinding_enable", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.keybindings?.getState()?.enableKeybindings();
    });
    return { success: true };
  }],

  ["keybinding_disable", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.keybindings?.getState()?.disableKeybindings();
    });
    return { success: true };
  }],
];
