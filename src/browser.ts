import { chromium, type Browser, type BrowserContext, type Page, type BrowserServer } from "playwright";

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
      // On Windows/Git Bash, use launchServer() + connect() over WebSocket (TCP)
      // to avoid --remote-debugging-pipe failures in Bun.
      this.server = await chromium.launchServer(launchOpts);
      this.browser = await chromium.connect(this.server.wsEndpoint());
    } else {
      // On Linux (Docker/CI), launch() directly works fine.
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

  async navigateToEditor(projectId: string): Promise<void> {
    await this.ensureReady();
    if (this.currentProjectId === projectId) {
      const ready = await this.isEditorReady();
      if (ready) return;
    }
    await this.page!.goto(`${EDITOR_BASE}/editor/${projectId}`);
    await this.waitForEditorReady();
    this.currentProjectId = projectId;
  }

  async navigateToHome(): Promise<void> {
    await this.ensureReady();
    await this.page!.goto(`${EDITOR_BASE}/projects`);
    this.currentProjectId = null;
  }

  /**
   * Navigate to the editor without a project ID.
   * The editor-provider will create a new project and redirect to its ID.
   * Returns the actual project ID after the editor is ready.
   */
  async navigateToNewProject(): Promise<string> {
    await this.ensureReady();
    // Use a random placeholder — editor-provider sees "not found" and creates a new project
    const placeholder = `new-${Date.now()}`;
    await this.page!.goto(`${EDITOR_BASE}/editor/${placeholder}`);
    await this.waitForEditorReady();
    const id: string = await this.page!.evaluate(() => {
      return (window as any).__opencut.project.getActive().metadata.id;
    });
    this.currentProjectId = id;
    return id;
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

  /** Zero-argument evaluate — fn cannot capture outer variables */
  async evaluate<T>(fn: () => T): Promise<T> {
    await this.ensureReady();
    return this.page!.evaluate(fn);
  }

  /** Evaluate with a single serializable argument */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateWithArg(fn: (arg: any) => any, arg: any): Promise<any> {
    await this.ensureReady();
    return this.page!.evaluate(fn, arg);
  }

  /** Evaluate with a single serializable argument (async fn) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async evaluateAsyncWithArg(fn: (arg: any) => Promise<any>, arg: any): Promise<any> {
    await this.ensureReady();
    return this.page!.evaluate(fn, arg);
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
