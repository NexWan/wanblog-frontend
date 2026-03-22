export type BlogStatus = "DRAFT" | "PUBLISHED";

export type BlogCard = {
  blogId: string;
  title: string;
  slug: string;
  tags: string[];
  authorName: string;
  status: BlogStatus;
  publishedAt: string | null;
  contentPath: string;
};

export const placeholderBlogs: BlogCard[] = [
  {
    blogId: "blog-001",
    title: "Shipping Markdown Posts With Amplify",
    slug: "shipping-markdown-posts-with-amplify",
    tags: ["aws", "amplify", "markdown"],
    authorName: "Wan",
    status: "PUBLISHED",
    publishedAt: "2026-03-19T08:30:00.000Z",
    contentPath: "blogs/blog-001/content/post.md",
  },
  {
    blogId: "blog-002",
    title: "Drafting A Better Editor Flow",
    slug: "drafting-a-better-editor-flow",
    tags: ["product", "ux"],
    authorName: "Wan",
    status: "DRAFT",
    publishedAt: null,
    contentPath: "drafts/blog-002/content/post.md",
  },
];

export const placeholderMarkdown = `# Markdown Preview Shell

This component is intentionally light.

- Replace it with \`react-markdown\`
- Add \`remark-gfm\` for tables and task lists
- Reuse the same renderer in the editor preview and blog detail page

## Example checklist

- [x] Draft route structure
- [ ] Wire S3 upload
- [ ] Fetch markdown content from storage
`;
