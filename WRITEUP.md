# Artifact Hub — Engineering Writeup

---

## What I Built

Artifact Hub is a full-stack platform for uploading, browsing, and sharing AI-generated content — HTML pages, images, and PDFs. It has three deployable surfaces: a Fastify REST API backed by Supabase (PostgreSQL + Storage), a Next.js 14 App Router frontend, and an MCP server that exposes the entire platform as tools that Claude can call directly from a conversation.

The core loop is: a user uploads a file through the web UI or via the MCP `publish_artifact` tool, the API stores it in Supabase Storage and writes a metadata row to PostgreSQL, and the artifact becomes immediately discoverable in the public gallery. The MCP integration means Claude can act as a first-class participant — it can publish artifacts on behalf of a user, search the catalogue, add reviewer comments, generate share links, and summarise feedback, all without leaving the chat interface.

---

## Product Decisions

**API-key authentication over OAuth.** The platform is aimed at developers and AI agents, not end consumers. A static `x-api-key` header is the lowest-friction credential format for both human developers (`curl`, Postman) and LLM tool calls. Adding OAuth would have introduced a redirect flow that breaks the MCP stdio transport entirely. A future migration path to short-lived JWTs is straightforward because the `users` table already exists and the `requireAuth` middleware is isolated to a single file.

**Supabase Storage over S3-compatible object storage.** Supabase gives us a managed PostgreSQL database, a storage bucket with CDN-backed public URLs, and row-level security — all under one API client. For a project of this scope, the operational simplicity far outweighs the minor vendor lock-in. The storage paths are opaque to the application code, so swapping the backend to S3 later requires changing only the upload and delete calls in `artifacts.ts`.

**Optional AI metadata.** Rather than requiring Claude to generate a title for every upload, the API treats title/description/tags as optional fields and only calls `generateMetadata` when at least one is missing. This means the feature degrades gracefully if `ANTHROPIC_API_KEY` is not set (the Anthropic client throws, `generateMetadata` catches it, and returns the filename as the title). It also keeps upload latency predictable — a user who provides complete metadata skips the AI call entirely.

---

## What I Chose Not to Build (and Why)

**Per-artifact access control.** Every artifact is publicly readable; only the uploader can delete. Adding a `visibility` column and per-row RLS policies in Supabase would be the right next step, but it would have required a more complex auth model (session tokens, not just API keys) and would have complicated the MCP tools, which currently need no user context to search or read artifacts.

**Real-time comment updates.** The comments section does an optimistic local append after posting, but doesn't poll or subscribe to changes from other users. Supabase Realtime would make this trivial (one `channel.on('postgres_changes', ...)` call), but it adds a persistent WebSocket connection to every page load. Given that comments are low-frequency, polling every 30 seconds on focus would be a better first step than always-on subscriptions.

**Pagination on the detail page.** Comments are loaded in full with the artifact. For artifacts with hundreds of comments this would become slow, but the typical use-case (AI-generated content under active review) rarely exceeds a few dozen comments before a decision is made. Cursor-based pagination was deliberately left out to keep the query shape and frontend state simple.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14, App Router, Tailwind)        │
│  Client components fetch from NEXT_PUBLIC_API_URL    │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP (REST)
┌───────────────────────▼─────────────────────────────┐
│  apps/api  (Fastify 4, TypeScript, tsx)              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ /artifacts  │  │ /comments    │  │ /share     │  │
│  │ /users      │  │ /summary     │  │ /share/:t  │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                │                │          │
│  ┌──────▼────────────────▼────────────────▼──────┐  │
│  │  services/ai.ts (Anthropic claude-sonnet-4-6)  │  │
│  └───────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐ │
│  │  db/client.ts → Supabase (PostgreSQL + Storage)  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
                        │ HTTP (REST)
