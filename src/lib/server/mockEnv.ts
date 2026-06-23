import type { AppEnv } from "./env";
import { MOCK_ANALYTICS, MOCK_CANDIDATES, MOCK_CONTENT, MOCK_LEADS } from "./mockData";
import { readFile, writeFile } from "node:fs/promises";

type Row = Record<string, unknown>;

type MockState = {
  leads: Row[];
  candidates: Row[];
  content_items: Row[];
  analytics_events: Row[];
  sessions: Row[];
};

const MOCK_STATE_PATH = "/tmp/uk-talent-link-mock-state.json";

const mockGlobal = globalThis as typeof globalThis & {
  __UKTL_MOCK_STATE__?: MockState;
  __UKTL_MOCK_ENV__?: AppEnv;
};

const state: MockState =
  mockGlobal.__UKTL_MOCK_STATE__ ??
  (mockGlobal.__UKTL_MOCK_STATE__ = {
    leads: MOCK_LEADS.map((row) => ({ ...row, notified: 0 })),
    candidates: MOCK_CANDIDATES.map((row) => ({ ...row })),
    content_items: MOCK_CONTENT.map((row) => ({
      ...row,
      published: row.published ? 1 : 0,
    })),
    analytics_events: seedAnalyticsEvents(),
    sessions: [],
  });

let stateLoaded = false;

async function loadState(): Promise<void> {
  if (stateLoaded) return;
  stateLoaded = true;
  try {
    const saved = JSON.parse(await readFile(MOCK_STATE_PATH, "utf8")) as Partial<MockState>;
    if (Array.isArray(saved.leads)) state.leads = saved.leads;
    if (Array.isArray(saved.candidates)) state.candidates = saved.candidates;
    if (Array.isArray(saved.content_items)) state.content_items = saved.content_items;
    if (Array.isArray(saved.analytics_events)) state.analytics_events = saved.analytics_events;
    if (Array.isArray(saved.sessions)) state.sessions = saved.sessions;
  } catch {
    // No saved preview state yet. Start from seeded in-memory data.
  }
}

async function saveState(): Promise<void> {
  try {
    await writeFile(MOCK_STATE_PATH, JSON.stringify(state), "utf8");
  } catch {
    // The in-memory mock still works if filesystem persistence is unavailable.
  }
}

export function getMockEnv(): AppEnv {
  if (!mockGlobal.__UKTL_MOCK_ENV__) {
    const bucket = new MockR2Bucket();
    mockGlobal.__UKTL_MOCK_ENV__ = {
      DB: new MockD1Database(state),
      CV_BUCKET: bucket,
      R2: bucket,
      ADMIN_EMAIL: "info@uktalentlink.co.uk",
      FROM_EMAIL: "leads@uktalentlink.co.uk",
      CLAUDE_MODEL: "claude-sonnet-4-5",
    };
  }
  return mockGlobal.__UKTL_MOCK_ENV__;
}

function seedAnalyticsEvents(): Row[] {
  const now = Date.now();
  const rows: Row[] = [];
  let n = 0;
  for (const month of MOCK_ANALYTICS.visitors) {
    const createdAt = now - (MOCK_ANALYTICS.visitors.length - n) * 30 * 86_400_000;
    for (let i = 0; i < Math.max(1, Math.round(month.count / 80)); i++) {
      rows.push({
        id: `evt_seed_page_${n}_${i}`,
        created_at: createdAt + i,
        type: "page_view",
        page: "/",
        metadata: null,
      });
    }
    n++;
  }
  for (let i = 0; i < 16; i++) {
    rows.push({
      id: `evt_seed_start_${i}`,
      created_at: now - i * 86_400_000,
      type: "form_start",
      page: "/contact",
      metadata: null,
    });
  }
  for (let i = 0; i < 8; i++) {
    rows.push({
      id: `evt_seed_submit_${i}`,
      created_at: now - i * 86_400_000,
      type: "form_submit",
      page: "/contact",
      metadata: null,
    });
  }
  return rows;
}

class MockD1Database implements D1Database {
  constructor(private readonly db: MockState) {}

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(this.db, query);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    const results: D1Result<T>[] = [];
    for (const statement of statements) results.push(await statement.run<T>());
    return results;
  }

  async exec<T = unknown>(_query: string): Promise<D1ExecResult> {
    return { count: 0, duration: 0 };
  }
}

class MockD1PreparedStatement implements D1PreparedStatement {
  private values: unknown[] = [];

  constructor(
    private readonly db: MockState,
    private readonly query: string,
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    this.values = values;
    return this;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const rows = await this.execute();
    const first = rows[0];
    if (!first) return null;
    return (colName ? first[colName] : first) as T;
  }

  async run<T = unknown>(): Promise<D1Result<T>> {
    const rows = await this.execute();
    return { success: true, results: rows as T[], meta: { changes: rows.length } };
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    const rows = await this.execute();
    return { success: true, results: rows as T[] };
  }

  async raw<T = unknown[]>(): Promise<T[]> {
    return (await this.execute()).map((row) => Object.values(row) as T);
  }

