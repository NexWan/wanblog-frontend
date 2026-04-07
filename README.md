# WanBlog Frontend

WanBlog Frontend is the web application for the WanBlog platform. It provides the public reading experience, a custom authentication flow, user profiles, and an admin-only editorial workspace for creating, editing, and publishing blog posts backed by AWS Amplify.

The app is built with the Next.js App Router and integrates with an Amplify backend for authentication, data, and file storage. Public visitors and unauthenticated users can browse and read all published content. Registered users can like posts and leave comments. Admins can manage the full content lifecycle from the admin area.

## What This Frontend Does

- Renders the public-facing homepage with real blog data, dynamic tag discovery, and a featured posts grid.
- Provides a blog listing page with live search by title, tag filtering, and sorting by date or like count.
- Renders full blog post detail pages with markdown content, inline images, comments, likes, and author info.
- Shows user profile pages with avatar, bio, social links, and a grid of their published posts.
- Lets users edit their own profile including display name, bio, avatar photo, and social link URLs.
- Provides a custom sign-in, sign-up, confirmation, and password reset experience.
- Protects admin routes using Amplify Auth and Cognito groups.
- Lets admins create, edit, and publish blog posts with a side-by-side markdown editor and live preview.
- Uploads markdown and media assets to Amplify Storage, with controls for image size and fill mode.
- Publishes draft assets by copying content from draft storage paths to published paths.
- Serves public pages with ISR and `unstable_cache` so repeat visits are fast without stale data.
- Busts the cache on demand whenever an admin publishes or updates a post or profile.

## App Areas

| Route | Description |
|---|---|
| `/` | Homepage with latest posts, dynamic tags sidebar, and hero section |
| `/blog` | Blog listing with search, tag filter, and sort controls |
| `/blog/[slug]` | Full blog post with markdown rendering, comments, and likes |
| `/user/[username]` | Public user profile with bio, socials, and published posts |
| `/user/[username]/edit` | Profile editor for display name, bio, avatar, socials, password |
| `/auth` | Custom authentication UI |
| `/admin` | Protected admin dashboard |
| `/admin/blogs` | Admin blog management list |
| `/admin/blogs/new` | Blog creation flow |
| `/admin/blogs/[id]/edit` | Blog editor with markdown, live preview, media handling |
| `/api/revalidate` | Protected POST endpoint for external on-demand cache invalidation |

## Stack

### Framework and Language

- Next.js 16 with the App Router
- React 19
- TypeScript

### Styling and UI

- Tailwind CSS 4
- Ant Design Icons (`@ant-design/icons`)

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

The frontend talks to an Amplify backend that defines the following data models:

- `Blog` — post metadata, slug, tags, status, content path, cover image path, author info
- `Comment` — reader comments linked to a blog post
- `Like` — per-user likes linked to a blog post
- `UserProfile` — user-owned profile record with display name, bio, avatar path, and social URLs

For blog content itself, the frontend uses a split model:

- Structured metadata (title, slug, tags, author, status, `contentPath`) lives in Amplify Data (DynamoDB).
- Markdown files and uploaded images live in Amplify Storage (S3).

Draft and published assets are separated by storage prefix:

- Drafts: `drafts/<blogId>/...`
- Published posts: `blogs/<blogId>/...`

When an admin publishes content, the frontend copies referenced media from the draft prefix to the published prefix and writes the final markdown file there. Cover images follow the same pattern.

### Storage Access and Credentials

Blog content (published markdown and media) is in the `blogs/*` S3 path, which allows both guest and authenticated reads. All server-side storage reads use an empty cookie store to force unauthenticated Identity Pool credentials, avoiding 403 errors that occur when authenticated (non-admin) Cognito users lack the required IAM role on that path.

The same approach is used for avatar resolution in `lib/profile-storage.server.ts`.

## Caching Strategy

Public-facing pages use ISR and `unstable_cache` to avoid re-fetching data on every request. Admin pages (`/admin/**`) remain fully dynamic and are never cached.

### Page-level ISR

| Page | Strategy | Revalidation |
|---|---|---|
| `/` | ISR | 5 minutes |
| `/blog` | ISR | 5 minutes |
| `/blog/[slug]` | SSG + ISR | 5 minutes |
| `/user/[username]` | ISR | 10 minutes |

The blog detail page additionally uses `generateStaticParams` to pre-render all published post slugs at build time. New slugs are rendered on first request and cached (`dynamicParams = true`).

### Data-level Caching

All public data fetching goes through `lib/cached-queries.server.ts`, which wraps each query in `unstable_cache` with a TTL and cache tags:

| Data | TTL | Tag |
|---|---|---|
| Published blog list | 5 min | `published-blogs` |
| Blog by slug | 5 min | `published-blogs` |
| Resolved markdown content | 3 hours | `published-blogs` |
| User profile by ID | 10 min | `profile-{userId}` |
| User profile by username | 10 min | `profile-username-{username}` |
| Cover image URL (S3) | 3 hours | `cover-images` |
| Avatar URL (S3) | 3 hours | `avatars` |
| Like count | 1 minute | — |

