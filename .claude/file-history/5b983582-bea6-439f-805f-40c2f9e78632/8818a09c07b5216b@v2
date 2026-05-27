import type { Artifact, Comment } from '@artifact-hub/types';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').replace(/\/$/, '');

export const STORAGE_KEY = 'artifact-hub-api-key';

export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

export function storeApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

// ─── Core fetcher ─────────────────────────────────────────────────────────────

type PlainBody = Record<string, unknown>;

async function req<T>(
  method: string,
  path: string,
  body?: PlainBody | FormData,
  params?: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  const apiKey = getStoredApiKey();
  if (apiKey) headers['x-api-key'] = apiKey;

  let fetchBody: string | FormData | undefined;
  if (body instanceof FormData) {
    fetchBody = body;
    // Let fetch set multipart Content-Type with boundary automatically
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(url.toString(), { method, headers, body: fetchBody });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ error: res.statusText })) as Record<string, unknown>;

  if (!res.ok) {
    throw new Error(typeof data['error'] === 'string' ? data['error'] : `HTTP ${res.status}`);
  }

  return data as T;
}

// ─── Typed API surface ────────────────────────────────────────────────────────

export interface ListArtifactsParams {
  search?: string;
  tags?: string[];
  type?: string;
  limit?: number;
  offset?: number;
}

export const api = {
  artifacts: {
    list(p: ListArtifactsParams = {}) {
      const params: Record<string, string | number> = {};
      if (p.search)        params['search'] = p.search;
      if (p.tags?.length)  params['tags']   = p.tags.join(',');
      if (p.type)          params['type']   = p.type;
      if (p.limit)         params['limit']  = p.limit;
      if (p.offset != null) params['offset'] = p.offset;
      return req<{ artifacts: Artifact[]; total: number }>('GET', '/api/artifacts', undefined, params);
    },
    get: (id: string) =>
      req<Artifact & { comments: Comment[] }>('GET', `/api/artifacts/${id}`),
    create: (formData: FormData) =>
      req<Artifact>('POST', '/api/artifacts', formData),
    delete: (id: string) =>
      req<void>('DELETE', `/api/artifacts/${id}`),
  },

  comments: {
    create: (artifactId: string, body: string) =>
      req<Comment>('POST', `/api/artifacts/${artifactId}/comments`, { body }),
    summary: (artifactId: string) =>
      req<{ summary: string }>('GET', `/api/artifacts/${artifactId}/summary`),
  },

  share: {
    create: (artifactId: string, expiresInHours = 24) =>
      req<{ token: string; url: string; expiresAt: string }>(
        'POST', `/api/artifacts/${artifactId}/share`, { expiresInHours },
      ),
    resolve: (token: string) =>
      req<Artifact>('GET', `/api/share/${token}`),
  },
};
