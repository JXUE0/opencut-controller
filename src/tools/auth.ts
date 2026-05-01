import { z } from "zod";
import { browserManager } from "../browser.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

export const authTools: Tool[] = [
  {
    name: "auth_sign_up",
    description: "Create a new user account",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "User email" },
        password: { type: "string", description: "User password" },
        name: { type: "string", description: "Display name" },
      },
      required: ["email", "password", "name"],
    },
  },
  {
    name: "auth_sign_in",
    description: "Sign in to an existing account",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string" },
        password: { type: "string" },
      },
      required: ["email", "password"],
    },
  },
  {
    name: "auth_sign_out",
    description: "Sign out of the current account",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "auth_get_session",
    description: "Get the current authenticated session",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "auth_get_profile",
    description: "Get the current user's profile",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "auth_check_logged_in",
    description: "Check if a user is currently logged in",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

export const authHandlers: [string, Handler][] = [
  ["auth_sign_up", async (args) => {
    const { email, password, name } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string(),
    }).parse(args);
    const res = await browserManager.fetchApi("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    return { success: res.ok, status: res.status, data };
  }],

  ["auth_sign_in", async (args) => {
    const { email, password } = z.object({ email: z.string(), password: z.string() }).parse(args);
    const res = await browserManager.fetchApi("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return { success: res.ok, status: res.status, data };
  }],

  ["auth_sign_out", async () => {
    const res = await browserManager.fetchApi("/api/auth/sign-out", { method: "POST" });
    return { success: res.ok, status: res.status };
  }],

  ["auth_get_session", async () => {
    const res = await browserManager.fetchApi("/api/auth/get-session");
    const data = await res.json();
    return { session: data };
  }],

  ["auth_get_profile", async () => {
    const session = await browserManager.evaluate(() => {
      // Check browser session state
      return (window as any).__betterAuth?.session ?? null;
    });
    return { profile: session };
  }],

  ["auth_check_logged_in", async () => {
    const res = await browserManager.fetchApi("/api/auth/get-session");
    const data = await res.json();
    return { loggedIn: !!(data?.user), user: data?.user ?? null };
  }],
];
