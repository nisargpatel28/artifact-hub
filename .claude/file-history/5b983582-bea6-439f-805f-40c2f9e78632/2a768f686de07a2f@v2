import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-sonnet-4-6';

const METADATA_SYSTEM =
  'You are helping catalog AI-generated content. Analyze this artifact and return ONLY a JSON object with: ' +
  'title (concise, max 60 chars), description (2-3 sentences about what this is), ' +
  'tags (array of 3-6 lowercase relevant tags). No markdown, no preamble, just JSON.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function safeImageMediaType(
  mimeType: string,
): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
  return allowed.has(mimeType)
    ? (mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp')
    : 'image/jpeg';
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export interface ArtifactMetadata {
  title: string;
  description: string;
  tags: string[];
}

export async function generateMetadata(
  fileBuffer: Buffer,
  fileType: string,
  filename: string,
): Promise<ArtifactMetadata> {
  const fallback: ArtifactMetadata = { title: filename, description: '', tags: [] };

  try {
    let message: Anthropic.MessageParam;

    if (fileType === 'image') {
      message = {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: safeImageMediaType(
                filename.toLowerCase().endsWith('.png') ? 'image/png'
                  : filename.toLowerCase().endsWith('.gif') ? 'image/gif'
                  : filename.toLowerCase().endsWith('.webp') ? 'image/webp'
                  : 'image/jpeg',
              ),
              data: fileBuffer.toString('base64'),
            },
          },
          { type: 'text', text: 'Analyze this image artifact.' },
        ],
      };
    } else {
      let text: string;
      if (fileType === 'html') {
        text = stripHtmlTags(fileBuffer.toString('utf-8')).slice(0, 3000);
      } else {
        // pdf — decode first 3000 bytes as latin-1 to preserve byte values
        text = fileBuffer.slice(0, 3000).toString('latin1');
      }
      message = {
        role: 'user',
        content: `Analyze this ${fileType} artifact:\n\n${text}`,
      };
    }

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      system: METADATA_SYSTEM,
      messages: [message],
    });

    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const parsed = JSON.parse(raw) as Partial<ArtifactMetadata>;

    return {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, 60) : fallback.title,
      description: typeof parsed.description === 'string' ? parsed.description : '',
      tags: Array.isArray(parsed.tags)
        ? parsed.tags.filter((t): t is string => typeof t === 'string')
        : [],
    };
  } catch {
    return fallback;
  }
}

// ─── summarizeFeedback ────────────────────────────────────────────────────────

export async function summarizeFeedback(
  artifactTitle: string,
  comments: { authorEmail: string; body: string; createdAt: string }[],
): Promise<string> {
  if (comments.length === 0) return 'No feedback yet.';

  const commentList = comments
    .map((c, i) => `${i + 1}. [${c.authorEmail} at ${c.createdAt}]: ${c.body}`)
    .join('\n');

  const prompt =
    `You are summarizing reviewer feedback on an AI-generated artifact titled '${artifactTitle}'. ` +
    `Here are all comments:\n${commentList}\n\n` +
    `Write a 2-3 sentence neutral summary of the overall feedback, key themes, and any action items mentioned. ` +
    `Be concise and specific.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
  } catch {
    return 'Unable to generate summary at this time.';
  }
}
