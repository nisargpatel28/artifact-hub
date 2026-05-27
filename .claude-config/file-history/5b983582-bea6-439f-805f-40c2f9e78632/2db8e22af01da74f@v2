# Artifact Hub — Feature Walkthrough

This document walks through every major user-facing feature of the platform, written as a reviewer's guide. Follow the steps in order on a locally running stack or against the live deployment.

**Prerequisites:** API running on `http://localhost:3001`, web on `http://localhost:3000`. If you haven't seeded demo data yet, run `pnpm seed` first.

---

## 1. Uploading an artifact via the web UI

### Goal
Publish a new artifact — in this case an HTML page — and let Claude auto-generate its metadata.

### Steps

1. Open `http://localhost:3000` in a browser.

2. Click **Upload** in the top-right corner of the navbar. You land on `/upload`.

3. **Set your API key.**  
   Near the top of the page you'll see the *API Key* section. Paste your key (e.g. `demo-api-key-12345`) and click **Save**. The section collapses to show a redacted confirmation. The key is stored in `localStorage` so you won't be asked again on this browser.

4. **Select a file.**  
   Drag any `.html`, `.jpg`, `.png`, `.pdf`, or `.gif` file onto the drop zone — or click it to open the file picker. Once a file is selected, the zone shows its name and size.

5. **Fill in metadata (or leave it blank).**  
   Below the drop zone is the *Metadata* section with three fields:
   - **Title** — leave blank and watch Claude generate one
   - **Description** — leave blank for AI generation
   - **Tags** — type a word and press **Enter** or **,** to add a chip; press **Backspace** to remove the last one

   There is a note: *"Leave title / description blank to auto-generate with AI"* — this is the behaviour we're about to test.

6. Click **Publish artifact**.  
   The button shows *Uploading…* while the file uploads to Supabase Storage, Claude analyses the content, and the row is written to the database. This typically takes 2–4 seconds.

7. On success, you are redirected to `/artifacts/{id}` — the detail page for the newly created artifact.

### What to look for
- If you left the title blank, notice that Claude generated a concise, descriptive title (≤ 60 chars).
- The tags appear as chips and reflect the actual content of the file.
- The artifact is immediately visible in the gallery.

---

## 2. Browsing and filtering the gallery

### Goal
Find specific artifacts using search and filters.

### Steps

1. Navigate to `http://localhost:3000` (the gallery).

2. **Hero section.** The page opens with the "Artifact Hub" headline and subtitle. Three columns of cards appear (two on tablet, one on mobile).

3. **Text search.**  
   Type *"mountain"* in the search bar. After a 300 ms debounce, the grid re-fetches and shows only artifacts whose title or description contains that word (case-insensitive `ilike` match).

4. **Type filter.**  
   Click **Image** in the segmented control to the right of the search bar. The grid now shows only image artifacts. Click **All** to reset.

5. **Tag filter.**  
   In the dashed tag input below the search bar, type *"demo"* and press **Enter**. A purple chip appears. The grid narrows to artifacts that have the `demo` tag. Add a second tag to see the AND behaviour. Click **×** on a chip to remove it; press **Backspace** in an empty input to pop the last chip.

6. **Load more.**  
   If there are more than 18 results, a *Load more (N remaining)* button appears at the bottom. Click it to append the next page without resetting filters.

7. **Empty state.**  
   Search for something that doesn't exist (e.g. *"zzzyyyxxx"*). The grid shows *"No artifacts found."* with a *Clear filters* link.

### What to look for
- Filters compose: search + type + tags all apply simultaneously.
- The result count (`N artifacts`) updates live below the filter bar.

---

## 3. Viewing an artifact and reading AI-generated metadata

### Goal
Inspect an artifact's full detail page, including the AI-enriched metadata.

### Steps

1. From the gallery, click any card to navigate to `/artifacts/{id}`.

