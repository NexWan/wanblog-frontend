# WanBlog Frontend

WanBlog Frontend is the web application for the WanBlog platform. It provides the public reading experience, a custom authentication flow, and an admin-only editorial workspace for creating, editing, and publishing blog posts backed by AWS Amplify.

The app is built with the Next.js App Router and integrates with an Amplify backend for authentication, data, and file storage. Public visitors can browse published content, while users in the `admin` Cognito group can manage draft and published posts from the admin area.

## What This Frontend Does

- Renders the public-facing homepage and blog listing.
- Provides a custom sign-in, sign-up, confirmation, and password reset experience.
- Protects admin routes using Amplify Auth and Cognito groups.
- Lets admins create, edit, and delete blog records.
- Uploads markdown and media assets to Amplify Storage.
- Publishes draft assets by moving content from draft storage paths to published storage paths.
- Reads blog metadata from Amplify Data and resolves stored markdown/media for display.

## Current App Areas

- `/`: marketing-style homepage and entry point into the blog.
- `/blog`: blog index for public readers, with admin-aware behavior when applicable.
- `/auth`: custom authentication UI wired to Amplify Auth.
- `/admin`: protected admin landing page.
- `/admin/blogs`: admin blog management list.
- `/admin/blogs/new`: blog creation flow.
- `/admin/blogs/[id]/edit`: blog editing flow with markdown and media handling.

## Stack

### Framework and Language

- Next.js 16 with the App Router
- React 19
- TypeScript

### Styling and UI

- Tailwind CSS 4
- DaisyUI
- Ant Design Icons

### AWS / Backend Integration

- AWS Amplify Gen 2
- `aws-amplify`
- `@aws-amplify/adapter-nextjs`
- `@aws-amplify/ui-react`

### Content Rendering

- `react-markdown`
- `remark-gfm`

### Tooling

- ESLint 9
- Bun for Amplify build/deploy workflows
- npm scripts for local development commands

## Architecture Overview

This frontend talks to an Amplify backend that currently defines:

- `Blog` records for post metadata and publishing state
- `Comment` records for reader discussion
- `Like` records for engagement

For blog content itself, the frontend uses a split model:

- Structured metadata such as title, slug, tags, author, status, and `contentPath` lives in Amplify Data.
- Markdown files and uploaded images live in Amplify Storage.

Draft and published assets are separated by storage prefix:

- Drafts: `drafts/<blogId>/...`
- Published posts: `blogs/<blogId>/...`

When an admin publishes content, the frontend copies referenced media from the draft path to the published path and writes the final markdown file under the published prefix.

## Authentication and Access Control

Authentication is powered by Amplify Auth and Cognito. The frontend includes a custom auth screen instead of relying on a default hosted UI.

Access rules in practice:

- Public users can read public blog content.
- Admin-only routes call server-side guards that check whether the current user belongs to the `admin` group.
- Admin users can create, update, and delete blog records.

The app configures Amplify on both the server and client side so auth, data, and storage calls work consistently in App Router pages and client components.

## Key Frontend Implementation Details

- Server-side data access uses the Next.js Amplify adapter with cookies.
- Client-side Amplify configuration is injected from `amplify_outputs.json`.
- The app clears stale cached Amplify auth keys when configuration fingerprints change.
- Blog editing is markdown-first.
- Image references inside markdown use an internal `amplify://` protocol before being resolved to signed URLs.
- Admin list deletion currently removes the blog record only; it does not yet clean up related storage assets.

## Project Structure

```text
app/
  auth/                  Custom authentication route
  blog/                  Public blog pages
  admin/                 Protected admin pages
components/
  auth/                  Auth UI
  blog/                  Blog admin/editor UI
lib/
  auth.ts                Group checks and admin guards
  blog-data.ts           Client-side Amplify Data mutations
  blog-data.server.ts    Server-side Amplify Data reads
  blog-storage.ts        Storage upload/publish helpers
  blog-storage.server.ts Server-side storage reads
  amplifyServerUtils.ts  Server-side Amplify runner
```

