// Runtime bindings accessor. In the hosted preview there are no production
// bindings, so we return a local in-memory mock instead of letting server
// functions crash.

export type AppEnv = {
  DB: D1Database;
  CV_BUCKET?: R2Bucket;
  R2?: R2Bucket;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  JWT_SECRET?: string;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_EMAIL?: string;
  FROM_EMAIL?: string;
  CLAUDE_MODEL?: string;
};

let cached: AppEnv | undefined;

export async function tryGetEnv(): Promise<AppEnv> {
  if (cached !== undefined) return cached;
  try {
    const specifier = "cloudflare:workers";
    const mod = (await import(/* @vite-ignore */ specifier)) as unknown as {
      env: AppEnv;
    };
    if (!mod.env?.DB) throw new Error("Runtime bindings unavailable");
    cached = mod.env;
    return cached;
  } catch {
    const { getMockEnv } = await import("./mockEnv");
    cached = getMockEnv();
    return cached;
  }
}

export async function requireEnv(): Promise<AppEnv> {
  return tryGetEnv();
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

  interface R2Bucket {
    put(
      key: string,
      value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream | null,
      options?: Record<string, unknown>,
    ): Promise<R2Object>;
    get(key: string): Promise<R2ObjectBody | null>;
    head(key: string): Promise<R2Object | null>;
    delete(keys: string | string[]): Promise<void>;
    list(options?: {
      prefix?: string;
      limit?: number;
      cursor?: string;
    }): Promise<R2Objects>;
  }
  interface R2Object {
    key: string;
    size: number;
    etag: string;
    uploaded: Date;
    httpMetadata?: Record<string, unknown>;
    customMetadata?: Record<string, string>;
  }
  interface R2ObjectBody extends R2Object {
    body: ReadableStream | null;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>;
    json<T = unknown>(): Promise<T>;
    blob(): Promise<Blob>;
  }
  interface R2Objects {
    objects: R2Object[];
    truncated: boolean;
    cursor?: string;
  }
}