  private async execute(): Promise<Row[]> {
    await loadState();
    const q = normalise(this.query);

    if (q.startsWith("select * from leads where id")) {
      return this.db.leads.filter((row) => row.id === this.values[0]).map(cloneRow);
    }
    if (q.startsWith("select * from leads order by created_at")) {
      return orderByCreated(this.db.leads).slice(0, 200).map(cloneRow);
    }
    if (q.startsWith("insert into leads")) {
      const [
        id,
        created_at,
        updated_at,
        name,
        company,
        email,
        phone,
        service,
        message,
        score,
        priority,
      ] = this.values;
      this.db.leads.unshift({
        id,
        created_at,
        updated_at,
        name,
        company,
        email,
        phone,
        service,
        message,
        score,
        priority,
        status: "New",
        ai_draft: null,
        notified: 0,
      });
      await saveState();
      return [];
    }
    if (q.startsWith("update leads set status=?, ai_draft=?")) {
      this.patchById(this.db.leads, this.values[3], {
        status: this.values[0],
        ai_draft: this.values[1],
        updated_at: this.values[2],
      });
      await saveState();
      return [];
    }
    if (q.startsWith("update leads set status=?")) {
      this.patchById(this.db.leads, this.values[2], {
        status: this.values[0],
        updated_at: this.values[1],
      });
      await saveState();
      return [];
    }
    if (q.startsWith("update leads set ai_draft=?")) {
      this.patchById(this.db.leads, this.values[2], {
        ai_draft: this.values[0],
        updated_at: this.values[1],
      });
      await saveState();
      return [];
    }
    if (q.startsWith("delete from leads where id")) {
      this.deleteById(this.db.leads, this.values[0]);
      await saveState();
      return [];
    }

    if (q.startsWith("select * from candidates where id")) {
      return this.db.candidates.filter((row) => row.id === this.values[0]).map(cloneRow);
    }
    if (q.startsWith("select * from candidates order by created_at")) {
      return orderByCreated(this.db.candidates).slice(0, 200).map(cloneRow);
    }
    if (q.startsWith("insert into candidates")) {
      const [
        id,
        created_at,
        updated_at,
        name,
        role,
        client,
        email,
        stage,
        score,
        notes,
      ] = this.values;
      this.db.candidates.unshift({
        id,
        created_at,
        updated_at,
        name,
        role,
        client,
        email,
        stage,
        score,
        notes,
        ai_analysis: null,
      });
      await saveState();
      return [];
    }
    if (q.startsWith("update candidates set")) {
      this.updateCandidate(q);
      await saveState();
      return [];
    }
    if (q.startsWith("delete from candidates where id")) {
      this.deleteById(this.db.candidates, this.values[0]);
      await saveState();
      return [];
    }

    if (q.startsWith("select * from content_items order by created_at")) {
      return orderByCreated(this.db.content_items).slice(0, 200).map(cloneRow);
    }
    if (q.startsWith("insert into content_items")) {
      const [id, created_at, title, type, tone, content, word_count] = this.values;
      this.db.content_items.unshift({
        id,
        created_at,
        title,
        type,
        tone,
        content,
        word_count,
        published: 0,
      });
      await saveState();
      return [];
    }
    if (q.startsWith("delete from content_items where id")) {
      this.deleteById(this.db.content_items, this.values[0]);
      await saveState();
      return [];
    }

    if (q.startsWith("insert into analytics_events")) {
      const [id, created_at, type, page, metadata] = this.values;
      this.db.analytics_events.unshift({ id, created_at, type, page, metadata });
      await saveState();
      return [];
    }
    if (q.includes("count(*) as n from analytics_events where type='page_view' and created_at >")) {
      return [{ n: this.countEvents("page_view", Number(this.values[0])) }];
    }
    if (q.includes("count(*) as n, avg(score) as avg_score from leads")) {
      const since = Number(this.values[0]);
      const rows = this.db.leads.filter((row) => Number(row.created_at) > since);
      const avg = rows.length
        ? rows.reduce((sum, row) => sum + Number(row.score ?? 0), 0) / rows.length
        : null;
      return [{ n: rows.length, avg_score: avg }];
    }
    if (q.startsWith("select service, count(*) as n from leads")) {
      const since = Number(this.values[0]);
      const counts = countBy(
        this.db.leads.filter((row) => Number(row.created_at) > since),
        "service",
      );
      return Object.entries(counts)
        .map(([service, n]) => ({ service, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 1);
    }
    if (q.startsWith("select strftime") && q.includes("from leads")) {
      return monthCounts(this.db.leads, "count");
    }
    if (q.startsWith("select strftime") && q.includes("from analytics_events")) {
      return monthCounts(
        this.db.analytics_events.filter((row) => row.type === "page_view"),
        "count",
      );
    }
    if (q.startsWith("select service as name, count(*) as value from leads")) {
      return Object.entries(countBy(this.db.leads, "service"))
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }
    if (q === "select count(*) as n from analytics_events where type='page_view'") {
      return [{ n: this.countEvents("page_view") }];
    }
    if (q === "select count(*) as n from analytics_events where type='form_start'") {
      return [{ n: this.countEvents("form_start") }];
    }
    if (q === "select count(*) as n from analytics_events where type='form_submit'") {
      return [{ n: this.countEvents("form_submit") }];
    }
    if (q === "select count(*) as n from leads") return [{ n: this.db.leads.length }];
    if (q.includes("from leads where status in")) {
      const statuses = new Set(["Qualified", "Proposal Sent", "Closed Won"]);
      return [{ n: this.db.leads.filter((row) => statuses.has(String(row.status))).length }];
    }
    if (q === "select count(*) as n from leads where status='closed won'") {
      return [{ n: this.db.leads.filter((row) => row.status === "Closed Won").length }];
    }

    return [];
  }

  private updateCandidate(q: string) {
    const id = this.values[this.values.length - 1];
    const row = this.db.candidates.find((candidate) => candidate.id === id);
    if (!row) return;
    const setClause = q.slice("update candidates set".length, q.indexOf(" where id=?")).trim();
    const columns = setClause.split(",").map((part) => part.trim().replace("=?", ""));
    columns.forEach((column, index) => {
      row[column] = this.values[index];
    });
  }

  private patchById(rows: Row[], id: unknown, patch: Row) {
    const row = rows.find((item) => item.id === id);
    if (row) Object.assign(row, patch);
  }

  private deleteById(rows: Row[], id: unknown) {
    const index = rows.findIndex((item) => item.id === id);
    if (index >= 0) rows.splice(index, 1);
  }

  private countEvents(type: string, since = 0): number {
    return this.db.analytics_events.filter(
      (row) => row.type === type && Number(row.created_at) > since,
    ).length;
  }
}

class MockR2Bucket implements R2Bucket {
  private readonly objects = new Map<string, StoredObject>();

  async put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream | null,
    options?: Record<string, unknown>,
  ): Promise<R2Object> {
    const bytes = await toBytes(value);
    const object: StoredObject = {
      key,
      bytes,
      size: bytes.byteLength,
      etag: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      uploaded: new Date(),
      httpMetadata: options?.httpMetadata as Record<string, unknown> | undefined,
      customMetadata: options?.customMetadata as Record<string, string> | undefined,
    };
    this.objects.set(key, object);
    return toR2Object(object);
  }

  async get(key: string): Promise<R2ObjectBody | null> {
    const object = this.objects.get(key);
    return object ? toR2ObjectBody(object) : null;
  }

  async head(key: string): Promise<R2Object | null> {
    const object = this.objects.get(key);
    return object ? toR2Object(object) : null;
  }

  async delete(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) this.objects.delete(key);
  }

