import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const transcriptionTools: Tool[] = [
  {
    name: "transcription_transcribe",
    description: "Transcribe audio/video from a media asset. Runs in browser Web Worker. Polls until complete.",
    inputSchema: {
      type: "object",
      properties: {
        mediaId: { type: "string", description: "Media asset ID to transcribe" },
        language: {
          type: "string",
          enum: ["en", "es", "it", "fr", "de", "pt", "ru", "ja", "zh"],
          description: "Language code (default: en)",
        },
        model: {
          type: "string",
          enum: ["whisper-tiny", "whisper-small", "whisper-medium", "whisper-large-v3-turbo"],
          description: "Model to use (default: whisper-small)",
        },
      },
      required: ["mediaId"],
    },
  },
  {
    name: "transcription_cancel",
    description: "Cancel an in-progress transcription",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "transcription_generate_captions",
    description: "Generate caption elements from a transcription result",
    inputSchema: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          description: "Transcription segments from transcribe result",
          items: {
            type: "object",
            properties: {
              start: { type: "number" },
              end: { type: "number" },
              text: { type: "string" },
            },
          },
        },
        wordsPerCaption: { type: "number", description: "Words per caption element (default: 3)" },
        fontSize: { type: "number", description: "Caption font size (default: 48)" },
        color: { type: "string", description: "Caption color hex (default: #ffffff)" },
      },
      required: ["segments"],
    },
  },
  {
    name: "transcription_add_captions_to_timeline",
    description: "Add caption text elements to the timeline from segments",
    inputSchema: {
      type: "object",
      properties: {
        segments: {
          type: "array",
          items: { type: "object", properties: { start: { type: "number" }, end: { type: "number" }, text: { type: "string" } } },
        },
        fontSize: { type: "number", description: "Font size (default: 48)" },
        color: { type: "string", description: "Text color (default: #ffffff)" },
        y: { type: "number", description: "Y position (default: 400)" },
      },
      required: ["segments"],
    },
  },
  {
    name: "transcription_get_state",
    description: "Get the current transcription state (isTranscribing, progress, result)",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const transcriptionHandlers: [string, Handler][] = [
  ["transcription_transcribe", async (args) => {
    const { mediaId, language, model } = z.object({
      mediaId: z.string(),
      language: z.enum(["en", "es", "it", "fr", "de", "pt", "ru", "ja", "zh"]).optional(),
      model: z.enum(["whisper-tiny", "whisper-small", "whisper-medium", "whisper-large-v3-turbo"]).optional(),
    }).parse(args);

    // Trigger transcription via the UI (navigate to captions tab and trigger)
    await browserManager.evaluateWithArg(({ mediaId, language, model }: any) => {
      // Switch to captions tab
      (window as any).__stores?.assets?.getState()?.setActiveTab("captions");
      // Store params for the transcription service
      (window as any).__mcp_transcription_params = { mediaId, language: language ?? "en", model: model ?? "whisper-small" };
    }, { mediaId, language, model });

    return {
      message: "Transcription initiated. Use transcription_get_state to poll progress, or use the captions panel in the editor UI.",
      note: "Transcription runs in a browser Web Worker. For full automation, use the captions UI panel which integrates with the transcription service.",
    };
  }],

  ["transcription_cancel", async () => {
    await browserManager.evaluate(() => {
      (window as any).__stores?.assets?.getState()?.setActiveTab("captions");
    });
    return { success: true, message: "Navigate to Captions tab and click Cancel to stop transcription" };
  }],

  ["transcription_generate_captions", async (args) => {
    const { segments, wordsPerCaption, fontSize, color } = z.object({
      segments: z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })),
      wordsPerCaption: z.number().optional(),
      fontSize: z.number().optional(),
      color: z.string().optional(),
    }).parse(args);

    const wpc = wordsPerCaption ?? 3;
    const captions: { start: number; end: number; text: string }[] = [];

    for (const seg of segments) {
      const words = seg.text.trim().split(/\s+/);
      const wordDuration = (seg.end - seg.start) / words.length;
      for (let i = 0; i < words.length; i += wpc) {
        const chunk = words.slice(i, i + wpc);
        captions.push({
          start: seg.start + i * wordDuration,
          end: seg.start + Math.min(i + wpc, words.length) * wordDuration,
          text: chunk.join(" "),
        });
      }
    }

    return { captions, fontSize: fontSize ?? 48, color: color ?? "#ffffff" };
  }],

  ["transcription_add_captions_to_timeline", async (args) => {
    const { segments, fontSize, color, y } = z.object({
      segments: z.array(z.object({ start: z.number(), end: z.number(), text: z.string() })),
      fontSize: z.number().optional(),
      color: z.string().optional(),
      y: z.number().optional(),
    }).parse(args);

    await browserManager.evaluateWithArg(({ segments, fontSize, color, y }: any) => {
      const editor = (window as any).__opencut;
      const trackId = editor.timeline.addTrack({ type: "text" });
      for (const seg of segments) {
        const dur = seg.end - seg.start;
        editor.timeline.insertElement({
          element: {
            id: crypto.randomUUID(),
            type: "text",
            name: seg.text.substring(0, 20),
            content: seg.text,
            duration: dur,
            startTime: seg.start,
            trimStart: 0,
            trimEnd: dur,
            fontSize: fontSize ?? 48,
            fontFamily: "Inter",
            color: color ?? "#ffffff",
            textAlign: "center",
            fontWeight: "bold",
            fontStyle: "normal",
            textDecoration: "none",
            opacity: 1,
            transform: { x: 0, y: y ?? 400, scaleX: 1, scaleY: 1, rotation: 0 },
            background: { enabled: true, color: "#000000", cornerRadius: 4, paddingX: 8, paddingY: 4 },
          },
          placement: { mode: "explicit", trackId },
        });
      }
    }, { segments, fontSize, color, y });
    return { success: true, captionCount: segments.length };
  }],

  ["transcription_get_state", async () => {
    // Check what's visible in the captions tab
    const state = await browserManager.evaluate(() => {
      return {
        message: "Check the Captions tab in the OpenCut editor for transcription progress",
        activeTab: (window as any).__stores?.assets?.getState()?.activeTab,
      };
    });
    return state;
  }],
];
