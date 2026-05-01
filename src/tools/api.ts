import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const apiTools: Tool[] = [
  {
    name: "api_health_check",
    description: "Check if the OpenCut server is running and healthy",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "api_sounds_search",
    description: "Search for sounds using the OpenCut Freesound API proxy",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query (max 500 chars)" },
        type: { type: "string", enum: ["songs", "effects"], description: "Sound type (default: effects)" },
        page: { type: "number", description: "Page number 1-1000 (default: 1)" },
        page_size: { type: "number", description: "Results per page 1-150 (default: 20)" },
        sort: { type: "string", enum: ["downloads", "rating", "created", "score"], description: "Sort order" },
        min_rating: { type: "number", description: "Minimum rating 0-5 (default: 3)" },
        commercial_only: { type: "boolean", description: "Only commercial-use sounds (default: true)" },
      },
      required: ["q"],
    },
  },
  {
    name: "api_sounds_search_next_page",
    description: "Get the next page of sound search results",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string" },
        type: { type: "string", enum: ["songs", "effects"] },
        page: { type: "number", description: "Page number to fetch" },
        page_size: { type: "number" },
        sort: { type: "string", enum: ["downloads", "rating", "created", "score"] },
        min_rating: { type: "number" },
        commercial_only: { type: "boolean" },
      },
      required: ["q", "page"],
    },
  },
];

export const apiHandlers: [string, Handler][] = [
  ["api_health_check", async () => {
    const res = await browserManager.fetchApi("/api/health");
    const text = await res.text();
    return { healthy: res.ok, status: res.status, message: text };
  }],

  ["api_sounds_search", async (args) => {
    const schema = z.object({
      q: z.string().max(500),
      type: z.enum(["songs", "effects"]).optional(),
      page: z.number().min(1).max(1000).optional(),
      page_size: z.number().min(1).max(150).optional(),
      sort: z.enum(["downloads", "rating", "created", "score"]).optional(),
      min_rating: z.number().min(0).max(5).optional(),
      commercial_only: z.boolean().optional(),
    });
    const params = schema.parse(args);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const res = await browserManager.fetchApi(`/api/sounds/search?${qs}`);
    if (!res.ok) {
      const err = await res.text();
      return { success: false, status: res.status, error: err };
    }
    const data = await res.json();
    return { success: true, ...data };
  }],

  ["api_sounds_search_next_page", async (args) => {
    const schema = z.object({
      q: z.string(),
      type: z.enum(["songs", "effects"]).optional(),
      page: z.number(),
      page_size: z.number().optional(),
      sort: z.enum(["downloads", "rating", "created", "score"]).optional(),
      min_rating: z.number().optional(),
      commercial_only: z.boolean().optional(),
    });
    const params = schema.parse(args);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.set(k, String(v));
    }
    const res = await browserManager.fetchApi(`/api/sounds/search?${qs}`);
    const data = await res.json();
    return { success: res.ok, ...data };
  }],
];
