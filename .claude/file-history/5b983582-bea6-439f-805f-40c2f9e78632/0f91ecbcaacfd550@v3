/**
 * Seed script — populates the gallery with demo data so reviewers see a
 * working product immediately.
 *
 * Usage (from repo root, after starting the API):
 *   pnpm seed
 */

import 'dotenv/config';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:3001'
).replace(/\/$/, '');

const API_KEY = process.env.API_KEY ?? 'demo-api-key-12345';
const DEMO_EMAIL = 'demo@artifacthub.com';

// ─── Sample artifacts ─────────────────────────────────────────────────────────

const SAMPLES = [
  {
    picsum: 'https://picsum.photos/seed/mountains/800/600',
    filename: 'mountains.jpg',
    type: 'image',
    title: 'Mountain Landscape',
    description: 'A serene mountain landscape generated for demonstration purposes.',
    tags: 'landscape,nature,mountains,demo',
  },
  {
    picsum: 'https://picsum.photos/seed/cityscape/800/600',
    filename: 'cityscape.jpg',
    type: 'image',
    title: 'Urban Cityscape',
    description: 'A vibrant cityscape showcasing modern architecture.',
    tags: 'city,urban,architecture,demo',
  },
  {
    picsum: 'https://picsum.photos/seed/forest/800/600',
    filename: 'forest.jpg',
    type: 'image',
    title: 'Forest Path',
    description: 'A tranquil forest path with dappled light through the canopy.',
    tags: 'forest,nature,trees,demo',
  },
] as const;

const SAMPLE_COMMENTS = [
  'Great composition — the lighting feels very natural.',
  'This would work well as a hero image. Consider a slightly warmer tone.',
];

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function api<T>(
  method: string,
  path: string,
  body?: FormData | Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = { 'x-api-key': API_KEY };
  let fetchBody: FormData | string | undefined;

  if (body instanceof FormData) {
    fetchBody = body;
  } else if (body) {
    headers['content-type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body: fetchBody });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({ error: res.statusText })) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data['error'] ?? `HTTP ${res.status}`));
  }
  return data as T;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

async function checkHealth(): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`${res.status}`);
  } catch (err) {
    console.error(`\n✗ API unreachable at ${API_URL}`);
    console.error('  Start the server first:  pnpm dev\n');
    process.exit(1);
  }
  console.log(`✓ API is up at ${API_URL}`);
}

async function ensureDemoUser(): Promise<void> {
  try {
    await api('POST', '/api/users', { email: DEMO_EMAIL });
    console.log(`✓ Created demo user: ${DEMO_EMAIL}`);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.toLowerCase().includes('already') || msg.includes('409')) {
      console.log(`✓ Demo user already exists: ${DEMO_EMAIL}`);
    } else {
      throw err;
    }
  }
}

async function uploadArtifact(sample: (typeof SAMPLES)[number]): Promise<string> {
  console.log(`  Downloading ${sample.filename}…`);
  const imgRes = await fetch(sample.picsum);
  if (!imgRes.ok) throw new Error(`Failed to download ${sample.picsum}: ${imgRes.status}`);

  const buffer = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';

  const form = new FormData();
  form.append('file', new Blob([buffer], { type: contentType }), sample.filename);
  form.append('type', sample.type);
  form.append('title', sample.title);
  form.append('description', sample.description);
  form.append('tags', sample.tags);

  const artifact = await api<{ id: string; title: string }>('POST', '/api/artifacts', form);
  console.log(`  ✓ Uploaded "${artifact.title}" (id: ${artifact.id})`);
  return artifact.id;
}

async function addComment(artifactId: string, body: string): Promise<void> {
  await api('POST', `/api/artifacts/${artifactId}/comments`, { body });
  console.log(`  ✓ Comment added`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n── Artifact Hub seed ─────────────────────────\n');

  await checkHealth();
  await ensureDemoUser();

  console.log('\nUploading sample artifacts…');
  const ids: string[] = [];
  for (const sample of SAMPLES) {
    const id = await uploadArtifact(sample);
    ids.push(id);
  }

  const firstId = ids[0];
  if (firstId) {
    console.log(`\nAdding sample comments to first artifact (${firstId})…`);
    for (const body of SAMPLE_COMMENTS) {
      await addComment(firstId, body);
    }
  }

  console.log('\n── Done ──────────────────────────────────────');
  console.log(`\nOpen ${process.env.NEXT_PUBLIC_API_URL?.replace('3001', '3000') ?? 'http://localhost:3000'} to see the gallery.\n`);
}

main().catch(err => {
  console.error('\n✗ Seed failed:', (err as Error).message);
  process.exit(1);
});
