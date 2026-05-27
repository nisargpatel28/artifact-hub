import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import type { Artifact, ShareLink } from '@artifact-hub/types';

interface DbShareLink {
  token: string;
  artifact_id: string;
  expires_at: string;
  created_at: string;
}

interface DbArtifact {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  type: 'html' | 'image' | 'pdf';
  storage_url: string;
  thumbnail_url: string | null;
  author_email: string;
  created_at: string;
  updated_at: string;
}

function toShareLink(row: DbShareLink): ShareLink {
  return {
    token: row.token,
    artifactId: row.artifact_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

function toArtifact(row: DbArtifact): Artifact {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    tags: row.tags,
    type: row.type,
    storageUrl: row.storage_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    authorEmail: row.author_email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const createShareBody = z.object({
  expiresInHours: z.number().int().min(1).max(168).default(24),
});

const shareRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/artifacts/:id/share ─────────────────────────────────────────────
  app.post('/artifacts/:id/share', { preHandler: requireAuth }, async (request, reply) => {
    const { id: artifactId } = request.params as { id: string };

    const parsed = createShareBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    // Verify artifact exists
    const { error: artifactError } = await db
      .from('artifacts')
      .select('id')
      .eq('id', artifactId)
      .single();

    if (artifactError) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    const { expiresInHours } = parsed.data;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

    const { data: row, error } = await db
      .from('share_links')
      .insert({ artifact_id: artifactId, expires_at: expiresAt })
      .select()
      .single();

    if (error || !row) {
      request.log.error(error, 'Failed to create share link');
      return reply.code(500).send({ error: 'Failed to create share link' });
    }

    const shareLink = toShareLink(row as DbShareLink);
    const baseUrl = process.env.BASE_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

    return reply.code(201).send({
      token: shareLink.token,
      url: `${baseUrl}/api/share/${shareLink.token}`,
      expiresAt: shareLink.expiresAt,
    });
  });

  // GET /api/share/:token ─────────────────────────────────────────────────────
  app.get('/share/:token', async (request, reply) => {
    const { token } = request.params as { token: string };

    const { data: link, error: linkError } = await db
      .from('share_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      return reply.code(404).send({ error: 'Share link not found' });
    }

    const shareLink = link as DbShareLink;

    if (new Date(shareLink.expires_at) < new Date()) {
      return reply.code(404).send({ error: 'Share link has expired' });
    }

    const { data: artifact, error: artifactError } = await db
      .from('artifacts')
      .select('*')
      .eq('id', shareLink.artifact_id)
      .single();

    if (artifactError || !artifact) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    return toArtifact(artifact as DbArtifact);
  });
};

export default shareRoutes;
