import postgres from "postgres";
import type {} from "./env";

// SQL text is application-owned; values always travel separately as parameters.
// Tokenize literals/comments so question marks inside them are never rewritten.
export function postgresQuery(query: string, values: unknown[]) {
  let index = 0;
  let numbered = false;
  let anonymous = false;
  const used = new Set<number>();
  const sql = query.replace(
    /'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\/|\?\d*/g,
    (token) => {
      if (!token.startsWith("?")) return token;
      const explicit = token.length > 1;
      numbered ||= explicit;
      anonymous ||= !explicit;
      const n = explicit ? Number(token.slice(1)) : ++index;
      if (n < 1 || n > values.length) throw new Error("SQL parameter count mismatch");
      used.add(n);
      return `$${n}`;
    },
  );
  if ((numbered && anonymous) || used.size !== values.length) {
    throw new Error("SQL parameter count mismatch");
  }
  if (values.some((v) => v === undefined)) throw new Error("Undefined SQL parameter");
  return { sql, values };
}

function safeInteger(value: string) {
  const n = Number(value);
  if (!Number.isSafeInteger(n)) throw new Error("Database integer exceeds safe range");
  return n;
}

export function createPostgresDatabase(connectionString: string): D1Database {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) {
    throw new Error("DATABASE_URL must use PostgreSQL");
  }
  // Do not let connection-string options disable certificate validation.
  url.search = "";

  async function execute(statements: Statement[]): Promise<D1Result[]> {
    // Each operation owns and closes its socket. Cloudflare Workers sockets
    // must not be reused by a different request. Use the transaction pooler.
    const client = postgres(url.toString(), {
      prepare: false,
      max: 1,
      connect_timeout: 10,
      idle_timeout: 5,
      max_lifetime: 60,
      ssl: { rejectUnauthorized: true },
      types: { epoch: { to: 20, from: [20], serialize: String, parse: safeInteger } },
    });
    try {
      const result = await client.begin(async (tx) => {
        await tx.unsafe("SET LOCAL search_path = recruitment, pg_catalog");
        await tx.unsafe("SET LOCAL statement_timeout = '15s'");
        await tx.unsafe("SET LOCAL lock_timeout = '5s'");
        const results: D1Result[] = [];
        for (const statement of statements) {
          const { sql, values } = postgresQuery(statement.query, statement.values);
          const rows = await tx.unsafe(sql, values as postgres.ParameterOrJSON<never>[]);
          results.push({ success: true, results: Array.from(rows), meta: { changes: rows.count } });
        }
        return results;
      });
      return result as D1Result[];
    } catch {
      // Provider errors may contain SQL values, credentials or candidate data.
      throw new Error("Database operation failed");
    } finally {
      await client.end({ timeout: 5 });
    }
  }

  class Statement implements D1PreparedStatement {
    query: string;
    values: unknown[];
    constructor(query: string, values: unknown[] = []) {
      this.query = query;
      this.values = values;
    }
    bind(...values: unknown[]) { return new Statement(this.query, values); }
    async all<T>() { return (await execute([this]))[0] as D1Result<T>; }
    async run<T>() { return this.all<T>(); }
    async first<T>(column?: string): Promise<T | null> {
      const row = (await this.all<Record<string, unknown>>()).results?.[0];
      return (row ? (column ? row[column] : row) : null) as T | null;
    }
    async raw<T = unknown[]>(): Promise<T[]> {
      const result = await this.all<Record<string, unknown>>();
      return (result.results ?? []).map((row) => Object.values(row) as T);
    }
  }

  return {
    prepare: (query) => new Statement(query),
    async batch<T>(statements: D1PreparedStatement[]) {
      if (!statements.every((s) => s instanceof Statement)) {
        throw new Error("Cannot mix database adapters in a transaction");
      }
      return execute(statements as Statement[]) as Promise<D1Result<T>[]>;
    },
    async exec() { throw new Error("Runtime schema execution is disabled; use migrations"); },
  };
}
