'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Artifact } from '@artifact-hub/types';

export default function GalleryPage() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.artifacts.list({ limit: 20 })
      .then(res => setArtifacts(res.artifacts))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Artifact Hub</h1>
        <p className="text-zinc-400">Browse and share AI-generated content</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded mb-3 w-16" />
              <div className="h-5 bg-zinc-800 rounded mb-2" />
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          Failed to load artifacts: {error}
        </div>
      )}

      {!loading && !error && artifacts.length === 0 && (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-4">No artifacts yet.</p>
          <Link href="/upload"
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">
            Upload the first one
          </Link>
        </div>
      )}

      {!loading && artifacts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {artifacts.map(a => (
            <Link key={a.id} href={`/artifacts/${a.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-all hover:-translate-y-0.5 block">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  a.type === 'html'  ? 'bg-blue-500/20 text-blue-400' :
                  a.type === 'pdf'   ? 'bg-rose-500/20 text-rose-400' :
                                       'bg-emerald-500/20 text-emerald-400'
                }`}>{a.type}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(a.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="font-semibold text-white mb-1 line-clamp-1">{a.title}</h2>
              <p className="text-sm text-zinc-400 line-clamp-2">{a.description}</p>
              {a.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {a.tags.slice(0, 3).map(tag => (
                    <span key={tag}
                      className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
