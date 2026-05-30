'use client';

import { useCallback, useEffect, useState } from 'react';

function seededCount(artifactId: string): number {
  let hash = 0;
  for (let i = 0; i < artifactId.length; i++) {
    hash = (hash << 5) - hash + artifactId.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 22) + 3; // 3–24
}

const storageKey = (id: string) => `artifact-like-${id}`;

interface LikeState {
  liked: boolean;
  count: number;
}

export function useLike(artifactId: string) {
  const [state, setState] = useState<LikeState>({
    liked: false,
    count: seededCount(artifactId),
  });

  useEffect(() => {
    const raw = localStorage.getItem(storageKey(artifactId));
    if (raw) setState(JSON.parse(raw) as LikeState);
  }, [artifactId]);

  const toggleLike = useCallback(() => {
    setState(prev => {
      const next: LikeState = {
        liked: !prev.liked,
        count: prev.liked ? prev.count - 1 : prev.count + 1,
      };
      localStorage.setItem(storageKey(artifactId), JSON.stringify(next));
      return next;
    });
  }, [artifactId]);

  return { liked: state.liked, likeCount: state.count, toggleLike };
}