## Local Development

### Prerequisites

- Node.js 20+
- npm or Bun
- Access to the matching Amplify backend
- A valid `amplify_outputs.json` file in the frontend root

### Install dependencies

```bash
npm install
```

Or, if you prefer Bun:

```bash
bun install
```

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

### Lint

```bash
npm run lint
```

## Amplify Configuration

This app expects Amplify outputs to be available locally. The frontend imports `amplify_outputs.json`, and the production Amplify pipeline also regenerates outputs during the backend build phase.

The checked-in build setup in [`amplify.yml`](amplify.yml) does the following:

- Installs Bun
- Installs dependencies with `bun install`
- Generates Amplify outputs with `ampx generate outputs`
- Builds the Next.js app with `bun run build`

Because `.env*` files and `amplify_outputs.json` are ignored by git, each environment should provide its own configuration at build or runtime as needed.

## Deployment

The frontend is designed to be deployed with AWS Amplify Hosting.

At a high level:

1. Amplify builds the backend-related outputs for the target branch.
2. The frontend consumes the generated outputs.
3. Next.js is built into `.next`.
4. Amplify serves the built application.

## TODO / Missing Features

Based on the current frontend and backend code, these are the main features that still appear to be missing or only partially implemented:

- Comments UI and workflows
- Like button and like-count display
- Public blog post detail experience polished end-to-end
- User profile customization
- Richer blog image controls
- Better authoring ergonomics and publishing safeguards
- Storage cleanup and content lifecycle management

### Reader Features

- Build the full comments experience on post pages using the existing backend `Comment` model.
- Add comment creation, edit/delete rules in the UI where allowed, and comment list rendering per blog post.
- Add likes to the frontend using the existing backend `Like` model.
- Show per-post like counts and whether the current user has already liked a post.
- Add post detail interactions beyond the current shell behavior, including comments, likes, related posts, and better metadata presentation.

### User Profile Features

- Add profile photo upload and display.
- Let users update visible names such as display name and given name after signup.
- Add a basic profile settings page for account personalization.
- Surface author profile information on blog cards and post pages once profile data exists.

### Editorial and Media Features

- Support cover image selection for blog records instead of leaving `coverImagePath` unused.
- Add image customization controls in the editor, such as width, alignment, fill mode, caption text, and responsive display behavior.
- Improve markdown media authoring so inserted images can carry presentation options instead of only alt text and storage path.
- Add slug validation, duplicate-slug handling, and stronger publish-time validation.
- Add autosave or draft recovery to reduce the chance of losing in-progress edits.
- Improve status handling so publishing feels like a single guided workflow instead of several manual steps.

### Platform and Maintenance Features

- Delete related markdown and media assets from storage when a blog is deleted.
- Add frontend support for backend model growth, especially if comments, likes, and profiles expand.
- Add tests for auth guards, blog CRUD flows, publish flow, and storage path handling.
- Tighten environment/setup documentation around `amplify_outputs.json`, auth groups, and local developer onboarding.

## Notes and Limitations

- The homepage and some copy still read like an evolving product shell, which is expected at the current stage.
- Public post detail rendering exists as part of the architecture, but the app is still clearly in active iteration.
- Storage cleanup for deleted blogs is not implemented yet.
- The backend already includes comments and likes, but this frontend currently focuses mostly on blog browsing, auth, and editorial management.

## Related Backend Concepts

The frontend assumes the Amplify backend provides:

- Cognito auth with an `admin` group
- Data models for blogs, comments, and likes
- Storage for markdown and media assets
- Identity-based public read access where configured

If those backend resources change, update the frontend helpers under [`lib/`](/Users/leonardocontrerasmartinez/Documents/projects/wanblog/wanblog-frontend/lib) and refresh `amplify_outputs.json`.
