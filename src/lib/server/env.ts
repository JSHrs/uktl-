// Access Cloudflare bindings at runtime.
// `cloudflare:workers` is only resolvable inside the Workers runtime, so we
// dynamic-import it. Non-Workers environments will throw a clear error.

export type AppEnv = {
  DB: D1Database;
  CV_BUCKET: R2Bucket;
  AI: Ai;
  PARSE_PROVIDER?: string;
  PARSE_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  // Admin auth — set via: wrangler secret put ADMIN_PASSWORD_HASH / JWT_SECRET
  ADMIN_PASSWORD_HASH?: string;
  JWT_SECRET?: string;
  // Supabase — set SUPABASE_URL + SUPABASE_ANON_KEY as wrangler vars,
  //            SUPABASE_SERVICE_ROLE_KEY as wrangler secret
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  // Reed.co.uk job board API key
  REED_API_KEY?: string;
  // Resend API key for transactional email
  RESEND_API_KEY?: string;
  // Calendly embed URL (set by client)
  CALENDLY_URL?: string;
  // Public origin of this deployment; used to build Supabase email redirect URLs
  SITE_URL?: string;
};

let cached: AppEnv | null = null;

export async function getEnv(): Promise<AppEnv> {
  if (cached) return cached;
  try {
    const mod = (await import("cloudflare:workers")) as unknown as {
      env: AppEnv;
    };
    cached = mod.env;
    return cached;
  } catch (err) {
    throw new Error(
      "Cloudflare bindings unavailable — run under wrangler/vite-cloudflare. " +
        String(err),
    );
  }
}

// D1 types shim — avoids needing @cloudflare/workers-types as a dep for
// consumers that only build the worker via wrangler.
declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(
      statements: D1PreparedStatement[],
    ): Promise<D1Result<T>[]>;
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
  interface R2Bucket {
    put(
      key: string,
      value: ArrayBuffer | ReadableStream | string,
      options?: { httpMetadata?: { contentType?: string } },
    ): Promise<unknown>;
    get(key: string): Promise<R2ObjectBody | null>;
    delete(key: string): Promise<void>;
  }
  interface R2ObjectBody {
    body: ReadableStream;
    size: number;
    httpMetadata?: { contentType?: string };
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
  }
  interface Ai {
    run(model: string, input: unknown): Promise<unknown>;
  }
}