Profile caches use a factory pattern (a new `unstable_cache` instance per user) so `revalidateTag("profile-{userId}")` invalidates only that user's entry, not everyone's.

### Cookie-free AppSync Client

The Amplify SDK's server client (`generateServerClientUsingCookies`) calls `cookies()` from `next/headers`, which is request-bound and cannot run inside `unstable_cache` or `generateStaticParams`. A dedicated cookie-free client (`lib/appsync-public-fetch.server.ts`) makes raw `fetch` calls to AppSync using the API key directly. This client is used for all cached and static-param contexts.

### On-demand Cache Invalidation

When an admin publishes or updates a post, the cache is busted immediately via two complementary mechanisms:

1. **Server Action** (`app/actions/revalidate.ts`) — called directly from the blog editor after a successful publish. Runs server-side, keeping the revalidation secret off the client bundle.
2. **HTTP endpoint** (`/api/revalidate`) — a protected POST route for external triggers (e.g. Lambda, CI/CD pipelines). Requests must include the `x-revalidate-secret` header matching `REVALIDATION_SECRET`. The secret is compared using a constant-time algorithm to prevent timing attacks.

Both paths call `revalidateTag` and `revalidatePath` to bust the relevant entries.

### Auth-sensitive UI

ISR requires server components to be free of request-bound cookie reads. UI that depends on the current user's identity is handled by dedicated client components that perform their auth check on mount:

- `AdminSidebarBlock` — checks Cognito group membership and renders the admin navigation block only for admins.
- `OwnProfileActions` — checks whether the signed-in user owns the profile page and conditionally renders the "Edit profile" link and profile bootstrapper.

## Authentication and Access Control

Authentication is powered by Amplify Auth and Cognito. The frontend uses a custom auth screen.

Access rules:

- **Unauthenticated / guest users** — can read all published blog posts, view profiles, see comments and like counts.
- **Authenticated users** — can also post comments and like posts.
- **Admin group** (`admin` Cognito group) — can access all admin routes, see draft posts, create/update/delete blog records, and upload media.

## Features in Detail

### Blog Listing and Search

The `/blog` page fetches all published posts server-side, including resolved cover image URLs and author profiles, then passes them to the `BlogFilter` client component. Filtering and sorting happen entirely in memory with `useMemo`, with no extra API calls:

- Search by title (case-insensitive substring)
- Filter by tag pill (derived from actual post tags)
- Sort by newest, oldest, most liked, or least liked

Like counts are seeded as `0` server-side and hydrated client-side by `LikeButton` to keep the listing page fully cacheable.

### Dynamic Home Page

The home page fetches the four most recent published posts and resolves cover images and author profiles in parallel. The "Explore Topics" sidebar derives its tag list from those posts rather than using hardcoded values.

### User Profiles

User profiles are stored in a `UserProfile` DynamoDB record keyed by Cognito `userId`. On first visit to `/user/[username]`, if the profile doesn't exist and the URL matches the current user's preferred username, the app bootstraps the profile automatically via `OwnProfileActions` (client-side).

Profile pages show:
- Avatar (resolved server-side with guest credentials)
- Display name and username
- Bio
- Social links: X/Twitter, Instagram, GitHub, custom website
- Grid of published posts by that user

Profile editing (`/user/[username]/edit`) supports avatar upload to `profiles/avatar/{identityId}/...` in S3, with identity-based access control so only the owner can write.

### Blog Editor

The admin editor (`BlogEditorShell`) is a two-column split layout with a scrollable form on the left and a sticky live preview panel on the right. Both panels scroll independently within a fixed viewport height.

The editor supports:
- Metadata fields: title, slug, tags, excerpt, status, cover image
- Markdown textarea with live preview (GFM: tables, task lists, code blocks)
- Image upload to draft media, with controls for size (full/half/quarter/square) and fit (cover/contain/natural)
- Existing asset browser with insert and "set as cover" actions
- Save Draft Markdown → Prepare Publish Assets → Create/Update record workflow

After a successful publish, the editor triggers on-demand cache revalidation so the new post is visible immediately without waiting for the ISR timer.

Image size and fit are encoded in the markdown alt text as `Caption|size|fit` (e.g. `My photo|half|contain`) so no schema changes are needed. The renderer strips the suffix before displaying it as visible alt text.

### Inline Image Resolution

Blog markdown uses an internal `amplify://` URI scheme for image references. Before the markdown reaches the client, `resolveMarkdownImagesServer` in `lib/blog-storage.server.ts` replaces all `amplify://` references with pre-signed HTTPS URLs using guest credentials. The client component (`MarkdownPreview`) only renders — it never resolves storage URLs for published content.

