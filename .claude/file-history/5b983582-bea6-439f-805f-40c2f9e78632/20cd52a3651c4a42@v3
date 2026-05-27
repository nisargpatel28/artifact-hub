# Artifact Hub

Artifact Hub is a platform for uploading, browsing, and sharing AI-generated content — HTML pages, images, and PDFs — with built-in Claude AI for automatic metadata generation and feedback summarisation. It ships a first-class MCP server so Claude can publish, search, annotate, and share artifacts directly from a conversation.

---

## Quick start

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Supabase project | any plan |
| Anthropic API key | for AI features |

### 1 — Clone and install

```bash
git clone https://github.com/your-username/artifact-hub.git
cd artifact-hub
pnpm install
```

### 2 — Environment setup

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=http://localhost:3001
API_KEY=demo-api-key-12345
```

Each app also has its own `.env.example` for app-specific overrides.

### 3 — Run the database schema

Open the [Supabase SQL editor](https://app.supabase.com) and run:

```bash
# Copy the contents of this file and paste into the SQL editor:
apps/api/src/db/schema.sql
```

This creates the `users`, `artifacts`, `comments`, and `share_links` tables, indexes, the `updated_at` trigger, and inserts the demo user.

### 4 — Start development

```bash
pnpm dev          # starts API on :3001 and web on :3000 in parallel
```

### 5 — Seed sample data (optional)

With the API running:

```bash
pnpm seed         # uploads 3 demo images and 2 comments
```

---

## Project structure

```
artifact-hub/
├── apps/
│   ├── api/     Fastify REST API + Supabase + Anthropic
│   ├── web/     Next.js 14 App Router frontend
│   └── mcp/     MCP server (Claude Desktop integration)
├── packages/
│   └── types/   Shared TypeScript interfaces
└── scripts/
    └── seed.ts  Gallery seeder
```

---

## MCP server — Claude Desktop integration

The MCP server lets Claude publish, search, and annotate artifacts without leaving the chat.

### Step 1 — Build the server

```bash
pnpm build:mcp
```

### Step 2 — Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or  
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "artifact-hub": {
      "command": "node",
      "args": ["/absolute/path/to/artifact-hub/apps/mcp/dist/index.js"],
      "env": {
        "API_BASE_URL": "https://your-api.railway.app",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

Restart Claude Desktop. You should see **artifact-hub** in the tools panel.

### Available tools

| Tool | What it does |
|------|-------------|
| `publish_artifact` | Downloads a file from a URL and publishes it (AI auto-fills missing metadata) |
| `search_artifacts` | Full-text + tag + type search across the gallery |
| `get_artifact` | Fetches full details including comments |
| `add_comment` | Posts a review comment on an artifact |
| `create_share_link` | Generates a time-limited public link |
| `summarize_feedback` | Returns an AI summary of all comments |
| `list_my_artifacts` | Lists the 50 most recent artifacts |

---

## Running tests

```bash
pnpm --filter @artifact-hub/api test        # run once
pnpm --filter @artifact-hub/api test:watch  # watch mode
```

Tests use [Vitest](https://vitest.dev) with Supabase and Anthropic fully mocked — no external services needed.

---

## Deployment

### API → Railway

1. Push the repo to GitHub
2. Create a new Railway project → **Deploy from GitHub repo**
3. Set the **root directory** to the repo root and **Dockerfile path** to `apps/api/Dockerfile`
4. Add environment variables from `.env` (Supabase + Anthropic keys + PORT)
5. Railway will build and deploy; the `/health` endpoint is the healthcheck

### Web → Vercel

1. Import the GitHub repo in Vercel
2. Set **Framework Preset** to Next.js
3. Override **Build Command** to: `cd ../.. && pnpm --filter @artifact-hub/web build`
4. Override **Output Directory** to: `apps/web/.next`
5. Add `NEXT_PUBLIC_API_URL` pointing at your Railway API URL

---

## Live deployment

- **Web:** https://artifact-hub.vercel.app *(update with your URL)*
- **API:** https://artifact-hub-api.railway.app *(update with your URL)*

---

## Tech stack

| Layer | Choice |
|-------|--------|
| API | Fastify 4 + TypeScript |
| Database | Supabase (PostgreSQL) |
| File storage | Supabase Storage |
| AI | Anthropic claude-sonnet-4-6 |
| Frontend | Next.js 14 App Router + Tailwind CSS |
| MCP | @modelcontextprotocol/sdk (stdio) |
| Monorepo | pnpm workspaces |
| Tests | Vitest |
| API deploy | Railway (Docker) |
| Web deploy | Vercel |
