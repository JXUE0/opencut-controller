import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type FrameRate = { numerator: number; denominator: number };

/** OpenCut stores fps as a rational FrameRate struct; a bare number corrupts the project (issue #1). */
export function toFrameRate(fps: number): FrameRate {
  if (!(fps > 0 && fps <= 240)) throw new Error(`Invalid fps: ${fps}`);
  if (Number.isInteger(fps)) return { numerator: fps, denominator: 1 };
  for (const base of [24, 30, 60]) {
    if (Math.abs(fps - (base * 1000) / 1001) < 0.01) return { numerator: base * 1000, denominator: 1001 };
  }
  return { numerator: Math.round(fps * 1000), denominator: 1000 };
}

/** OpenCut's MediaTime unit (rust/crates/time: TICKS_PER_SECOND = 120_000) */
export const TICKS_PER_SECOND = 120_000;

export function secondsToTicks(seconds: number): number {
  return Math.round(seconds * TICKS_PER_SECOND);
}

export function ticksToSeconds(ticks: number): number {
  return ticks / TICKS_PER_SECOND;
}

// Element fields OpenCut stores as MediaTime; the MCP API speaks seconds
const TIME_KEYS = ["startTime", "duration", "trimStart", "trimEnd", "sourceDuration"] as const;

function convertTimes<T extends Record<string, unknown>>(obj: T, fn: (n: number) => number): T {
  const out: Record<string, unknown> = { ...obj };
  for (const key of TIME_KEYS) {
    if (typeof out[key] === "number") out[key] = fn(out[key] as number);
  }
  return out as T;
}

export const timesToTicks = <T extends Record<string, unknown>>(obj: T) => convertTimes(obj, secondsToTicks);
export const timesToSeconds = <T extends Record<string, unknown>>(obj: T) => convertTimes(obj, ticksToSeconds);

const VISUAL_DEFAULTS = {
  hidden: false,
  transform: { scaleX: 1, scaleY: 1, position: { x: 0, y: 0 }, rotate: 0 },
  opacity: 1,
  blendMode: "normal",
};

/** Mirrors OpenCut's visual element defaults (timeline/defaults.ts); times in ticks */
export function visualDefaults(position?: { x?: number; y?: number }, scale = 1) {
  return {
    ...VISUAL_DEFAULTS,
    transform: { ...VISUAL_DEFAULTS.transform, scaleX: scale, scaleY: scale, position: { x: position?.x ?? 0, y: position?.y ?? 0 } },
  };
}

/** Mirrors OpenCut's buildTextElement(); startTime/duration in seconds */
export function buildTextElement(p: {
  content: string; startTime: number; duration: number; fontSize?: number; fontFamily?: string; color?: string;
  textAlign?: string; fontWeight?: string; fontStyle?: string; x?: number; y?: number; background?: boolean;
}) {
  const { hidden: _unused, ...visual } = visualDefaults({ x: p.x, y: p.y });
  return {
    type: "text",
    name: p.content.substring(0, 20),
    content: p.content,
    startTime: secondsToTicks(p.startTime),
    duration: secondsToTicks(p.duration),
    trimStart: 0,
    trimEnd: 0,
    fontSize: p.fontSize ?? 15,
    fontFamily: p.fontFamily ?? "Arial",
    color: p.color ?? "#ffffff",
    background: { enabled: p.background ?? false, color: "#000000", cornerRadius: 0, paddingX: 30, paddingY: 42, offsetX: 0, offsetY: 0 },
    textAlign: p.textAlign ?? "center",
    fontWeight: p.fontWeight ?? "normal",
    fontStyle: p.fontStyle ?? "normal",
    textDecoration: "none",
    letterSpacing: 0,
    lineHeight: 1.2,
    ...visual,
  };
}

const EDITOR_BASE = process.env.OPENCUT_URL ?? "http://localhost:3001";
const READY_TIMEOUT_MS = 30_000;
const READY_POLL_MS = 200;