Pre-signed S3 URLs are generated with a 12-hour expiry, which safely covers the 3-hour cache TTL used for resolved markdown and image URLs.

## Project Structure

```text
app/
  page.tsx                 Homepage (ISR, 5 min)
  auth/                    Custom auth flow
  blog/
    page.tsx               Blog listing (ISR, 5 min)
    [slug]/page.tsx        Blog post detail (SSG + ISR, 5 min)
  user/
    [username]/page.tsx    User profile page (ISR, 10 min)
    [username]/edit/page.tsx  Profile editor page
  admin/                   Protected admin pages (fully dynamic)
  api/
    revalidate/route.ts    Protected on-demand cache invalidation endpoint
  actions/
    revalidate.ts          Server Action for cache invalidation after publish

components/
  auth/                    Auth UI components
  blog/
    BlogEditorShell.tsx    Admin editor (metadata + media + markdown)
    BlogFilter.tsx         Client-side search/filter/sort for blog listing
    CommentSection.tsx     Comment list and submission (client component)
    LikeButton.tsx         Like toggle with count
    MarkdownPreview.tsx    GFM markdown renderer with image controls
    TagList.tsx            Tag pill list
  profile/
    OwnProfileActions.tsx  Client component — edit link + bootstrapper for profile owner
    ProfileAvatar.tsx      Avatar with server-resolved URL support
    ProfileBootstrapper.tsx Auto-creates profile on first visit
    ProfileEditor.tsx      Profile edit form
  AdminSidebarBlock.tsx    Client component — admin navigation, visible to admin group only

lib/
  appsync-public-fetch.server.ts  Cookie-free AppSync client for cached/static contexts
  cached-queries.server.ts        unstable_cache wrappers with TTL and tag-based invalidation
  auth.ts                         Admin guard and current-user helpers
  blog-data.ts                    Client-side Amplify Data mutations
  blog-data.server.ts             Server-side Amplify Data reads
  blog-storage.ts                 Storage upload/publish helpers (client)
  blog-storage.server.ts          Storage reads + inline image resolution (server, guest credentials)
  profile-data.ts                 Client-side profile mutations
  profile-data.server.ts          Server-side profile reads
  profile-storage.ts              Avatar upload helpers (client)
  profile-storage.server.ts       Avatar URL resolution (server, guest credentials)
  profile-types.ts                UserProfile, CreateProfileInput, UpdateProfileInput types
  enriched-blog-types.ts          EnrichedBlog type (server → client boundary)
  amplifyServerUtils.ts           Server-side Amplify runner
  amplify-outputs.server.ts       Server-side config loading
  amplify-outputs.shared.ts       Shared config and storage helpers
```

## Local Development

### Prerequisites

- Node.js 20+
- npm or Bun
- A running Amplify backend sandbox (`npx ampx sandbox`)
- A valid `amplify_outputs.json` file in the frontend root

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open `http://localhost:3000`.

> **Note:** ISR and `unstable_cache` are disabled in `next dev`. To verify caching behavior, run a production build locally with `next build && next start`.

### Lint

```bash
npm run lint
```

## Amplify Configuration

The frontend imports `amplify_outputs.json` at build time. This file is generated by the Amplify backend and is not committed to version control. Each environment must provide its own.

The production build pipeline in [`amplify.yml`](amplify.yml):

1. Installs Bun
2. Installs dependencies with `bun install`
3. Generates outputs with `ampx generate outputs`
4. Builds the Next.js app with `bun run build`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `REVALIDATION_SECRET` | Yes (production) | Shared secret for the `/api/revalidate` endpoint. Set in Amplify Hosting environment variables. |
| `NEXT_PUBLIC_BASE_URL` | Recommended | Full origin URL (e.g. `https://www.wanblog.com`) used for Open Graph `url` fields. |

## Deployment

The frontend is deployed with AWS Amplify Hosting.

1. Amplify builds backend outputs for the target branch.
2. The frontend consumes the generated outputs.
3. Next.js builds into `.next`.
4. Amplify serves the application.

## Known Limitations and Open TODOs

- **Storage cleanup** — deleting a blog record does not delete its associated S3 objects (markdown, media, cover image).
- **Slug validation** — no duplicate-slug detection or publish-time slug validation.
- **Autosave** — the editor has no autosave or draft recovery; unsaved changes are lost on navigation.
- **Comment editing** — users can delete their own comments but cannot edit them.
- **Profile bootstrapping** — profile creation currently happens on first profile page visit; there is no post-signup onboarding flow.
- **Tests** — no automated tests for auth guards, blog CRUD flows, or the publish pipeline.
- **Comment cache** — comments are fetched uncached at ISR render time. High-traffic posts will still hit AppSync on every ISR cycle for the comment query.
- **OwnProfileActions hydration gap** — the edit button is absent until the client-side auth check resolves on mount, causing a brief flash for profile owners.
