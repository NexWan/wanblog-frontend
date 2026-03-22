"use client";

import { createBlog, updateBlog } from "@/lib/blog-data";
import type { BlogStatus } from "@/lib/blog-data";
import { startTransition, useEffect, useState } from "react";
import MarkdownPreview from "@/components/blog/MarkdownPreview";
import { getCurrentUser } from "aws-amplify/auth";
import {
  listBlogImages,
  type BlogMediaItem,
  createBlogId,
  publishDraftAssets,
  toAmplifyImageMarkdown,
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
  initialContentPath?: string;
  initialStatus?: BlogStatus;
  initialPublishedAt?: string | null;
};

export default function BlogEditorShell({
  initialBlogId,
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialTags = [],
  initialMarkdown = "",
  initialContentPath,
  initialStatus = "DRAFT",
  initialPublishedAt = null,
}: BlogEditorShellProps) {
  const isEditingExistingBlog = Boolean(initialBlogId);
  const [blogId, setBlogId] = useState(initialBlogId ?? "");
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [imageAltText, setImageAltText] = useState("Blog image");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState(
    "Draft assets will be written to S3 under the drafts prefix."
  );
  const [blogStatus, setBlogStatus] = useState<BlogStatus>(initialStatus);
  const [publishedAt, setPublishedAt] = useState<string | null>(initialPublishedAt);
  const [draftContentPath, setDraftContentPath] = useState<string | null>(initialContentPath ?? null);
  const [publishedContentPath, setPublishedContentPath] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [existingImages, setExistingImages] = useState<BlogMediaItem[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  async function refreshExistingImages(currentBlogId: string) {
    setIsLoadingImages(true);

    try {
      const images = await listBlogImages(currentBlogId);
      setExistingImages(images);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Loading existing images failed."));
    } finally {
      setIsLoadingImages(false);
    }
  }

  useEffect(() => {
    if (initialBlogId) {
      setBlogId(initialBlogId);
      return;
    }

    setBlogId((currentBlogId) => currentBlogId || createBlogId());
  }, [initialBlogId]);

  useEffect(() => {
    setBlogStatus(initialStatus);
    setPublishedAt(initialPublishedAt);
  }, [initialPublishedAt, initialStatus]);

  useEffect(() => {
    let isActive = true;

    async function loadImages() {
      if (!blogId) {
        return;
      }

      try {
        const images = await listBlogImages(blogId);

        if (isActive) {
          setExistingImages(images);
        }
      } catch (error) {
        if (isActive) {
          setStatusMessage(getErrorMessage(error, "Loading existing images failed."));
        }
      } finally {
        if (isActive) {
          setIsLoadingImages(false);
        }
      }
    }

    void loadImages();

    return () => {
      isActive = false;
    };
  }, [blogId]);

  function handleExistingImageInsert(image: BlogMediaItem) {
    const altText = imageAltText.trim() || image.altText;

    setMarkdown((currentMarkdown) => {
      const needsSpacing = currentMarkdown.length > 0 && !currentMarkdown.endsWith("\n");
      return `${currentMarkdown}${needsSpacing ? "\n\n" : ""}${toAmplifyImageMarkdown(image.path, altText)}\n`;
    });
    setStatusMessage(`Inserted existing ${image.scope} image from ${image.path} into markdown.`);
  }

  async function handleBlogRecordSave() {
    if (!blogId) {
      setStatusMessage("Generating a draft ID. Try again in a moment.");
      return;
    }

    const contentPathToSave =
      blogStatus === "PUBLISHED"
        ? publishedContentPath ?? (initialStatus === "PUBLISHED" ? initialContentPath ?? null : null)
        : draftContentPath ?? initialContentPath ?? publishedContentPath;

    if (!contentPathToSave) {
      setStatusMessage(
        blogStatus === "PUBLISHED"
          ? "Prepare publish assets before saving a published blog record."
          : "Save the draft markdown before saving the blog record."
      );
      return;
    }

    setIsWorking(true);

    try {
      const user = await getCurrentUser();
      const normalizedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const authorName = user.signInDetails?.loginId ?? user.username;
      const nextPublishedAt =
        blogStatus === "PUBLISHED" ? publishedAt ?? new Date().toISOString() : null;

      const blogPayload = {
        title,
        slug,
        excerpt: excerpt || null,
        tags: normalizedTags.length ? normalizedTags : null,
        contentPath: contentPathToSave,
        coverImagePath: null,
        authorName,
        authorUserId: user.userId,
        status: blogStatus,
        publishedAt: nextPublishedAt,
      };

      if (isEditingExistingBlog) {
        await updateBlog(blogId, blogPayload);
      } else {
        await createBlog({
          blogId,
          ...blogPayload,
        });
      }

      startTransition(() => {
        setPublishedAt(nextPublishedAt);
        setStatusMessage(
          isEditingExistingBlog
            ? `Blog record updated for ${authorName} as ${blogStatus}.`
            : `Blog record saved for ${authorName} as ${blogStatus}. Stored authorName plus authorUserId for future ownership and profile lookups.`
        );
      });
    } catch (error) {
      console.error("saveBlog failed", error);
      setStatusMessage(getErrorMessage(error, "Saving the blog record failed."));
    } finally {
      setIsWorking(false);
    }
  }

  async function handleImageUpload() {
    if (!blogId) {
      setStatusMessage("Generating a draft ID. Try again in a moment.");
      return;
    }

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
          `Image uploaded to ${result.path}. The markdown now stores an Amplify path reference.`
        );
      });
      await refreshExistingImages(blogId);
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Image upload failed."));
    } finally {
      setIsWorking(false);
    }
  }

  async function handleDraftSave() {
    if (!blogId) {
      setStatusMessage("Generating a draft ID. Try again in a moment.");
      return;
    }

    setIsWorking(true);

    try {
      const result = await uploadBlogMarkdown({
        blogId,
        markdown,
      });

      startTransition(() => {
        setDraftContentPath(result.path);
        setStatusMessage(
          `Draft markdown uploaded to ${result.path}. Next step: write or update the Blog record with this contentPath.`
        );
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Draft upload failed."));
    } finally {
      setIsWorking(false);
    }
  }

  async function handlePublish() {
    if (!blogId) {
      setStatusMessage("Generating a draft ID. Try again in a moment.");
      return;
    }

    setIsWorking(true);

    try {
      const result = await publishDraftAssets(blogId, markdown);

      startTransition(() => {
        setPublishedContentPath(result.contentPath);
        setBlogStatus("PUBLISHED");
        setStatusMessage(
          `Published assets prepared under blogs/${blogId}/... and the editor is now set to PUBLISHED.`
        );
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error, "Publish preparation failed."));
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[800px] border border-outline-variant/15 rounded-2xl overflow-hidden shadow-2xl editorial-shadow bg-surface-dim mt-8">
      {/* Left Side: Form & Editor */}
      <div className="w-full lg:w-1/2 overflow-y-auto border-r border-outline-variant/15 p-8 space-y-10 custom-scrollbar">
        {/* Metadata Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-primary mb-4">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold">Core Metadata</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">Article Title</label>
              <input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3 text-lg font-headline font-bold text-on-surface focus:ring-1 focus:ring-primary outline-none"
                placeholder="Enter a compelling headline..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">URL Slug</label>
                <div className="flex items-center bg-surface-container rounded-xl px-4 py-3 gap-2">
                  <input 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-body text-on-surface-variant w-full outline-none" 
                    placeholder="my-next-post"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">Record Status</label>
                <div className="flex items-center bg-surface-container rounded-xl px-4 py-3 gap-2">
                  <select
                    value={blogStatus}
                    onChange={(e) => setBlogStatus(e.target.value as BlogStatus)}
                    className="w-full appearance-none bg-transparent border-none text-sm font-body text-on-surface outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">Tags (Comma separated)</label>
                <div className="flex items-center bg-surface-container rounded-xl px-4 py-3 gap-2">
                  <input 
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-sm font-body text-on-surface w-full outline-none" 
                    placeholder="EDITORIAL, THEORY"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">Published Timestamp</label>
                <div className="flex min-h-[50px] items-center bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface-variant">
                  {publishedAt
                    ? new Date(publishedAt).toLocaleString()
                    : blogStatus === "PUBLISHED"
                      ? "Will be set when the record is saved."
                      : "Not published yet."}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant/60">Excerpt / Meta Description</label>
              <textarea 
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full bg-surface-container border-none rounded-xl px-4 py-3 text-sm font-body text-on-surface-variant focus:ring-1 focus:ring-primary outline-none"
                rows={2}
                placeholder="Short summary for list pages..."
              />
            </div>
          </div>
        </section>

        {/* Media Assets */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-tertiary mb-4">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold">Media Upload</h3>
          </div>
          <div className="bg-surface-container-low border border-outline-variant/10 rounded-xl p-6">
             <div className="grid gap-4 md:grid-cols-2 mb-4">
                <label className="grid gap-2 text-sm text-on-surface-variant">
                  <span className="font-label text-[10px] uppercase tracking-widest">Select Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                    className="block rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-xs"
                  />
                </label>
                <label className="grid gap-2 text-sm text-on-surface-variant">
                  <span className="font-label text-[10px] uppercase tracking-widest">Alt Text</span>
                  <input
                    value={imageAltText}
                    onChange={(event) => setImageAltText(event.target.value)}
                    className="rounded-lg border border-outline-variant/30 bg-surface-container px-3 py-2 text-xs outline-none focus:border-primary"
                    placeholder="Describe the image"
                  />
                </label>
             </div>
             <button
                type="button"
                onClick={handleImageUpload}
                disabled={isWorking}
                className="w-full rounded-lg border border-outline-variant/30 px-4 py-2 text-xs font-bold font-label tracking-widest text-on-surface transition hover:bg-surface-bright disabled:opacity-50"
              >
                Upload to Draft Media
              </button>

             {existingImages.length > 0 && (
               <div className="mt-6">
                 <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 border-t border-outline-variant/10 pt-4">Existing Assets</p>
                 <div className="grid gap-4 sm:grid-cols-2">
                   {existingImages.map((image) => (
                      <div key={image.path} className="border border-outline-variant/20 rounded-xl bg-surface-container overflow-hidden flex flex-col justify-between group">
                         {image.url ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img
                             src={image.url}
                             alt={image.altText}
                             className="h-32 w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                           />
                         ) : (
                           <div className="flex h-32 items-center justify-center bg-surface-container-low text-[10px] text-on-surface-variant font-label uppercase tracking-widest">
                             Preview unavailable
                           </div>
                         )}
                         <div className="p-3 flex flex-col gap-2">
                           <span className="text-[10px] truncate text-on-surface-variant font-mono">{image.path}</span>
                           <button
                             type="button"
                             onClick={() => handleExistingImageInsert(image)}
                             className="rounded bg-surface-bright px-3 py-2 text-xs text-on-surface hover:text-primary transition-colors text-center font-label uppercase tracking-wider w-full"
                           >
                             Insert
                           </button>
                         </div>
                      </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </section>

        {/* Action Bar */}
        <section className="space-y-6 pt-6 border-t border-outline-variant/15">
           <div className="flex flex-wrap gap-3">
             <button
                type="button"
                onClick={handleDraftSave}
                disabled={isWorking}
                className="rounded-lg border border-outline-variant/30 px-5 py-2.5 text-xs font-bold font-label tracking-widest text-on-surface transition hover:bg-surface-bright disabled:opacity-50"
              >
                Save Draft Markdown
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={isWorking}
                className="rounded-lg border border-tertiary/20 bg-tertiary/5 px-5 py-2.5 text-xs font-bold font-label tracking-widest text-tertiary transition hover:bg-tertiary/10 disabled:opacity-50"
              >
                Prepare Publish Assets
              </button>
              <button
                type="button"
                onClick={handleBlogRecordSave}
                disabled={
                  isWorking ||
                  (blogStatus === "PUBLISHED"
                    ? !publishedContentPath && !(initialStatus === "PUBLISHED" && initialContentPath)
                    : !draftContentPath && !initialContentPath && !publishedContentPath)
                }
                className="rounded-lg primary-gradient px-5 py-2.5 text-xs font-bold font-label tracking-widest text-on-primary transition hover:opacity-90 disabled:opacity-50 shadow-lg shadow-primary/20"
              >
                {isEditingExistingBlog ? `Update ${blogStatus}` : `Create ${blogStatus}`}
              </button>
           </div>
           
           <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/10 font-mono text-[10px] text-on-surface-variant">
              <p className="mb-2 text-primary">Session Log</p>
              <p>{statusMessage}</p>
           </div>
        </section>

        {/* Content Editor */}
        <section className="space-y-6 pt-4 border-t border-outline-variant/15">
          <div className="flex items-center gap-2 text-secondary mb-4">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold">Manuscript Content</h3>
          </div>
          <textarea 
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="w-full h-[600px] bg-surface-container-low border border-outline-variant/10 rounded-xl p-6 font-mono text-sm leading-relaxed text-on-surface focus:ring-1 focus:ring-primary custom-scrollbar outline-none"
            placeholder="Start writing your story in markdown..."
          />
        </section>
      </div>

      {/* Right Side: Live Preview */}
      <div className="w-full lg:w-1/2 overflow-y-auto bg-surface-container-lowest p-12 custom-scrollbar border-l border-outline-variant/15">
        <div className="max-w-2xl mx-auto">
          <div className="font-label text-[10px] uppercase tracking-[0.3em] text-primary mb-12 flex items-center gap-4">
            <span className="w-8 h-px bg-primary/30"></span>
            Live Preview
            <span className="w-8 h-px bg-primary/30"></span>
          </div>
          
          <MarkdownPreview source={markdown} />
        </div>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (Array.isArray(error)) {
    const messages: string = error
      .map((item) => getErrorMessage(item, ""))
      .filter(Boolean)
      .join(" | ");

    return messages ? `${fallback} ${messages}` : fallback;
  }

  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  if (error && typeof error === "object") {
    const record = error as {
      message?: unknown;
      errorType?: unknown;
      errors?: unknown;
    };

    const nestedErrors: string = Array.isArray(record.errors)
      ? record.errors
          .map((item) => getErrorMessage(item, ""))
          .filter(Boolean)
          .join(" | ")
      : "";

    const parts: string[] = [record.errorType, record.message, nestedErrors]
      .filter((value): value is string => typeof value === "string" && value.length > 0);

    if (parts.length) {
      return `${fallback} ${parts.join(" | ")}`;
    }
  }

  return fallback;
}
