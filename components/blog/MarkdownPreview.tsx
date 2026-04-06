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
    <div className="prose-editorial w-full max-w-none">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: ({ className, children, ...props }) => {
            const isInline = !className;

            if (isInline) {
              return (
                <code
                  className="rounded bg-surface-container-highest px-1.5 py-0.5 font-mono text-[13px] text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code className="block overflow-x-auto rounded-xl bg-surface-dim p-6 font-mono text-sm text-on-surface custom-scrollbar border border-outline-variant/10 my-8 shadow-inner" {...props}>
                {children}
              </code>
            );
          },
          img: ({ src, alt, ...props }) => {
            if (!src) return null;

            // Parse optional |size|fit suffix from alt text: "My caption|half|contain"
            const parts = (alt ?? "").split("|");
            const displayAlt = parts[0];
            const size = parts[1] ?? "full";
            const fit = parts[2] ?? "cover";

            const sizeClass: Record<string, string> = {
              full: "w-full",
              half: "w-1/2 mx-auto",
              quarter: "w-1/4 mx-auto",
              square: "w-full aspect-square",
            };
            const fitClass: Record<string, string> = {
              cover: "object-cover aspect-video",
              contain: "object-contain aspect-video bg-surface-container",
              none: "object-none h-auto",
            };

            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={displayAlt}
                className={`block my-12 rounded-2xl border border-outline-variant/10 shadow-2xl editorial-shadow ${sizeClass[size] ?? sizeClass.full} ${fitClass[fit] ?? fitClass.cover}`}
                {...props}
              />
            );
          },
        }}
      >
        {renderedSource}
      </Markdown>
    </div>
  );
}
