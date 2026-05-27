import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { requireAuth, type DbUser } from '../middleware/auth.js';

// Never expose api_key in list endpoints; return it only on creation
type SafeUser = Omit<DbUser, 'api_key'>;
type CreatedUser = DbUser;

const createUserBody = z.object({
  email: z.string().email('Invalid email'),
});

const userRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/users ───────────────────────────────────────────────────────────
  app.post('/users', async (request, reply) => {
    const parsed = createUserBody.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten().fieldErrors });
    }

    const { email } = parsed.data;

    // Check for duplicate before insert to return a clean error
    const { data: existing } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return reply.code(409).send({ error: 'Email already registered' });
    }

    const { data: row, error } = await db
      .from('users')
      .insert({ email })
      .select()
      .single();

    if (error || !row) {
      request.log.error(error, 'Failed to create user');
      return reply.code(500).send({ error: 'Failed to create user' });
    }

    // Return the full row including api_key — only time it's shown
    return reply.code(201).send(row as CreatedUser);
  });

  // GET /api/users/me ─────────────────────────────────────────────────────────
  app.get('/users/me', { preHandler: requireAuth }, async (request, reply) => {
    const { api_key: _omit, ...safe } = request.user!;
    return safe as SafeUser;
  });
};

export default userRoutes;
