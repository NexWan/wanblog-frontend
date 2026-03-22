type MarkdownPreviewProps = {
  source: string;
};

export default function MarkdownPreview({ source }: MarkdownPreviewProps) {
  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Markdown Preview Shell
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">Renderer placeholder</h2>
        </div>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          Swap in react-markdown
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600">
        This shell keeps the future component boundary in place. Replace the
        <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">pre</code>
        block below with a shared
        <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">react-markdown</code>
        renderer plus
        <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">remark-gfm</code>
        once you build the real preview.
      </p>

      <pre className="mt-6 overflow-x-auto rounded-2xl bg-zinc-950 p-5 text-sm leading-6 text-zinc-100">
        <code>{source}</code>
      </pre>
    </section>
  );
}
