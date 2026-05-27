import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      {/* Large 404 */}
      <p className="bg-gradient-to-b from-zinc-600 to-zinc-800 bg-clip-text text-8xl font-bold tracking-tighter text-transparent select-none">
        404
      </p>

      <h1 className="mt-4 text-lg font-semibold text-white">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-zinc-500">
        The page you are looking for does not exist or has been moved.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-white px-5 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          Back to gallery
        </Link>
        <Link
          href="/upload"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          Upload artifact
        </Link>
      </div>
    </div>
  );
}
