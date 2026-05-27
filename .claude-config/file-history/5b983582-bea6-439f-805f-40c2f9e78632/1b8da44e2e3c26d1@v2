'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Artifact } from '@artifact-hub/types';

const TYPE_BADGE: Record<Artifact['type'], string> = {
  html:  'border-blue-500/30  bg-blue-500/10  text-blue-400',
  image: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  pdf:   'border-rose-500/30  bg-rose-500/10  text-rose-400',
};

export default function SharePage() {
  const { token } = useParams<{ token: string }>();

  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [loading, setLoading]   = useState(true);
  const [expired, setExpired]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.share.resolve(token)
      .then(a => setArtifact(a))
      .catch(err => {
        const msg = (err as Error).message.toLowerCase();
        if (msg.includes('expired') || msg.includes('not found')) {
          setExpired(true);
        } else {
          setError((err as Error).message);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-indigo-500" />
      </div>
    );
  }

  // ── Expired / not found ────────────────────────────────────────────────────
  if (expired || error || !artifact) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
          <svg className="h-7 w-7 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-white">
          {expired ? 'This link has expired' : 'Link not found'}
        </h1>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          {expired
            ? 'The owner can generate a new share link from the artifact page.'
            : error ?? 'This share link does not exist.'}
        </p>
        <Link
          href="/"
          className="mt-6 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          Browse gallery
        </Link>
      </div>
    );
  }

  // ── Artifact viewer ────────────────────────────────────────────────────────
  const date = new Date(artifact.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Shared-via banner */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2.5">
        <p className="text-xs text-zinc-500">
          Shared via <span className="text-zinc-400">Artifact Hub</span>
        </p>
        <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300">
          Browse gallery →
        </Link>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">

        {/* Viewer */}
        <div
          className="min-h-[420px] flex-[3] lg:sticky lg:top-20 lg:self-start"
          style={{ height: 'calc(100vh - 10rem)' }}
        >
          {artifact.type === 'image' ? (
            <img
              src={artifact.storageUrl}
              alt={artifact.title}
              className="h-full w-full rounded-xl object-contain"
            />
          ) : (
            <iframe
              src={artifact.storageUrl}
              title={artifact.title}
              className="h-full w-full rounded-xl border border-zinc-800 bg-zinc-900"
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>

        {/* Metadata */}
        <aside className="flex-[2]">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-start justify-between gap-3">
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[artifact.type]}`}>
                {artifact.type.toUpperCase()}
              </span>
              <time className="text-xs text-zinc-500">{date}</time>
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
        </aside>

      </div>
      <div className="h-16" />
    </div>
  );
}
