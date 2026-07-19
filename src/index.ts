#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { browserManager } from "./browser.js";

import { projectTools, projectHandlers } from "./tools/project.js";
import { scenesTools, scenesHandlers } from "./tools/scenes.js";
import { playbackTools, playbackHandlers } from "./tools/playback.js";
import { timelineTracksTools, timelineTracksHandlers } from "./tools/timeline-tracks.js";
import { timelineElementsTools, timelineElementsHandlers } from "./tools/timeline-elements.js";
import { timelineEffectsTools, timelineEffectsHandlers } from "./tools/timeline-effects.js";
import { keyframesTools, keyframesHandlers } from "./tools/keyframes.js";
import { selectionTools, selectionHandlers } from "./tools/selection.js";
import { clipboardTools, clipboardHandlers } from "./tools/clipboard.js";
import { historyTools, historyHandlers } from "./tools/history.js";
import { mediaTools, mediaHandlers } from "./tools/media.js";
import { textTools, textHandlers } from "./tools/text.js";
import { audioTools, audioHandlers } from "./tools/audio.js";
import { stickersTools, stickersHandlers } from "./tools/stickers.js";
import { transcriptionTools, transcriptionHandlers } from "./tools/transcription.js";
import { exportTools, exportHandlers } from "./tools/export.js";
import { bookmarksTools, bookmarksHandlers } from "./tools/bookmarks.js";
import { canvasTools, canvasHandlers } from "./tools/canvas.js";
import { panelsTools, panelsHandlers } from "./tools/panels.js";
import { keybindingsTools, keybindingsHandlers } from "./tools/keybindings.js";
import { timelineSettingsTools, timelineSettingsHandlers } from "./tools/timeline-settings.js";
import { storageTools, storageHandlers } from "./tools/storage.js";
import { authTools, authHandlers } from "./tools/auth.js";
import { apiTools, apiHandlers } from "./tools/api.js";

const allTools = [
  ...projectTools,
  ...scenesTools,
  ...playbackTools,
  ...timelineTracksTools,
  ...timelineElementsTools,
  ...timelineEffectsTools,
  ...keyframesTools,
  ...selectionTools,
  ...clipboardTools,
  ...historyTools,
  ...mediaTools,
  ...textTools,
  ...audioTools,
  ...stickersTools,
  ...transcriptionTools,
  ...exportTools,
  ...bookmarksTools,
  ...canvasTools,
  ...panelsTools,
  ...keybindingsTools,
  ...timelineSettingsTools,
  ...storageTools,
  ...authTools,
  ...apiTools,
];

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

const allHandlers = new Map<string, Handler>([
  ...projectHandlers,
  ...scenesHandlers,
  ...playbackHandlers,
  ...timelineTracksHandlers,
  ...timelineElementsHandlers,
  ...timelineEffectsHandlers,
  ...keyframesHandlers,
  ...selectionHandlers,
  ...clipboardHandlers,
  ...historyHandlers,
  ...mediaHandlers,
  ...textHandlers,
  ...audioHandlers,
  ...stickersHandlers,
  ...transcriptionHandlers,
  ...exportHandlers,
  ...bookmarksHandlers,
  ...canvasHandlers,
  ...panelsHandlers,
  ...keybindingsHandlers,
  ...timelineSettingsHandlers,
  ...storageHandlers,
  ...authHandlers,
  ...apiHandlers,
]);

const RESOURCES = [
  {
    uri: "opencut://projects",
    name: "OpenCut Projects List",
    mimeType: "application/json",
    description: "List of all OpenCut projects",
  },
  {
    uri: "opencut://editor/state",
    name: "Current Editor State",
    mimeType: "application/json",
    description: "Current state of the OpenCut editor (active project, scene, timeline)",
  },
  {
    uri: "opencut://timeline/tracks",
    name: "Timeline Tracks",
    mimeType: "application/json",
    description: "List of tracks in the current scene",
  },
];

const PROMPTS = [
  {
    name: "create_intro_video",
    description: "Create a 10-second intro video with text overlay",
    arguments: [
      { name: "text", description: "Text to display", required: true },
      { name: "duration", description: "Duration in seconds", required: false },
    ],
  },
  {
    name: "add_background_music",
    description: "Search and add background music to the timeline",
    arguments: [
      { name: "query", description: "Search query for music", required: true },
      { name: "duration", description: "Duration to trim (seconds)", required: false },
    ],
  },
  {
    name: "apply_transition",
    description: "Apply a transition effect between two clips",
    arguments: [
      { name: "effect", description: "Effect name (fade, dissolve, etc.)", required: true },
      { name: "duration", description: "Transition duration in seconds", required: false },
    ],
  },
];

async function getResourceContent(uri: string): Promise<string> {
  await browserManager.launch();
  if (uri === "opencut://projects") {
    const result = await browserManager.safeEvaluate(() => {
      const store = (window as any).__stores?.project?.getState?.();
      return store?.projects ?? [];
    });
    return JSON.stringify(result.ok ? result.data : [], null, 2);
  } else if (uri === "opencut://editor/state") {
    const result = await browserManager.safeEvaluate(() => {
      const projectStore = (window as any).__stores?.project?.getState?.();
      const timelineStore = (window as any).__stores?.timeline?.getState?.();
      return {
        activeProject: projectStore?.activeProjectId,
        currentScene: timelineStore?.currentSceneId,
        isPlaying: timelineStore?.isPlaying,
        currentTime: timelineStore?.currentTime,
      };
    });
    return JSON.stringify(result.ok ? result.data : {}, null, 2);
  } else if (uri === "opencut://timeline/tracks") {
    const result = await browserManager.safeEvaluate(() => {
      const store = (window as any).__stores?.timeline?.getState?.();
      return store?.tracks ?? [];
    });
    return JSON.stringify(result.ok ? result.data : [], null, 2);
  }
  throw new Error(`Unknown resource: ${uri}`);
}

