import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { generateMetadata } from '../services/ai.js';
import type { Artifact, Comment } from '@artifact-hub/types';

// ─── DB row shapes ────────────────────────────────────────────────────────────

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

interface DbComment {
  id: string;
  artifact_id: string;
  author_email: string;
  body: string;
  created_at: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

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

function toComment(row: DbComment): Comment {
  return {
    id: row.id,
    artifactId: row.artifact_id,
    authorEmail: row.author_email,
    body: row.body,
    createdAt: row.created_at,
  };
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const createArtifactFields = z.object({
  // title, description, tags are all optional — AI fills in any that are missing
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.string().optional(),           // comma-separated, parsed below
  type: z.enum(['html', 'image', 'pdf']),
});

const listQuery = z.object({
  search: z.string().optional(),
  tags: z.string().optional(),
  type: z.enum(['html', 'image', 'pdf']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Plugin ───────────────────────────────────────────────────────────────────

const artifactRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/artifacts ───────────────────────────────────────────────────────
  app.post('/artifacts', { preHandler: requireAuth }, async (request, reply) => {
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let fileName = 'upload';
    let fileMimeType = 'application/octet-stream';

    // Consume all multipart parts
    for await (const part of request.parts()) {
      if (part.type === 'file') {
        fileBuffer = await part.toBuffer();
        fileName = part.filename ?? 'upload';
        fileMimeType = part.mimetype;
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    if (!fileBuffer) {
      return reply.code(400).send({ error: 'File is required' });
    }

    const parsed = createArtifactFields.safeParse(fields);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { type } = parsed.data;
    let { title, description } = parsed.data;
    let tags = parsed.data.tags
      ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    // Fill any missing fields with AI-generated metadata
    const needsAI = !title || description === undefined || tags.length === 0;
    if (needsAI) {
      const aiMeta = await generateMetadata(fileBuffer, type, fileName);
      title       = title       ?? aiMeta.title;
      description = description ?? aiMeta.description;
      if (tags.length === 0) tags = aiMeta.tags;
    }

    const user = request.user!;
    const storagePath = `${user.id}/${Date.now()}-${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await db.storage
      .from('artifacts')
      .upload(storagePath, fileBuffer, { contentType: fileMimeType, upsert: false });

    if (uploadError) {
      request.log.error(uploadError, 'Storage upload failed');
      return reply.code(500).send({ error: 'File upload failed' });
    }

    const { data: { publicUrl } } = db.storage
      .from('artifacts')
      .getPublicUrl(storagePath);

    // Insert artifact row (title is always defined at this point — either user-provided or AI-generated)
    const { data: row, error: dbError } = await db
      .from('artifacts')
      .insert({
        title: title!,
        description: description ?? '',
        tags,
        type,
        storage_url: publicUrl,
        author_email: user.email,
      })
      .select()
      .single();

    if (dbError || !row) {
      request.log.error(dbError, 'DB insert failed');
      return reply.code(500).send({ error: 'Failed to create artifact' });
    }

    return reply.code(201).send(toArtifact(row as DbArtifact));
  });

  // GET /api/artifacts ────────────────────────────────────────────────────────
  app.get('/artifacts', async (request, reply) => {
    const parsed = listQuery.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { search, tags, type, limit, offset } = parsed.data;

    let query = db
      .from('artifacts')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        query = query.contains('tags', tagArray);
      }
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      request.log.error(error, 'Failed to list artifacts');
      return reply.code(500).send({ error: 'Failed to list artifacts' });
    }

    return {
      artifacts: (data as DbArtifact[]).map(toArtifact),
      total: count ?? 0,
    };
  });

  // GET /api/artifacts/:id ────────────────────────────────────────────────────
  app.get('/artifacts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const [artifactResult, commentsResult] = await Promise.all([
      db.from('artifacts').select('*').eq('id', id).single(),
      db.from('comments').select('*').eq('artifact_id', id).order('created_at', { ascending: true }),
    ]);

    if (artifactResult.error || !artifactResult.data) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    return {
      ...toArtifact(artifactResult.data as DbArtifact),
      comments: (commentsResult.data ?? []).map((c) => toComment(c as DbComment)),
    };
  });

  // DELETE /api/artifacts/:id ─────────────────────────────────────────────────
  app.delete('/artifacts/:id', { preHandler: requireAuth }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = request.user!;

    const { data: row, error: fetchError } = await db
      .from('artifacts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !row) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    if ((row as DbArtifact).author_email !== user.email) {
      return reply.code(403).send({ error: 'Forbidden' });
    }

    // Delete from storage — derive path from the public URL
    const artifact = row as DbArtifact;
    const urlObj = new URL(artifact.storage_url);
    // Supabase public URL pattern: .../storage/v1/object/public/{bucket}/{path}
    const bucketPrefix = '/storage/v1/object/public/artifacts/';
    const storagePath = urlObj.pathname.startsWith(bucketPrefix)
      ? urlObj.pathname.slice(bucketPrefix.length)
      : null;

    if (storagePath) {
      const { error: storageError } = await db.storage
        .from('artifacts')
        .remove([storagePath]);
      if (storageError) {
        request.log.warn(storageError, 'Storage delete failed — continuing with DB delete');
      }
    }

    const { error: dbError } = await db.from('artifacts').delete().eq('id', id);
    if (dbError) {
      request.log.error(dbError, 'DB delete failed');
      return reply.code(500).send({ error: 'Failed to delete artifact' });
    }

    return reply.code(204).send();
  });
};

export default artifactRoutes;
