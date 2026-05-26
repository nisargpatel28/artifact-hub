import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp } from '../app.js';
import type { FastifyInstance } from 'fastify';

// ─── Supabase mock ────────────────────────────────────────────────────────────

// vi.mock is hoisted above imports, so this runs before any module is loaded.
vi.mock('../db/client.js', () => ({
  db: {
    from: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/artifacts/test.jpg' },
        }),
      }),
    },
  },
}));

// Prevent real AI calls in route tests
vi.mock('../services/ai.js', () => ({
  generateMetadata: vi.fn().mockResolvedValue({ title: 'AI Title', description: '', tags: [] }),
}));

// ─── Builder factory ──────────────────────────────────────────────────────────
// Produces a mock that mimics Supabase's chainable query builder.
// Every chain method returns `this`; single/maybeSingle and a direct await
// all resolve to `result`.

function makeChain<T>(result: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {};
  const methods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'or', 'contains', 'order', 'range', 'limit', 'filter',
  ];
  methods.forEach(m => { b[m] = vi.fn().mockReturnValue(b); });
  b.single      = vi.fn().mockResolvedValue(result);
  b.maybeSingle = vi.fn().mockResolvedValue(result);
  // Make the builder itself a thenable so `await query.range(...)` works
  b.then = (
    onFulfilled?: (v: T) => unknown,
    onRejected?: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return b;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Access the mock so individual tests can configure its return value
const { db } = await import('../db/client.js');
const mockFrom = vi.mocked(db.from);

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('artifacts routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ── Auth guard ───────────────────────────────────────────────────────────

  it('POST /api/artifacts → 401 without x-api-key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/artifacts',
      // No x-api-key header, no body — auth preHandler fires first
    });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toMatchObject({ error: expect.any(String) });
  });

  it('POST /api/artifacts → 401 with invalid api key', async () => {
    // DB returns no user for this key
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: 'row not found' } }),
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/artifacts',
      headers: { 'x-api-key': 'bad-key' },
    });

    expect(res.statusCode).toBe(401);
  });

  // ── Listing ──────────────────────────────────────────────────────────────

  it('GET /api/artifacts → 200 with artifacts array', async () => {
    const fakeArtifact = {
      id: 'a1b2c3d4-0000-0000-0000-000000000001',
      title: 'Test Artifact',
      description: 'A test',
      tags: ['test'],
      type: 'image',
      storage_url: 'https://example.com/img.jpg',
      thumbnail_url: null,
      author_email: 'demo@artifacthub.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockFrom.mockReturnValue(
      makeChain({ data: [fakeArtifact], error: null, count: 1 }),
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/artifacts',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json<{ artifacts: unknown[]; total: number }>();
    expect(Array.isArray(body.artifacts)).toBe(true);
    expect(body.artifacts).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it('GET /api/artifacts with search param → 200', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: [], error: null, count: 0 }),
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/artifacts?search=hello&type=image&limit=5',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ artifacts: [], total: 0 });
  });

  // ── Share links ──────────────────────────────────────────────────────────

  it('GET /api/share/:token → 404 when token not found', async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: 'not found' } }),
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/share/nonexistent-token',
    });

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/share/:token → 404 when token is expired', async () => {
    const expiredLink = {
      token: 'expired-token-abc',
      artifact_id: 'a1b2c3d4-0000-0000-0000-000000000001',
      expires_at: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
      created_at: new Date().toISOString(),
    };

    mockFrom.mockReturnValue(
      makeChain({ data: expiredLink, error: null }),
    );

    const res = await app.inject({
      method: 'GET',
      url: '/api/share/expired-token-abc',
    });

    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: expect.stringContaining('expired') });
  });

  it('GET /health → 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });
});
