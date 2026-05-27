import Link from 'next/link';

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-800/60 bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="text-sm font-semibold text-white transition-opacity hover:opacity-80"
        >
          Artifact Hub
        </Link>

        {/* Actions */}
        <Link
          href="/upload"
          className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-zinc-900 transition-all hover:bg-zinc-100 active:scale-[0.97]"
        >
          Upload
        </Link>
      </div>
    </header>
  );
}
