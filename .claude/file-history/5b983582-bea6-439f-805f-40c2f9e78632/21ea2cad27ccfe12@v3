import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { Artifact, Comment } from '@artifact-hub/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE_URL = (process.env.API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const API_KEY = process.env.API_KEY ?? '';

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiCall<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  formData?: FormData,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = { 'x-api-key': API_KEY };
  let requestBody: string | FormData | undefined;

  if (formData) {
    // Do NOT set Content-Type — Node's fetch sets it automatically with the
    // correct multipart boundary when given a FormData instance.
    requestBody = formData;
  } else if (body !== undefined) {
    headers['content-type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, { method, headers, body: requestBody });

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({ error: response.statusText })) as Record<string, unknown>;

  if (!response.ok) {
    const message =
      typeof data['error'] === 'string'
        ? data['error']
        : `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return data as T;
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'artifact-hub',
  version: '0.1.0',
});

// ── 1. publish_artifact ───────────────────────────────────────────────────────

server.tool(
  'publish_artifact',
  'Download a file from a URL and publish it as an artifact. ' +
    'title, description, and tags are optional — the API will auto-generate them via AI if omitted.',
  {
    fileUrl:     z.string().url().describe('Public URL of the file to publish'),
    type:        z.enum(['html', 'image', 'pdf']).describe('Artifact type'),
    title:       z.string().optional().describe('Overrides AI-generated title'),
    description: z.string().optional().describe('Overrides AI-generated description'),
    tags:        z.array(z.string()).optional().describe('Overrides AI-generated tags'),
  },
  async ({ fileUrl, type, title, description, tags }) => {
    try {
      // Download the file
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to download file: HTTP ${fileResponse.status}`);
      }

      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      const contentType =
        fileResponse.headers.get('content-type') ?? 'application/octet-stream';

      // Derive a filename from the URL path
      const urlPath = new URL(fileUrl).pathname;
      const filename = urlPath.split('/').pop() || `upload.${type}`;

      const form = new FormData();
      form.append('file', new Blob([buffer], { type: contentType }), filename);
      form.append('type', type);
      if (title)       form.append('title', title);
      if (description) form.append('description', description);
      if (tags?.length) form.append('tags', tags.join(','));

      const artifact = await apiCall<Artifact>('POST', '/api/artifacts', undefined, form);

      const tagList = artifact.tags.length ? artifact.tags.join(', ') : '(none)';
      return {
        content: [{
          type: 'text' as const,
          text: `Artifact published!\nID: ${artifact.id}\nTitle: ${artifact.title}\nTags: ${tagList}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 2. search_artifacts ───────────────────────────────────────────────────────

server.tool(
  'search_artifacts',
  'Search and filter published artifacts',
  {
    query: z.string().optional().describe('Full-text search on title and description'),
    tags:  z.array(z.string()).optional().describe('Filter by tags (all must match)'),
    type:  z.enum(['html', 'image', 'pdf']).optional().describe('Filter by artifact type'),
    limit: z.number().int().min(1).max(100).optional().describe('Max results (default 20)'),
  },
  async ({ query, tags, type, limit }) => {
    try {
      const params = new URLSearchParams();
      if (query) params.set('search', query);
      if (tags?.length) params.set('tags', tags.join(','));
      if (type)  params.set('type', type);
      if (limit) params.set('limit', String(limit));

      const qs = params.size ? `?${params.toString()}` : '';
      const { artifacts, total } = await apiCall<{ artifacts: Artifact[]; total: number }>(
        'GET',
        `/api/artifacts${qs}`,
      );

      if (artifacts.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No artifacts found.' }] };
      }

      const lines = artifacts.map(
        (a) =>
          `- [${a.id}] ${a.title} (${a.type}) — ${a.description || 'no description'}`,
      );

      return {
        content: [{
          type: 'text' as const,
          text: `Found ${total} artifact${total === 1 ? '' : 's'}:\n${lines.join('\n')}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 3. get_artifact ───────────────────────────────────────────────────────────

server.tool(
  'get_artifact',
  'Get full details for a single artifact including its comments',
  {
    id: z.string().describe('Artifact UUID'),
  },
  async ({ id }) => {
    try {
      const artifact = await apiCall<Artifact & { comments: Comment[] }>(
        'GET',
        `/api/artifacts/${id}`,
      );

      const commentCount = artifact.comments?.length ?? 0;
      const tagList = artifact.tags.length ? artifact.tags.join(', ') : '(none)';

      const text = [
        `ID:          ${artifact.id}`,
        `Title:       ${artifact.title}`,
        `Type:        ${artifact.type}`,
        `Tags:        ${tagList}`,
        `Description: ${artifact.description || '(none)'}`,
        `Author:      ${artifact.authorEmail}`,
        `Storage URL: ${artifact.storageUrl}`,
        `Created:     ${artifact.createdAt}`,
        `Updated:     ${artifact.updatedAt}`,
        `Comments:    ${commentCount}`,
      ].join('\n');

      return { content: [{ type: 'text' as const, text }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 4. add_comment ────────────────────────────────────────────────────────────

server.tool(
  'add_comment',
  'Post a comment on an artifact',
  {
    artifactId: z.string().describe('Artifact UUID'),
    comment:    z.string().min(1).describe('Comment text'),
  },
  async ({ artifactId, comment }) => {
    try {
      // Fetch the artifact title so we can confirm in the response
      const artifact = await apiCall<Artifact>('GET', `/api/artifacts/${artifactId}`);

      await apiCall<Comment>('POST', `/api/artifacts/${artifactId}/comments`, {
        body: comment,
      });

      return {
        content: [{
          type: 'text' as const,
          text: `Comment added to '${artifact.title}'`,
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 5. create_share_link ──────────────────────────────────────────────────────

server.tool(
  'create_share_link',
  'Create a time-limited public share link for an artifact',
  {
    artifactId:    z.string().describe('Artifact UUID'),
    expiresInHours: z.number().int().min(1).max(168).optional()
      .describe('Link lifetime in hours (default 24, max 168)'),
  },
  async ({ artifactId, expiresInHours = 24 }) => {
    try {
      const result = await apiCall<{ token: string; url: string; expiresAt: string }>(
        'POST',
        `/api/artifacts/${artifactId}/share`,
        { expiresInHours },
      );

      return {
        content: [{
          type: 'text' as const,
          text: `Share link created: ${result.url} (expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'})`,
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 6. summarize_feedback ─────────────────────────────────────────────────────

server.tool(
  'summarize_feedback',
  'Get an AI-generated summary of all reviewer comments on an artifact',
  {
    artifactId: z.string().describe('Artifact UUID'),
  },
  async ({ artifactId }) => {
    try {
      const { summary } = await apiCall<{ summary: string }>(
        'GET',
        `/api/artifacts/${artifactId}/summary`,
      );

      return { content: [{ type: 'text' as const, text: summary }] };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ── 7. list_my_artifacts ──────────────────────────────────────────────────────

server.tool(
  'list_my_artifacts',
  'List all publicly available artifacts (most recent first). ' +
    'Note: returns all public artifacts, not filtered by owner.',
  {},
  async () => {
    try {
      const { artifacts, total } = await apiCall<{ artifacts: Artifact[]; total: number }>(
        'GET',
        '/api/artifacts?limit=50',
      );

      if (artifacts.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No artifacts found.' }] };
      }

      const lines = artifacts.map((a) => {
        const tags = a.tags.length ? ` [${a.tags.join(', ')}]` : '';
        return `• ${a.title} (${a.type})${tags}\n  ID: ${a.id}\n  ${a.description || 'No description'}`;
      });

      return {
        content: [{
          type: 'text' as const,
          text: `${total} artifact${total === 1 ? '' : 's'} in the hub:\n\n${lines.join('\n\n')}`,
        }],
      };
    } catch (err) {
      return { content: [{ type: 'text' as const, text: `Error: ${(err as Error).message}` }] };
    }
  },
);

// ─── Connect ──────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