┌───────────────────────▼─────────────────────────────┐
│  apps/mcp  (@modelcontextprotocol/sdk, stdio)        │
│  publish_artifact  search_artifacts  get_artifact    │
│  add_comment  create_share_link  summarize_feedback  │
└─────────────────────────────────────────────────────┘
```

The monorepo is managed with pnpm workspaces. `packages/types` exports shared TypeScript interfaces (camelCase) consumed by all three apps — the API maps between these and the snake_case Postgres rows at the route layer, so the type contract is always the wire format the frontend receives.

The MCP server deliberately does not connect to Supabase directly. All writes go through the API, which means the API is the single enforcement point for auth, validation, storage side-effects, and AI enrichment. The MCP server is essentially a typed proxy with a natural-language-friendly description on each tool.

---

## MCP Integration

The MCP server speaks stdio transport, which is what Claude Desktop (and Claude Code) expect. It is registered as `artifact-hub` in `claude_mcp_config.json`. Once added, Claude can perform the full lifecycle: discover artifacts with `search_artifacts`, inspect one with `get_artifact`, publish new ones via `publish_artifact` (providing a public file URL), leave structured feedback with `add_comment`, share externally with `create_share_link`, and get an AI-generated commentary on accumulated feedback via `summarize_feedback`.

The most interesting tool is `publish_artifact`. It accepts a `fileUrl`, downloads it in-process (so the MCP server needs outbound network access), then posts a multipart request to the API with the binary buffer and any provided metadata. Because the API's metadata fields are optional, Claude can call `publish_artifact` with only `fileUrl` and `type` — and the API will call Claude again (through the `generateMetadata` service) to auto-generate the title, description, and tags from the file content. This creates a loop where Claude publishes content and a separate Claude call enriches it, which is a useful demonstration of model-as-infrastructure.

All tool handlers wrap their logic in try/catch and return errors as `{ type: 'text', text: 'Error: ...' }` rather than throwing. This ensures that a failed tool call never crashes the MCP server process, and Claude receives a human-readable explanation it can surface or retry.

---

## AI Features

**Metadata generation** (`services/ai.ts → generateMetadata`) uses `claude-sonnet-4-6` with a tight system prompt that demands a raw JSON response and a 256-token budget. Each file type receives appropriate content: HTML gets tag-stripped text (first 3 000 chars), images are base64-encoded and sent as vision blocks, and PDFs are decoded as `latin1` to preserve byte values without replacement characters. The response is defensively parsed field-by-field, so a partially malformed JSON still yields useful partial data. Any error — network failure, quota exceeded, bad JSON — returns a safe fallback of `{ title: filename, description: '', tags: [] }` without propagating the failure to the upload request.

**Feedback summarisation** (`summarizeFeedback`) formats all comments as a numbered list with author email and timestamp, then asks the model for a 2–3 sentence neutral summary covering key themes and action items. The endpoint is called lazily (only when the "AI Summary" button is clicked in the UI, or when the `summarize_feedback` MCP tool is invoked), and the result is cached in component state for the lifetime of the page. Empty comment arrays short-circuit before making any API call, returning the string `"No feedback yet."` immediately.

Both functions share the same Anthropic client instance initialised once at module load. They use `claude-sonnet-4-6` rather than Haiku because the quality of generated titles and summaries is user-visible and directly affects perceived product quality — the latency difference is acceptable given that these calls happen at most once per upload and once per summary click.

---

## Deployment

**API → Railway.** The `apps/api/Dockerfile` is a two-stage Alpine build: stage one installs all workspace dependencies and compiles TypeScript, stage two copies only the production dependencies and the compiled `dist/` output. The monorepo context is handled by copying workspace manifests from the repo root so pnpm can resolve the `workspace:*` link to `@artifact-hub/types`. Railway's `railway.json` points to the Dockerfile, sets the healthcheck path to `/health`, and configures a `ON_FAILURE` restart policy with three retries before alerting.

**Web → Vercel.** `next.config.js` sets `output: 'standalone'` so the build produces a self-contained directory suitable for Docker, but Vercel ignores this and uses its own build pipeline. The `vercel.json` sets the framework to `nextjs`, overrides the build command to run from the monorepo root (`pnpm --filter @artifact-hub/web build`), and sets the output directory to `apps/web/.next`. The `NEXT_PUBLIC_API_URL` environment variable must be set in the Vercel project settings to point at the Railway API URL.

**MCP → local or npx.** The MCP server is designed for local execution by Claude Desktop. After running `pnpm build:mcp`, point `claude_mcp_config.json` at `apps/mcp/dist/index.js` with `API_BASE_URL` and `API_KEY` set. For a hosted variant, the server could be packaged as an npm binary and invoked with `npx`, but the stdio transport makes containerised deployment less natural than a future HTTP/SSE transport would.

---

## AI Tools Used

**Claude Code (CLI)** was used for all code generation and debugging throughout this project. Every file in the codebase — API routes, database schema, frontend components, MCP tools, Dockerfiles, seed scripts, and configuration — was written or substantially revised through Claude Code. Debugging sessions covered TypeScript compiler errors, runtime crashes, Supabase RLS violations, Next.js module resolution issues, UTF-8 encoding problems, and MCP stdio transport behavior.

**Claude.ai (chat)** was used in the planning phase to work through architecture decisions before writing any code: choosing between tRPC and a plain REST API, deciding on the Supabase-as-backend-of-record model, and scoping what the MCP tools should expose versus what should stay server-side.

**Session logs** from the Claude Code build sessions are included in the `claude-sessions/` folder at the repo root. These are the raw conversation transcripts showing the iterative debugging process — including dead ends, wrong assumptions corrected mid-session, and the reasoning behind non-obvious decisions like the `rootDir` fix for TypeScript output paths and the ESM-vs-CommonJS resolution for the MCP server.

---

## What I'd Do Next

**Row-level security and proper auth.** The current API-key model is fine for a demo but would not survive production. The right path is Supabase Auth (magic links or OAuth) returning JWTs, with Supabase RLS policies replacing the application-level ownership checks in the route handlers. The `users` table already maps emails to API keys, so migration is mostly additive — add an `auth_id` column, update `requireAuth` to verify JWTs, and move the ownership checks into `CREATE POLICY` statements.

**Full-text search via PostgreSQL.** The current `ilike` search is case-insensitive substring matching on title and description individually. A proper solution would add a `tsvector` generated column covering title, description, and tags joined as a document, create a GIN index on it, and replace the `ilike` query with `to_tsquery`. This would give ranked results, stemming, and sub-millisecond lookup on large tables. Supabase exposes `textSearch()` in its query builder making this a small change on both the schema and route sides.

**Thumbnail generation for HTML and PDF artifacts.** Currently, artifact cards in the gallery show only text metadata. A background worker (a Supabase Edge Function or a Railway cron job) that uses headless Chromium to screenshot HTML artifacts and the first page of PDFs would dramatically improve the browsability of the gallery. The `thumbnail_url` column already exists in the schema — it just needs a writer. This would also make the MCP `search_artifacts` tool more useful when Claude renders results as an image carousel rather than a text list.
