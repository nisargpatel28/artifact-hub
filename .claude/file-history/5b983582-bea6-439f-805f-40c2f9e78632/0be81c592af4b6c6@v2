import { describe, it, expect, vi } from 'vitest';

// ─── Anthropic mock ───────────────────────────────────────────────────────────
// Must be declared before the import of ai.ts so the hoisted mock replaces
// the SDK before `new Anthropic()` is called at module load time.

vi.mock('@anthropic-ai/sdk', () => {
  const mockCreate = vi.fn().mockRejectedValue(new Error('Simulated API failure'));

  // Must be a class (or regular function) — arrow functions can't be `new`-ed.
  class MockAnthropic {
    messages = { create: mockCreate };
  }

  return { default: MockAnthropic };
});

// Import AFTER the mock is declared (hoisting ensures the mock is active)
import { generateMetadata, summarizeFeedback } from '../services/ai.js';

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('generateMetadata', () => {
  it('returns fallback values when the Anthropic API throws', async () => {
    const buf = Buffer.from('<html><body>Hello</body></html>');
    const result = await generateMetadata(buf, 'html', 'demo.html');

    // Title falls back to the filename; description and tags are empty
    expect(result).toEqual({
      title: 'demo.html',
      description: '',
      tags: [],
    });
  });

  it('returns fallback with the filename as title for image type', async () => {
    const buf = Buffer.alloc(16, 0xff); // fake image bytes
    const result = await generateMetadata(buf, 'image', 'photo.jpg');

    expect(result.title).toBe('photo.jpg');
    expect(Array.isArray(result.tags)).toBe(true);
  });

  it('returns fallback with the filename as title for pdf type', async () => {
    const buf = Buffer.from('%PDF-1.4 fake content');
    const result = await generateMetadata(buf, 'pdf', 'report.pdf');

    expect(result.title).toBe('report.pdf');
    expect(result.description).toBe('');
  });
});

describe('summarizeFeedback', () => {
  it('returns "No feedback yet." without calling the API for an empty array', async () => {
    const result = await summarizeFeedback('My Artifact', []);

    expect(result).toBe('No feedback yet.');
  });

  it('returns a fallback string when the Anthropic API throws (non-empty comments)', async () => {
    const comments = [
      { authorEmail: 'alice@example.com', body: 'Looks great!', createdAt: new Date().toISOString() },
    ];
    const result = await summarizeFeedback('My Artifact', comments);

    // The API throws → caught → returns the static fallback string
    expect(result).toBe('Unable to generate summary at this time.');
  });
});