class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private currentProjectId: string | null = null;
  private launchPromise: Promise<void> | null = null;
  private navLock: Promise<unknown> = Promise.resolve();

  launch(): Promise<void> {
    if (!this.launchPromise) {
      this.launchPromise = this._launch();
    }
    return this.launchPromise;
  }

  private async _launch(): Promise<void> {
    const executablePath = process.env.CHROMIUM_PATH ?? undefined;
    const headless = process.env.MCP_HEADLESS !== "false";
    const launchOpts = {
      headless,
      // channel "chromium" = new headless; the default headless-shell crashes when OpenCut renders
      ...(executablePath ? { executablePath } : { channel: "chromium" }),
      // Hardware H.264 encoding (Media Foundation on Windows) stalls OpenCut's mp4 export forever
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-accelerated-video-encode"],
    };

    this.browser = await chromium.launch(launchOpts);

    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
    await this.page.goto(EDITOR_BASE);
  }

  private async ensureReady(): Promise<void> {
    if (!this.launchPromise) throw new Error("Browser not launched — call browserManager.launch() first");
    await this.launchPromise;
  }

  /** Serialize all navigations to avoid race conditions */
  private async withNavLock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.navLock;
    this.navLock = (async () => {
      await prev;
      return fn();
    })();
    return this.navLock as Promise<T>;
  }

  async navigateToEditor(projectId: string): Promise<void> {
    return this.withNavLock(async () => {
      await this.ensureReady();
      if (this.currentProjectId === projectId) {
        const ready = await this.isEditorReady();
        if (ready) return;
      }
      await this.page!.goto(`${EDITOR_BASE}/editor/${projectId}`);
      await this.waitForEditorReady();
      this.currentProjectId = projectId;
    });
  }

  async navigateToHome(): Promise<void> {
    return this.withNavLock(async () => {
      await this.ensureReady();
      await this.page!.goto(`${EDITOR_BASE}/projects`);
      this.currentProjectId = null;
    });
  }

  async navigateToNewProject(): Promise<string> {
    return this.withNavLock(async () => {
      await this.ensureReady();
      const placeholder = `new-${Date.now()}`;
      await this.page!.goto(`${EDITOR_BASE}/editor/${placeholder}`);
      await this.waitForEditorReady();
      const id: string = await this.page!.evaluate(() => {
        return (window as any).__opencut.project.getActive().metadata.id;
      });
      this.currentProjectId = id;
      return id;
    });
  }

  private async isEditorReady(): Promise<boolean> {
    if (!this.page) return false;
    return this.page.evaluate(() => {
      const w = window as any;
      return !!(w.__opencut && w.__opencut.project.getActiveOrNull());
    });
  }

  private async waitForEditorReady(): Promise<void> {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const ready = await this.isEditorReady();
      if (ready) return;
      await new Promise((r) => setTimeout(r, READY_POLL_MS));
    }
    throw new Error(`Editor not ready after ${READY_TIMEOUT_MS}ms`);
  }

  /** Safe evaluate with error handling — never throws */
  async safeEvaluate<T>(fn: () => T): Promise<SafeResult<T>> {
    try {
      await this.ensureReady();
      const data = await this.page!.evaluate(fn);
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }

  /** Safe evaluate with argument — never throws */
  async safeEvaluateWithArg<T>(fn: (arg: any) => T, arg: any): Promise<SafeResult<T>> {
    try {
      await this.ensureReady();
      const data = await this.page!.evaluate(fn, arg);
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }

  /** Safe async evaluate with argument — never throws */
  async safeEvaluateAsyncWithArg<T>(fn: (arg: any) => Promise<T>, arg: any): Promise<SafeResult<T>> {
    try {
      await this.ensureReady();
      const data = await this.page!.evaluate(fn, arg);
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }

  /** Legacy evaluate (throws on error) — kept for backward compatibility */
  async evaluate<T>(fn: () => T): Promise<T> {
    const result = await this.safeEvaluate(fn);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /** Legacy evaluateWithArg (throws on error) */
  async evaluateWithArg(fn: (arg: any) => any, arg: any): Promise<any> {
    const result = await this.safeEvaluateWithArg(fn, arg);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /** Legacy evaluateAsyncWithArg (throws on error) */
  async evaluateAsyncWithArg(fn: (arg: any) => Promise<any>, arg: any): Promise<any> {
    const result = await this.safeEvaluateAsyncWithArg(fn, arg);
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  /**
   * Inserts an element (times already in ticks) and returns where it landed.
   * OpenCut generates the element id itself, so it is found by diffing the scene's tracks.
   */
  async insertElement(element: Record<string, unknown>, trackId?: string): Promise<{ trackId: string; elementId: string } | null> {
    return this.evaluateWithArg(({ element, trackId }: any) => {
      const editor = (window as any).__opencut;
      const all = () => {
        const t = editor.scenes.getActiveScene().tracks;
        return [t.main, ...t.overlay, ...t.audio].flatMap((tr: any) => tr.elements.map((e: any) => ({ trackId: tr.id, elementId: e.id })));
      };
      const before = new Set(all().map((x: any) => x.elementId));
      editor.timeline.insertElement({ element, placement: trackId ? { mode: "explicit", trackId } : { mode: "auto" } });
      return all().find((x: any) => !before.has(x.elementId)) ?? null;
    }, { element, trackId });
  }

  /** Direct HTTP API call (no browser context needed) */
  async fetchApi(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${EDITOR_BASE}${path}`, init);
  }

  async getPage(): Promise<Page> {
    await this.ensureReady();
    return this.page!;
  }

  getBase(): string {
    return EDITOR_BASE;
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = null;
    this.launchPromise = null;
    this.context = null;
    this.page = null;
    this.currentProjectId = null;
  }
}

export const browserManager = new BrowserManager();