2. **Viewer (left panel, 60%).**  
   - **HTML** artifacts render in a sandboxed `<iframe>` — scripts are allowed, but the frame cannot access the parent page's cookies or storage.
   - **Image** artifacts display with `<img>` and fill the panel.
   - **PDF** artifacts open directly in the browser's built-in PDF viewer via a second `<iframe>`.

3. **Metadata sidebar (right panel, 40%).**  
   Read the following fields:
   - **Type badge** — colour-coded: blue for HTML, green for image, red/rose for PDF.
   - **Title** — if AI-generated, notice how it is specific and ≤ 60 characters.
   - **Description** — 2–3 sentence summary of what the artifact is.
   - **Tags** — 3–6 lowercase tags; click one to search for it (navigates to `/?tag=…` — coming soon).
   - **Author / upload date** — at the bottom of the card.

4. **Breadcrumb.**  
   The "Gallery / {title}" breadcrumb at the top links back to the gallery without losing context.

### What to look for
- The sidebar is independently scrollable on tall pages.
- On mobile the viewer stacks above the sidebar.

---

## 4. Leaving a comment and viewing the AI feedback summary

### Goal
Add a reviewer comment and then ask Claude to summarise all feedback on the artifact.

### Steps

1. Scroll down in the right sidebar to the **Comments** section.

2. **Existing comments.**  
   If you ran `pnpm seed`, you'll see two pre-seeded reviewer comments on the first artifact, each showing the author email and a relative date.

3. **Add a comment.**  
   The *Add a comment* form appears below the comment list. If your API key is not set, you'll see a prompt to set it on the upload page.  
   - Type a review comment (e.g. *"The colour palette is very bold. Consider a lighter background for readability."*)
   - Click **Post comment**.
   - The comment is appended to the list immediately (optimistic update) without a page reload.

4. **AI feedback summary.**  
   Scroll back up to the action buttons. Click **AI Summary**.  
   - The sidebar expands a *Feedback Summary* section.
   - Three skeleton lines pulse while Claude processes.
   - After 1–2 seconds the summary appears: 2–3 sentences covering overall sentiment, key themes, and any action items.
   - Click **AI Summary** again to collapse the section. The summary is cached in component state — reopening it is instant.

5. **No-feedback state.**  
   On a fresh artifact with no comments, the summary reads *"No feedback yet."* without making an API call.

### What to look for
- Comments update the list instantly on POST; the page does not reload.
- The AI summary correctly synthesises multiple reviewer perspectives.
- Clicking AI Summary a second time before the first call completes does not fire a duplicate request (the toggle checks `summary !== null` first).

---

## 5. Creating a share link and opening it

### Goal
Generate a time-limited public URL and verify it works for an external viewer.

### Steps

1. On any artifact detail page, click the **Share** button (top of the action row).  
   The button shows *Creating…* while the API generates a token and stores it in `share_links`.

2. **Share modal.**  
   A frosted-glass overlay appears with:
   - The public URL (e.g. `https://your-api.railway.app/api/share/{token}`)
   - An expiry timestamp (*"Expires May 26, 3:45 PM"*)
   - A **Copy** button — click it to copy to clipboard; it flashes *"Copied!"* for 2 seconds

3. Close the modal by clicking outside it, pressing **Escape**, or clicking **×**.

4. **Open the share link.**  
   Paste the URL into a private/incognito window (simulating an external reviewer who has no API key). Navigate to `/share/{token}`:
   - A *"Shared via Artifact Hub"* banner appears at the top with a *Browse gallery →* link.
   - The artifact viewer and metadata are fully visible.
   - There are no upload, comment, or delete controls — this is a read-only view.

5. **Expired link behaviour.**  
   To test expiry, insert a `share_links` row with `expires_at` in the past via the Supabase SQL editor, then visit `/share/{that-token}`:
   - The page shows a lock icon, *"This link has expired"*, and a *Browse gallery* button.

