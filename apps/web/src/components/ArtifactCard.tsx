'use client';

import Link from 'next/link';
import type { Artifact } from '@artifact-hub/types';
import { useLike } from '@/hooks/useLike';

const TYPE_BADGE: Record<Artifact['type'], string> = {
  html:  'border-blue-500/30  bg-blue-500/10  text-blue-400',
  image: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  pdf:   'border-rose-500/30  bg-rose-500/10  text-rose-400',
};

function LikeButton({ artifactId }: { artifactId: string }) {
  const { liked, likeCount, toggleLike } = useLike(artifactId);

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggleLike(); }}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-1 text-xs transition-all duration-100 active:scale-90 ${
        liked ? 'text-rose-500' : 'text-zinc-500'
      }`}
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{likeCount}</span>
    </button>
  );
}

interface Props {
  artifact: Artifact;
}

export function ArtifactCard({ artifact }: Props) {
  const date = new Date(artifact.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <Link href={`/artifacts/${artifact.id}`} className="group block h-full">
      <article className="flex h-full flex-col rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-700 hover:shadow-xl hover:shadow-black/50">

        {/* Top row */}
        <header className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[artifact.type]}`}>
            {artifact.type.toUpperCase()}
          </span>
          <time className="shrink-0 text-xs text-zinc-500">{date}</time>
        </header>

        {/* Title */}
        <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-zinc-100 group-hover:text-white">
          {artifact.title}
        </h3>

        {/* Description */}
        {artifact.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {artifact.description}
          </p>
        )}

        {/* Bottom row: tags + like */}
        <footer className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex flex-wrap gap-1">
            {artifact.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                {tag}
              </span>
            ))}
            {artifact.tags.length > 4 && (
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                +{artifact.tags.length - 4}
              </span>
            )}
          </div>
          <LikeButton artifactId={artifact.id} />
        </footer>

      </article>
    </Link>
  );
}
