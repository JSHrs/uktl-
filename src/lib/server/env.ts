// Cloudflare bindings accessor. Returns null when bindings are unavailable
// (e.g. Lovable preview without D1 wired) so the app can fall back to mock data.

export type AppEnv = {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  JWT_SECRET?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_EMAIL?: string;
  FROM_EMAIL?: string;
  CLAUDE_MODEL?: string;
};

let cached: AppEnv | null | undefined;

export async function tryGetEnv(): Promise<AppEnv | null> {
  if (cached !== undefined) return cached;
  try {
    const mod = (await import("cloudflare:workers")) as unknown as {
      env: AppEnv;
    };
    cached = mod.env ?? null;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export async function requireEnv(): Promise<AppEnv> {
  const env = await tryGetEnv();
  if (!env) {
    throw new Error(
      "Cloudflare bindings unavailable. This action requires the deployed runtime.",
    );
  }
  return env;
}

declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec<T = unknown>(query: string): Promise<D1ExecResult>;
  }
  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown[]>(): Promise<T[]>;
  }
  interface D1Result<T = unknown> {
    results?: T[];
    success: boolean;
    meta?: Record<string, unknown>;
  }
  interface D1ExecResult {
    count: number;
    duration: number;
  }
}