### What to look for
- The share URL is routed to the API (`/api/share/:token`), not to the Next.js frontend directly.
- The frontend share page (`/share/:token`) resolves the token client-side by calling `GET /api/share/:token`.

---

## 6. Using Claude Desktop via MCP to publish and search artifacts

### Goal
Interact with the entire platform from inside a Claude conversation using the registered MCP tools.

### Prerequisites
- Built the MCP server: `pnpm build:mcp`
- Added the config from `apps/mcp/claude_mcp_config.json` to Claude Desktop's settings (see README)
- Restarted Claude Desktop

### Step-by-step conversation

Open Claude Desktop and start a new conversation. You should see **artifact-hub** listed in the tools panel (hammer icon).

---

**Step 1 — List what's in the gallery**

> *"What artifacts are currently in the hub?"*

Claude calls `list_my_artifacts`. It returns a formatted list:
```
3 artifacts in the hub:

• Mountain Landscape (image) [landscape, nature, mountains, demo]
  ID: a1b2c3d4-...
  A serene mountain landscape generated for demonstration purposes.

• Urban Cityscape (image) [city, urban, architecture, demo]
  ...
```

---

**Step 2 — Search with filters**

> *"Find image artifacts tagged with 'nature'."*

Claude calls `search_artifacts` with `{ type: "image", tags: ["nature"] }`. The response lists matching artifacts with their IDs, types, and descriptions.

---

**Step 3 — Inspect a specific artifact**

> *"Show me details for artifact {id from above}."*

Claude calls `get_artifact({ id: "..." })`. The response shows all fields plus the comment count:
```
ID:          a1b2c3d4-...
Title:       Mountain Landscape
Type:        image
Tags:        landscape, nature, mountains, demo
Description: A serene mountain landscape...
Author:      demo@artifacthub.com
Comments:    2
```

---

**Step 4 — Publish a new artifact**

> *"Publish this image as an artifact: https://picsum.photos/seed/aurora/800/600. It's an image. Don't add any title or description — let the AI figure it out."*

Claude calls `publish_artifact` with:
```json
{
  "fileUrl": "https://picsum.photos/seed/aurora/800/600",
  "type": "image"
}
```

The MCP server downloads the image and POSTs it to the API with no metadata. The API calls Claude (separately, server-side) to generate the title, description, and tags. The tool returns:
```
Artifact published!
ID: e5f6...
Title: Aurora Color Study
Tags: aurora, gradient, color, abstract
```

---

**Step 5 — Add a comment**

> *"Leave a comment on that artifact saying 'The gradient transitions are stunning — this works well for a hero section.'"*

Claude calls `add_comment({ artifactId: "e5f6...", comment: "The gradient transitions are stunning..." })`.  
Response: *"Comment added to 'Aurora Color Study'"*

---

**Step 6 — Summarise feedback**

> *"What's the overall feedback on that artifact?"*

Claude calls `summarize_feedback({ artifactId: "e5f6..." })`. The API fetches all comments and calls Claude again (server-side) to produce a 2–3 sentence summary. Claude surfaces that summary in the conversation.

---

**Step 7 — Create a share link**

> *"Create a share link for that artifact that expires in 48 hours."*

Claude calls `create_share_link({ artifactId: "e5f6...", expiresInHours: 48 })`.  
Response: *"Share link created: https://your-api.railway.app/api/share/abc123def456 (expires in 48 hours)"*

---

### What to look for in the MCP flow
- Every tool call is shown in Claude's tool-use panel — you can inspect the exact JSON arguments and responses.
- The "publish → auto-metadata" loop demonstrates Claude calling the API, which calls Claude internally to enrich content — a model-as-infrastructure pattern.
- All errors are returned as readable text (not thrown), so Claude can explain them and suggest fixes.
- None of the tools require the user to know any IDs in advance — they can discover artifacts via `list_my_artifacts` or `search_artifacts` first.
