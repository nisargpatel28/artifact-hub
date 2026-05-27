import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import artifactRoutes from './routes/artifacts.js';
import commentRoutes from './routes/comments.js';
import shareRoutes from './routes/share.js';
import userRoutes from './routes/users.js';

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
  });

  // Must be registered before any route that reads request.user
  app.decorateRequest('user', null);

  await app.register(cors, {
    origin: [
      'http://localhost:3000',
      'https://artifact-hub-web.vercel.app',
      /\.vercel\.app$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
    credentials: true,
  });
  await app.register(multipart);

  app.get('/health', async () => ({ status: 'ok' }));

  await app.register(artifactRoutes, { prefix: '/api' });
  await app.register(commentRoutes, { prefix: '/api' });
  await app.register(shareRoutes, { prefix: '/api' });
  await app.register(userRoutes, { prefix: '/api' });

  return app;
}
