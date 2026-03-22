"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveMarkdownAmplifyImages } from "@/lib/blog-storage";

type MarkdownPreviewProps = {
  source: string;
};

export default function MarkdownPreview({ source }: MarkdownPreviewProps) {
  const [renderedSource, setRenderedSource] = useState(source);

  useEffect(() => {
    let isActive = true;

    async function resolveSource() {
      if (!source.includes("amplify://")) {
        setRenderedSource(source);
        return;
      }

      try {
        const resolved = await resolveMarkdownAmplifyImages(source);

        if (isActive) {
          setRenderedSource(resolved);
        }
      } catch {
        if (isActive) {
          setRenderedSource(source);
        }
      }
    }

    void resolveSource();

    return () => {
      isActive = false;
    };
  }, [source]);

  return (
    <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Markdown Preview
          </p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-900">Live renderer</h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          react-markdown enabled
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-600">
        The preview now renders your markdown directly with
        <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">react-markdown</code>
        plus
        <code className="mx-1 rounded bg-zinc-100 px-2 py-1 text-xs">remark-gfm</code>
        so headings, lists, tables, and task lists behave like markdown instead of plain text.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => (
              <h1 className="mt-2 mb-4 text-3xl font-bold tracking-tight text-zinc-950" {...props} />
            ),
            h2: (props) => (
              <h2 className="mt-8 mb-3 text-2xl font-semibold tracking-tight text-zinc-900" {...props} />
            ),
            h3: (props) => (
              <h3 className="mt-6 mb-2 text-xl font-semibold text-zinc-900" {...props} />
            ),
            p: (props) => <p className="mb-4 leading-7 text-zinc-700" {...props} />,
            ul: (props) => <ul className="mb-4 list-disc space-y-2 pl-6 text-zinc-700" {...props} />,
            ol: (props) => <ol className="mb-4 list-decimal space-y-2 pl-6 text-zinc-700" {...props} />,
            li: (props) => <li className="leading-7" {...props} />,
            blockquote: (props) => (
              <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-700" {...props} />
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className;

              if (isInline) {
                return (
                  <code
                    className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm text-zinc-900"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }

              return (
                <code className="block overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-sm text-zinc-100" {...props}>
                  {children}
                </code>
              );
            },
            img: ({ src, alt, ...props }) => {
              if (!src) {
                return null;
              }

              return (
                // Presigned storage URLs are resolved at runtime, so a plain img keeps preview simple.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={alt ?? ""}
                  className="mb-4 rounded-2xl border border-zinc-200 shadow-sm"
                  {...props}
                />
              );
            },
          }}
        >
          {renderedSource}
        </Markdown>
      </div>
    </section>
  );
}