function getPromptContent(name: string, args: Record<string, unknown>): string {
  if (name === "create_intro_video") {
    const text = (args.text as string) ?? "Welcome";
    const duration = (args.duration as number) ?? 10;
    return `Create a new OpenCut project and add a text element with "${text}" that lasts ${duration} seconds. Set the text font size to 48, center it on screen, and add a fade-in effect.`;
  } else if (name === "add_background_music") {
    const query = (args.query as string) ?? "upbeat";
    const duration = (args.duration as number) ?? 30;
    return `Search for background music with query "${query}" using audio_sound_search. Pick the first result and add it to the timeline using audio_sound_add_to_timeline. Trim it to ${duration} seconds if needed.`;
  } else if (name === "apply_transition") {
    const effect = (args.effect as string) ?? "fade";
    const duration = (args.duration as number) ?? 1;
    return `Apply a "${effect}" transition effect between the last two elements on the timeline. Use timeline_effect_add to add the effect with duration ${duration} seconds.`;
  }
  throw new Error(`Unknown prompt: ${name}`);
}

function createAuthMiddleware(): (req: IncomingMessage, res: ServerResponse) => boolean {
  const expectedToken = process.env.MCP_AUTH_TOKEN;
  if (!expectedToken) {
    console.warn("[opencut-controller] MCP_AUTH_TOKEN not set — HTTP transport has no authentication!");
    return () => true;
  }
  return (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing or invalid Authorization header" }));
      return false;
    }
    const token = auth.slice(7);
    if (token !== expectedToken) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid token" }));
      return false;
    }
    return true;
  };
}

function createHealthHandler() {
  return async (_req: IncomingMessage, res: ServerResponse) => {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      timestamp: new Date().toISOString(),
      transport: process.env.TRANSPORT_TYPE ?? "stdio",
      browser: "connected",
    }));
  };
}

async function main() {
  console.error(`[opencut-controller] Starting server with ${allTools.length} tools`);

  browserManager.launch().then(() => {
    console.error("[opencut-controller] Browser ready");
  }).catch((err) => {
    console.error("[opencut-controller] Browser launch failed:", err);
  });

  const transportType = process.env.TRANSPORT_TYPE ?? "stdio";
  console.error(`[opencut-controller] Starting server with ${allTools.length} tools (transport: ${transportType})`);

  const server = new Server(
    { name: "opencut-controller", version: "0.1.0" },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = allHandlers.get(name);

    if (!handler) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await handler((args ?? {}) as Record<string, unknown>);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[opencut-controller] Tool error (${name}):`, message);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: RESOURCES,
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    try {
      const content = await getResourceContent(uri);
      return {
        contents: [{ uri, mimeType: "application/json", text: content }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to read resource ${uri}: ${message}`);
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPTS,
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    try {
      const promptText = getPromptContent(name, args);
      return {
        messages: [
          {
            role: "user" as const,
            content: { type: "text" as const, text: promptText },
          },
        ],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to get prompt ${name}: ${message}`);
    }
  });

  if (transportType === "http") {
    const port = parseInt(process.env.PORT ?? "3002", 10);
    const authMiddleware = createAuthMiddleware();
    const healthHandler = createHealthHandler();

    function createRequestServer() {
      const requestServer = new Server(
        { name: "opencut-controller", version: "0.1.0" },
        {
          capabilities: {
            tools: {},
            resources: {},
            prompts: {},
          },
        }
      );

      requestServer.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: allTools,
      }));

      requestServer.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const handler = allHandlers.get(name);

        if (!handler) {
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
        }

        try {
          const result = await handler((args ?? {}) as Record<string, unknown>);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[opencut-controller] Tool error (${name}):`, message);
          return {
            content: [{ type: "text", text: `Error: ${message}` }],
            isError: true,
          };
        }
      });

      requestServer.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: RESOURCES,
      }));

      requestServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        try {
          const content = await getResourceContent(uri);
          return {
            contents: [{ uri, mimeType: "application/json", text: content }],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to read resource ${uri}: ${message}`);
        }
      });

      requestServer.setRequestHandler(ListPromptsRequestSchema, async () => ({
        prompts: PROMPTS,
      }));

      requestServer.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const name = request.params.name;
        const args = (request.params.arguments ?? {}) as Record<string, unknown>;
        try {
          const promptText = getPromptContent(name, args);
          return {
            messages: [
              {
                role: "user" as const,
                content: { type: "text" as const, text: promptText },
              },
            ],
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Failed to get prompt ${name}: ${message}`);
        }
      });

      return requestServer;
    }

    const httpServer = createServer(async (req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Mcp-Session-Id, Authorization");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url === "/health" || req.url === "/healthz") {
        await healthHandler(req, res);
        return;
      }

      if (req.url === "/mcp" || req.url?.startsWith("/mcp")) {
        if (!authMiddleware(req, res)) return;

        const requestServer = createRequestServer();
        const httpTransport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });
        await requestServer.connect(httpTransport);
        await httpTransport.handleRequest(req, res);
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
    });

    httpServer.listen(port, () => {
      console.error(`[opencut-controller] HTTP transport listening on http://localhost:${port}/mcp`);
      console.error(`[opencut-controller] Health check: http://localhost:${port}/health`);
    });
  } else {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[opencut-controller] Connected via stdio");
  }

  process.on("SIGINT", async () => {
    console.error("[opencut-controller] Shutting down...");
    await browserManager.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await browserManager.close();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("[opencut-controller] Fatal error:", err);
  process.exit(1);
});
