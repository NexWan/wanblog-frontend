"use client";

import { startTransition, useState } from "react";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import {
  createBlogId,
  publishDraftAssets,
  uploadBlogImage,
  uploadBlogMarkdown,
} from "@/lib/blog-storage";

type BlogEditorShellProps = {
  initialBlogId?: string;
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialTags?: string[];
  initialMarkdown?: string;
};

export default function BlogEditorShell({
  initialBlogId,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialTags = [],
  initialMarkdown = "",
}: BlogEditorShellProps) {
  const [blogId] = useState(initialBlogId || createBlogId());
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [imageAltText, setImageAltText] = useState("Blog image");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Draft assets will be written to S3 under the drafts prefix.",
  );
  const [draftContentPath, setDraftContentPath] = useState<string | null>(null);
  const [publishedContentPath, setPublishedContentPath] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function handleImageUpload() {
    if (!selectedImage) {
      setStatusMessage("Choose an image before uploading it to the draft media folder.");
      return;
    }

    setIsWorking(true);

    try {
      const result = await uploadBlogImage({
        blogId,
        file: selectedImage,
        altText: imageAltText,
      });

      startTransition(() => {
        setMarkdown((currentMarkdown) => {
          const needsSpacing = currentMarkdown.length > 0 && !currentMarkdown.endsWith("\n");
          return `${currentMarkdown}${needsSpacing ? "\n\n" : ""}${result.markdown}\n`;
        });
        setSelectedImage(null);
        setStatusMessage(
          `Image uploaded to ${result.path}. The markdown now stores an Amplify path reference.`,
        );
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Image upload failed."));
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDraftSave() {
    setIsWorking(true);

    try {
      const result = await uploadBlogMarkdown({
        blogId,
        markdown,
      });

      startTransition(() => {
        setDraftContentPath(result.path);
        setStatusMessage(
          `Draft markdown uploaded to ${result.path}. Next step: write or update the Blog record with this contentPath.`,
        );
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Draft upload failed."));
    } finally {
      setIsWorking(false);
    }
  }

  async function handlePublish() {
    setIsWorking(true);

    try {
      const result = await publishDraftAssets(blogId, markdown);

      startTransition(() => {
        setPublishedContentPath(result.contentPath);
        setStatusMessage(
          `Published assets prepared under blogs/${blogId}/... and the markdown now points at published media paths.`,
        );
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Publish preparation failed."));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
                placeholder="My next post"
              />
            </label>

            <label className="grid gap-2 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">Slug</span>
              <input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                className="rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
                placeholder="my-next-post"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium text-zinc-900">Excerpt</span>
            <textarea
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              className="min-h-24 rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
              placeholder="Short summary for list pages and previews"
            />
          </label>

          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium text-zinc-900">Tags</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
              placeholder="aws, amplify, nextjs"
            />
          </label>

          <label className="grid gap-2 text-sm text-zinc-700">
            <span className="font-medium text-zinc-900">Blog Content</span>
            <textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              className="min-h-80 rounded-2xl border border-zinc-300 px-4 py-3 font-mono text-sm outline-none transition focus:border-zinc-500"
              placeholder={"# Title\n\nWrite here..."}
            />
          </label>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_0.8fr]">
              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">Blog image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                  className="block rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
                />
              </label>

              <label className="grid gap-2 text-sm text-zinc-700">
                <span className="font-medium text-zinc-900">Alt text</span>
                <input
                  value={imageAltText}
                  onChange={(event) => setImageAltText(event.target.value)}
                  className="rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-zinc-500"
                  placeholder="Describe the image"
                />
              </label>
            </div>

            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Uploading an image inserts markdown like
              <code className="mx-1 rounded bg-white px-2 py-1 text-xs text-zinc-800">
                ![alt](amplify://drafts/...)
              </code>
              instead of a short-lived presigned URL.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleImageUpload}
              disabled={isWorking}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Upload image to draft media
            </button>

            <button
              type="button"
              onClick={handleDraftSave}
              disabled={isWorking}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save draft markdown
            </button>

            <button
              type="button"
              onClick={handlePublish}
              disabled={isWorking}
              className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Prepare publish assets
            </button>
          </div>

          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600">
            <p className="font-medium text-zinc-900">Current editor session</p>
            <p className="mt-2">blogId: {blogId}</p>
            <p>title: {title || "not set"}</p>
            <p>slug: {slug || "not set"}</p>
            <p>excerpt: {excerpt || "not set"}</p>
            <p>tags: {tags || "not set"}</p>
            <p>draft contentPath: {draftContentPath ?? "not uploaded yet"}</p>
            <p>published contentPath: {publishedContentPath ?? "not prepared yet"}</p>
            <p className="mt-3">{statusMessage}</p>
          </div>
        </div>
      </div>

      <MarkdownPreview source={markdown} />
    </section>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
}
