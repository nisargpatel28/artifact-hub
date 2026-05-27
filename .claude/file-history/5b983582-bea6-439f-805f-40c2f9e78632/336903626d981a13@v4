'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ArtifactCard } from '@/components/ArtifactCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { api } from '@/lib/api';
import type { Artifact } from '@artifact-hub/types';

const ARTIFACT_TYPES = ['all', 'html', 'image', 'pdf'] as const;
type TypeFilter = (typeof ARTIFACT_TYPES)[number];

const PAGE_SIZE = 18;

export default function GalleryPage() {
  const [artifacts, setArtifacts]     = useState<Artifact[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch]           = useState('');
  const [type, setType]               = useState<TypeFilter>('all');
  const [tags, setTags]               = useState<string[]>([]);
  const [tagInput, setTagInput]       = useState('');
  const [offset, setOffset]           = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchArtifacts = useCallback(
    async (off: number, append: boolean) => {
      try {
        const result = await api.artifacts.list({
          search: search || undefined,
          type:   type === 'all' ? undefined : type,
          tags:   tags.length ? tags : undefined,
          limit:  PAGE_SIZE,
          offset: off,
        });
        setArtifacts(prev => append ? [...prev, ...result.artifacts] : result.artifacts);
        setTotal(result.total);
      } catch {
        // Keep existing results on error
      }
    },
    [search, type, tags],
  );

  // Re-fetch when filters change (debounced for search)
  useEffect(() => {
    setLoading(true);
    setOffset(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await fetchArtifacts(0, false);
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchArtifacts]);

  async function loadMore() {
    const next = offset + PAGE_SIZE;
    setLoadingMore(true);
    await fetchArtifacts(next, true);
    setOffset(next);
    setLoadingMore(false);
  }

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  }

  const hasMore = offset + PAGE_SIZE < total;
  const noResults = !loading && artifacts.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

      {/* ── Hero ── */}
      <section className="pb-12 pt-20 text-center">
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          Artifact Hub
        </h1>
        <p className="mt-4 text-lg text-zinc-500">
          Browse and share AI-generated content
        </p>
      </section>

      {/* ── Filters ── */}
      <div className="mb-8 space-y-3">
        {/* Search + type */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search artifacts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          {/* Type segmented control */}
          <div className="flex shrink-0 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
            {ARTIFACT_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  type === t
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tag filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400"
            >
              {tag}
              <button
                onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                className="text-indigo-400/60 transition hover:text-indigo-300"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Filter by tag…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag(tagInput);
              } else if (e.key === 'Backspace' && !tagInput && tags.length) {
                setTags(prev => prev.slice(0, -1));
              }
            }}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
            className="rounded-lg border border-dashed border-zinc-700 bg-transparent px-3 py-1 text-xs text-zinc-400 placeholder-zinc-600 outline-none transition focus:border-zinc-500 focus:placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && total > 0 && (
        <p className="mb-5 text-xs text-zinc-500">
          {total} artifact{total !== 1 ? 's' : ''}
          {search ? ` for "${search}"` : ''}
        </p>
      )}

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
          : artifacts.map(a => <ArtifactCard key={a.id} artifact={a} />)
        }
      </div>

      {/* Empty state */}
      {noResults && (
        <div className="py-32 text-center">
          <p className="text-sm text-zinc-500">No artifacts found.</p>
          {(search || tags.length || type !== 'all') && (
            <button
              onClick={() => { setSearch(''); setTags([]); setType('all'); }}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="py-12 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-6 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingMore ? 'Loading…' : `Load more (${total - artifacts.length} remaining)`}
          </button>
        </div>
      )}

      <div className="h-20" />
    </div>
  );
}
