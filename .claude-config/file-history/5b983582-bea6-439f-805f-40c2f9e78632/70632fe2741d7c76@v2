'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useApiKey } from '@/contexts/ApiKeyContext';
import type { Artifact, Comment } from '@artifact-hub/types';

// ─── Sub-components ───────────────────────────────────────────────────────────

const TYPE_BADGE: Record<Artifact['type'], string> = {
  html:  'border-blue-500/30  bg-blue-500/10  text-blue-400',
  image: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  pdf:   'border-rose-500/30  bg-rose-500/10  text-rose-400',
};

function ArtifactViewer({ artifact }: { artifact: Artifact }) {
  if (artifact.type === 'image') {
    return (
      <img
        src={artifact.storageUrl}
        alt={artifact.title}
        className="h-full w-full rounded-xl object-contain"
      />
    );
  }
  return (
    <iframe
      src={artifact.storageUrl}
      title={artifact.title}
      className="h-full w-full rounded-xl border border-zinc-800 bg-zinc-900"
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function ShareModal({
  shareUrl,
  expiresAt,
  onClose,
}: {
  shareUrl: string;
  expiresAt: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function copy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const expiry = new Date(expiresAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white">Share this artifact</h3>
            <p className="mt-1 text-xs text-zinc-500">Expires {expiry}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            ref={inputRef}
            readOnly
            value={shareUrl}
            onFocus={() => inputRef.current?.select()}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 outline-none focus:border-zinc-600"
          />
          <button
            onClick={copy}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-indigo-500 text-white hover:bg-indigo-400'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type ArtifactWithComments = Artifact & { comments: Comment[] };

export default function ArtifactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { apiKey } = useApiKey();

  const [artifact, setArtifact]       = useState<ArtifactWithComments | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Share
  const [shareModal, setShareModal]   = useState(false);
  const [shareUrl, setShareUrl]       = useState('');
  const [shareExpiry, setShareExpiry] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  // AI Summary
  const [summary, setSummary]         = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Comments
  const [commentBody, setCommentBody] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.artifacts.get(id)
      .then(data => setArtifact(data))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    if (!id) return;
    setShareLoading(true);
    try {
      const result = await api.share.create(id, 24);
      setShareUrl(result.url);
      setShareExpiry(result.expiresAt);
      setShareModal(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleSummary() {
    if (!id) return;
    setSummaryOpen(open => !open);
    if (summary !== null) return; // already fetched
    setSummaryLoading(true);
    try {
      const result = await api.comments.summary(id);
      setSummary(result.summary);
    } catch (err) {
      setSummary(`Failed to load summary: ${(err as Error).message}`);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const newComment = await api.comments.create(id, commentBody.trim());
      setArtifact(prev => prev ? { ...prev, comments: [...prev.comments, newComment] } : prev);
      setCommentBody('');
    } catch (err) {
      setCommentError((err as Error).message);
    } finally {
      setCommentLoading(false);
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="mx-auto flex h-[80vh] max-w-7xl items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="mx-auto flex h-[80vh] max-w-7xl flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-zinc-400">{error ?? 'Artifact not found.'}</p>
        <Link href="/" className="mt-4 text-sm text-indigo-400 hover:text-indigo-300">
          ← Back to gallery
        </Link>
      </div>
    );
  }

  const uploadDate = new Date(artifact.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <>
      {shareModal && (
        <ShareModal
          shareUrl={shareUrl}
          expiresAt={shareExpiry}
          onClose={() => setShareModal(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-300">Gallery</Link>
          <span>/</span>
          <span className="text-zinc-300 line-clamp-1">{artifact.title}</span>
        </nav>

        <div className="flex flex-col gap-8 lg:flex-row">

          {/* ── Left: viewer (60%) ──────────────────────────────────────── */}
          <div className="min-h-[420px] flex-[3] lg:sticky lg:top-20 lg:self-start" style={{ height: 'calc(100vh - 7rem)' }}>
            <ArtifactViewer artifact={artifact} />
          </div>

          {/* ── Right: sidebar (40%) ────────────────────────────────────── */}
          <aside className="flex-[2] space-y-6 overflow-y-auto">

            {/* Metadata */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-start justify-between gap-3">
                <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[artifact.type]}`}>
                  {artifact.type.toUpperCase()}
                </span>
                <time className="text-xs text-zinc-500">{uploadDate}</time>
              </div>

              <h1 className="mt-3 text-xl font-semibold text-white">{artifact.title}</h1>

              {artifact.description && (
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{artifact.description}</p>
              )}

              {artifact.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {artifact.tags.map(tag => (
                    <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-4 text-xs text-zinc-600">
                by <span className="text-zinc-500">{artifact.authorEmail}</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                disabled={shareLoading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 1 0 0-2.684 3 3 0 0 0 0 2.684z" />
                </svg>
                {shareLoading ? 'Creating…' : 'Share'}
              </button>

              <button
                onClick={handleSummary}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" />
                </svg>
                AI Summary
              </button>
            </div>

            {/* AI Summary collapsible */}
            {summaryOpen && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Feedback Summary
                </h3>
                {summaryLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-800" />
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed text-zinc-300">{summary}</p>
                )}
              </div>
            )}

            {/* Comments */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Comments ({artifact.comments.length})
              </h3>

              {artifact.comments.length === 0 ? (
                <p className="text-xs text-zinc-600">No comments yet. Be the first.</p>
              ) : (
                <div className="space-y-4">
                  {artifact.comments.map(c => (
                    <div key={c.id} className="border-t border-zinc-800 pt-4 first:border-0 first:pt-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-zinc-300">{c.authorEmail}</span>
                        <time className="text-xs text-zinc-600">
                          {new Date(c.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </time>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{c.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment form */}
              <div className="mt-5 border-t border-zinc-800 pt-5">
                {!apiKey ? (
                  <p className="text-xs text-zinc-500">
                    <Link href="/upload" className="text-indigo-400 hover:text-indigo-300">
                      Set your API key
                    </Link>{' '}
                    on the upload page to leave a comment.
                  </p>
                ) : (
                  <form onSubmit={handleAddComment} className="space-y-3">
                    <textarea
                      value={commentBody}
                      onChange={e => setCommentBody(e.target.value)}
                      placeholder="Add a comment…"
                      rows={3}
                      className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
                    />
                    {commentError && (
                      <p className="text-xs text-rose-400">{commentError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={commentLoading || !commentBody.trim()}
                      className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {commentLoading ? 'Posting…' : 'Post comment'}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </aside>
        </div>
      </div>
    </>
  );
}
