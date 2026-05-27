'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, storeApiKey } from '@/lib/api';
import { useApiKey } from '@/contexts/ApiKeyContext';

type UploadType = 'html' | 'image' | 'pdf';

const ACCEPT = '.html,.htm,.pdf,.jpg,.jpeg,.png,.gif,.webp';

const EXT_TO_TYPE: Record<string, UploadType> = {
  html: 'html', htm: 'html',
  pdf:  'pdf',
  jpg:  'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
};

function guessType(file: File): UploadType | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_TYPE[ext] ?? null;
}

export default function UploadPage() {
  const router = useRouter();
  const { apiKey, setApiKey } = useApiKey();

  // API key local draft (so saving is explicit)
  const [apiKeyDraft, setApiKeyDraft] = useState('');

  // File
  const [file, setFile]       = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata
  const [type, setType]             = useState<UploadType>('html');
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags]             = useState<string[]>([]);
  const [tagInput, setTagInput]     = useState('');

  // Submit state
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── File handling ─────────────────────────────────────────────────────────

  function handleFile(f: File) {
    setFile(f);
    const t = guessType(f);
    if (t) setType(t);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  // ── Tag handling ──────────────────────────────────────────────────────────

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags(prev => [...prev, tag]);
    setTagInput('');
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append('file', file, file.name);
    form.append('type', type);
    if (title.trim())       form.append('title', title.trim());
    if (description.trim()) form.append('description', description.trim());
    if (tags.length)        form.append('tags', tags.join(','));

    try {
      const artifact = await api.artifacts.create(form);
      router.push(`/artifacts/${artifact.id}`);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">

      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload artifact</h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Share HTML, images, or PDFs. Leave title and description blank to auto-generate with AI.
        </p>
      </div>

      {/* ── API key ─────────────────────────────────────────────────────── */}
      <section className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">
          API Key
        </h2>
        {apiKey ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-400">
              Key set: <span className="font-mono text-zinc-300">{apiKey.slice(0, 8)}…</span>
            </p>
            <button
              onClick={() => { setApiKey(''); setApiKeyDraft(''); }}
              className="text-xs text-zinc-500 hover:text-rose-400"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste your API key…"
              value={apiKeyDraft}
              onChange={e => setApiKeyDraft(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600"
            />
            <button
              onClick={() => { if (apiKeyDraft.trim()) setApiKey(apiKeyDraft); }}
              disabled={!apiKeyDraft.trim()}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── File drop zone ───────────────────────────────────────────── */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
            File <span className="text-rose-400">*</span>
          </label>
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/5'
                : file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />

            {file ? (
              <div className="flex flex-col items-center gap-2 text-center">
                <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                </svg>
                <p className="text-sm font-medium text-zinc-200">{file.name}</p>
                <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="mt-1 text-xs text-zinc-500 hover:text-rose-400"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
                <div>
                  <p className="text-sm text-zinc-400">
                    {dragOver ? 'Drop it here' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">HTML, PDF, JPG, PNG, GIF, WebP</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Type selector ────────────────────────────────────────────── */}
        {file && (
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Type
            </label>
            <div className="flex gap-2">
              {(['html', 'image', 'pdf'] as UploadType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-medium capitalize transition-all ${
                    type === t
                      ? 'border-indigo-500/60 bg-indigo-500/10 text-indigo-400'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Metadata ─────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">Metadata</h2>
            <span className="text-xs text-zinc-600">Leave blank for AI generation</span>
          </div>

          <div className="mt-4 space-y-4">
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">Title</label>
              <input
                type="text"
                placeholder="Auto-generated if blank…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={60}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">Description</label>
              <textarea
                placeholder="Auto-generated if blank…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-xs text-zinc-400">Tags</label>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 focus-within:border-zinc-600 focus-within:ring-1 focus-within:ring-zinc-600">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setTags(prev => prev.filter(t => t !== tag))}
                      className="text-zinc-500 hover:text-zinc-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder={tags.length ? '' : 'Add tags (Enter or comma)…'}
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
                  className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-600 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={!file || !apiKey || loading}
          className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Uploading…' : 'Publish artifact'}
        </button>

        {!apiKey && (
          <p className="text-center text-xs text-zinc-500">
            An API key is required to upload.
          </p>
        )}
      </form>

      <div className="h-16" />
    </div>
  );
}
