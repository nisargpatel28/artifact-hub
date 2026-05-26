import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { summarizeFeedback } from '../services/ai.js';
import type { Comment } from '@artifact-hub/types';

interface DbComment {
  id: string;
  artifact_id: string;
  author_email: string;
  body: string;
  created_at: string;
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

const createCommentBody = z.object({
  body: z.string().min(1, 'body is required'),
});

const commentRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/artifacts/:id/comments ─────────────────────────────────────────
  app.post('/artifacts/:id/comments', { preHandler: requireAuth }, async (request, reply) => {
    const { id: artifactId } = request.params as { id: string };

    const parsed = createCommentBody.safeParse(request.body);
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

    const { data: row, error } = await db
      .from('comments')
      .insert({
        artifact_id: artifactId,
        author_email: request.user!.email,
        body: parsed.data.body,
      })
      .select()
      .single();

    if (error || !row) {
      request.log.error(error, 'Failed to create comment');
      return reply.code(500).send({ error: 'Failed to create comment' });
    }

    return reply.code(201).send(toComment(row as DbComment));
  });

  // GET /api/artifacts/:id/summary ────────────────────────────────────────────
  app.get('/artifacts/:id/summary', async (request, reply) => {
    const { id: artifactId } = request.params as { id: string };

    const [artifactResult, commentsResult] = await Promise.all([
      db.from('artifacts').select('title').eq('id', artifactId).single(),
      db.from('comments').select('author_email, body, created_at')
        .eq('artifact_id', artifactId)
        .order('created_at', { ascending: true }),
    ]);

    if (artifactResult.error || !artifactResult.data) {
      return reply.code(404).send({ error: 'Artifact not found' });
    }

    const { title } = artifactResult.data as { title: string };
    const comments = (commentsResult.data ?? []) as {
      author_email: string;
      body: string;
      created_at: string;
    }[];

    const summary = await summarizeFeedback(
      title,
      comments.map((c) => ({
        authorEmail: c.author_email,
        body: c.body,
        createdAt: c.created_at,
      })),
    );

    return { summary };
  });
};

export default commentRoutes;
