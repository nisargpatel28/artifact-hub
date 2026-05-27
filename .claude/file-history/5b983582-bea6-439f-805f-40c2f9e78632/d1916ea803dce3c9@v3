import type { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db/client.js';

export interface DbUser {
  id: string;
  email: string;
  api_key: string;
  created_at: string;
}

// Extend FastifyRequest so every route can access request.user
declare module 'fastify' {
  interface FastifyRequest {
    user: DbUser | null;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    reply.code(401).send({ error: 'Missing x-api-key header' });
    return;
  }

  const { data: user, error } = await db
    .from('users')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !user) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  request.user = user as DbUser;
}
