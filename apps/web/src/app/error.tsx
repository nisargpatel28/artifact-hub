'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // Log to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
        <svg
          className="h-7 w-7 text-zinc-500"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        {error.message || 'An unexpected error occurred.'}
        {error.digest && (
          <span className="ml-1 font-mono text-xs text-zinc-600">({error.digest})</span>
        )}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
