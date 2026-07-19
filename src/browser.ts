import { chromium, type Browser, type BrowserContext, type Page, type BrowserServer } from "playwright";

export type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const EDITOR_BASE = process.env.OPENCUT_URL ?? "http://localhost:3001";
const READY_TIMEOUT_MS = 30_000;
const READY_POLL_MS = 200;

class BrowserManager {
  private server: BrowserServer | null = null;
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
      ...(executablePath ? { executablePath } : {}),
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (process.platform === "win32") {
      this.server = await chromium.launchServer(launchOpts);
      this.browser = await chromium.connect(this.server.wsEndpoint());
    } else {
      this.browser = await chromium.launch(launchOpts);
    }

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
    await this.server?.close();
    this.browser = null;
    this.server = null;
    this.context = null;
    this.page = null;
    this.currentProjectId = null;
  }
}

export const browserManager = new BrowserManager();