  async list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<R2Objects> {
    const prefix = options?.prefix ?? "";
    const limit = options?.limit ?? 1000;
    const objects = [...this.objects.values()]
      .filter((object) => object.key.startsWith(prefix))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(0, limit)
      .map(toR2Object);
    return { objects, truncated: false };
  }
}

type StoredObject = R2Object & { bytes: Uint8Array };

function normalise(query: string): string {
  return query.replace(/\s+/g, " ").trim().toLowerCase();
}

function cloneRow(row: Row): Row {
  return { ...row };
}

function orderByCreated(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => Number(b.created_at ?? 0) - Number(a.created_at ?? 0));
}

function countBy(rows: Row[], key: string): Record<string, number> {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? "—");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

function monthCounts(rows: Row[], valueKey: "count"): Row[] {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const month = new Date(Number(row.created_at)).toISOString().slice(0, 7);
    acc[month] = (acc[month] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({ month, [valueKey]: count }));
}

async function toBytes(
  value: ArrayBuffer | ArrayBufferView | string | Blob | ReadableStream | null,
): Promise<Uint8Array> {
  if (value === null) return new Uint8Array();
  if (typeof value === "string") return new TextEncoder().encode(value);
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0));
  if (ArrayBuffer.isView(value)) {
    const out = new Uint8Array(value.byteLength);
    out.set(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
    return out;
  }
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  const reader = value.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    chunks.push(chunk);
    total += chunk.byteLength;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

function toR2Object(object: StoredObject): R2Object {
  return {
    key: object.key,
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded,
    httpMetadata: object.httpMetadata,
    customMetadata: object.customMetadata,
  };
}

function toR2ObjectBody(object: StoredObject): R2ObjectBody {
  const base = toR2Object(object);
  return {
    ...base,
    body: new Blob([bytesToArrayBuffer(object.bytes)]).stream(),
    async arrayBuffer() {
      return bytesToArrayBuffer(object.bytes);
    },
    async text() {
      return new TextDecoder().decode(object.bytes);
    },
    async json<T = unknown>() {
      return JSON.parse(await this.text()) as T;
    },
    async blob() {
      return new Blob([bytesToArrayBuffer(object.bytes)]);
    },
  };
}

function bytesToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(out).set(bytes);
  return out;
}