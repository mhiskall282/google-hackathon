# CLAUDE.md — johnokyere.xyz

Portfolio site for John Okyere (software engineer, AI + Web3). Static MDX content, no database, no API routes. Deploy target: Vercel.

---

## 1. Stack (non-negotiable)

| Concern | Tool |
|---|---|
| Framework | Next.js 16.1.6 — App Router, RSC-first |
| Language | TypeScript 5.9 — `strict: true`, never weaken |
| Styling | Tailwind CSS v4 + `tw-animate-css` |
| Components | shadcn/ui New York style, zinc base, CSS variables |
| Icons | HugeIcons only (`@hugeicons/react` + `@hugeicons/core-free-icons`) |
| Animation | Framer Motion / `motion` |
| 3D | React Three Fiber + Three.js |
| Content | `@content-collections/core` + MDX, Zod-typed schemas |
| Global state | Zustand v5 — UI state only |
| Command palette | `cmdk` |
| Carousel | Embla Carousel |
| Theme | `next-themes` (default: dark) |
| Lint + format | Biome v2 (not ESLint, not Prettier) |
| Schema validation | Zod v4 |
| Package manager | pnpm |
| Image CDN | UploadThing (`utfs.io`) |

---

## 2. File Map

```
app/
  layout.tsx          Root layout — fonts, ThemeProvider, Menu, Footer, DashedVerticalLines
  page.tsx            Home — composes section components sequentially
  globals.css         All design tokens, cmdk styles, typography utilities, scrollbar styles
  work/page.tsx       /work listing (reads allWorks, sorted by `sort`)
  work/[slug]/page.tsx  Case-study MDX renderer
  writing/page.tsx    /writing listing (reads allWritings)
  writing/[slug]/page.tsx  Article MDX renderer

components/
  sections/           Page-level sections (about, experience, selected-work, menu, header…)
  ui/                 Design-system primitives (button, card, badge, tooltip, dialog…)
  shells/             Media wrappers (ImageCarousel, ImageShell, ImageViewer, VideoViewer)
  dither/             Three.js dither — client-only, visually decorative
  icons.tsx           All brand/custom SVG icons
  mdx.tsx             MDX component map
  theme-toggle.tsx    Dark/light toggle

config/site.ts        SINGLE SOURCE OF TRUTH — name, URL, OG image, all social links
lib/utils.ts          cn() only
lib/store/            Zustand stores: use-image.tsx, use-video.tsx

content/
  work/               MDX project case studies
  writing/            MDX blog posts
  experience/         MDX work history
  awards/             MDX awards
```

---

## 3. Content Schemas

All content is MDX with Zod-validated frontmatter. Schema lives in `content-collections.ts`.

| Collection | Required frontmatter | Notes |
|---|---|---|
| `work` | `title`, `description`, `href`, `status`, `sort` (number) | `sort` controls render order — never omit |
| `writing` | `title`, `summary`, `date` | |
| `experience` | `year`, `role`, `company`, `location` | |
| `awards` | `year`, `title`, `sort` (number) | `sort` controls render order — never omit |

**Adding a new required field to any schema** will break every existing MDX file in that collection that lacks it. Always make new fields optional with `z.string().optional()` unless you update all existing files simultaneously.

After any schema change: `pnpm content-collections build` before running dev or build.

---

## 4. Commands

```bash
pnpm dev          # ALWAYS use this — runs content-collections watch + next dev --turbopack concurrently
pnpm build        # content-collections build && next build --turbopack
pnpm typecheck    # tsc --noEmit
pnpm lint         # biome check
pnpm format       # biome format --write
```

**Never** run `next dev` directly — content-collections must be watched simultaneously or generated types will be stale.

---

## 5. Autonomous Execution Protocol

Before touching any file, resolve these checks first:

### Starting a task
1. Read `config/site.ts` if the task involves identity, links, or URLs
2. Read `content-collections.ts` if the task involves adding/editing MDX content or schemas
3. Read the relevant section component before adding new UI to a page
4. Check `globals.css` before adding any new CSS utility or token

### Mandatory pre-commit gate (run in order, stop on failure)
```bash
pnpm typecheck   # must be zero errors
pnpm lint        # must be zero errors (warnings OK)
pnpm build       # must succeed — catches MDX schema errors and RSC/client boundary violations
```

### Definition of done
A task is complete only when: typecheck passes, lint passes, build passes, and both dark + light themes render correctly at mobile (≤640px) and desktop (≥1024px) breakpoints.

---

## 6. Architectural Guardrails

### RSC vs Client Component — decision rule
Default to Server Component. Add `"use client"` **only** if the component uses:
- `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`
- Zustand store hooks
- Framer Motion animated values (`useMotionValue`, `useSpring`, `useAnimate`)
- Browser-only APIs (`window`, `document`, `navigator`)
- `useTheme`, `useRouter`, `usePathname`

Currently client: `About`, `SelectedWork`, `Header`, `Menu`, `ImageViewer`, `VideoViewer`, `ClientDither`.

Adding `"use client"` to a component makes its entire subtree client-side. Confirm it's unavoidable before doing so.

### Data flow — enforced rules
- Content data flows only from `content-collections` → page/component — never from Zustand or Context
- Zustand stores hold **only** transient UI state (e.g., which image is open) — never content
- No `fetch()` calls — this site has no API. All data is build-time MDX
- No `useEffect` for data loading — if you need data, it comes from content-collections at build time

### Import paths
- Always use `@/` aliases — never `../../` relative paths from root
- `@/*` resolves to repo root (defined in `tsconfig.json` paths)
- `content-collections` resolves to `.content-collections/generated` (defined in tsconfig paths)

---

## 7. Styling Guardrails

### Colors — OKLCH tokens only
Never hardcode `#hex`, `rgb()`, or named colors in components. Use only semantic tokens:

| Token | Use |
|---|---|
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary / metadata text |
| `bg-background` | Page background |
| `bg-card` | Card surfaces |
| `border-border` | All borders |
| `bg-accent` | Hover states |
| `text-primary` | Emphasis |

Do **not** write `dark:` variant overrides for any color already in the design system — the `.dark` class on `<html>` handles switching automatically via CSS variable reassignment.

### Typography — use these classes only
| Class | Size | Font |
|---|---|---|
| `font-display` | — | Instrument Serif (display headings only) |
| `font-title` | — | Outfit (section labels, item titles, CTAs) |
| `font-sans` | — | Inter (body default) |
| `text-heading` | 1.5rem | Headings |
| `text-section-title` | 0.8125rem uppercase | Section labels |
| `text-item-title` | 1.0625rem | List item titles |
| `text-body` | 1rem / 1.65lh | Body copy |
| `text-caption` | 0.875rem | Metadata, dates |
| `text-small` | 0.75rem | Fine print |

Do not add arbitrary `text-[size]` values — use the defined scale or add a named class to `globals.css`.

### Layout
- Max content width: `52rem` (enforced by `DashedVerticalLines` in root layout)
- All sections must sit inside this constraint — do not break out to full-bleed without explicit design intent
- Mobile padding: 16px. Desktop (≥640px): 20px. Match `.container` class behavior

### Canonical link/hover pattern
```tsx
// Scoped to group — always use group/name modifiers
<div className="group/item">
  <span className="border-b border-dashed border-foreground/60 group-hover/item:border-foreground transition-colors duration-200">
    Label
  </span>
</div>
```
Never use CSS `text-decoration: underline`. Never use `hover:underline`.

### Icons
```tsx
// Always this shape — never import Lucide icons
import { SomeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
<HugeiconsIcon icon={SomeIcon} size={16} strokeWidth={2} />
```
Custom/brand icons (GitHub, Twitter, LinkedIn, theme toggle) live only in `components/icons.tsx`.

---

## 8. Component Conventions

### Section components (`components/sections/`)
- Self-contained — import `content-collections` data directly, accept no data props from page
- Exception: `Header` accepts `{ name, title, isActive }` from `app/page.tsx`
- Use `SectionGrid` + `SectionTitle` + `SectionContent` from `@/components/ui/section-grid` for all section layouts

### UI primitives (`components/ui/`)
- Extend via `className` + `cn()` — never mutate base styles
- `Button`: pass `asChild` when wrapping `<a>` or `<Link>`; use CVA variants (`ghost`, `outline`, `default`, `link`, etc.)
- All shadcn primitives have `data-slot` attributes — do not remove them

### New Zustand store pattern
```tsx
// lib/store/use-[noun].tsx
import { create } from "zustand"
interface [Noun]State {
  value: T | null
  setValue: (v: T | null) => void
}
export const use[Noun]Store = create<[Noun]State>()((set) => ({
  value: null,
  setValue: (v) => set({ value: v }),
}))
```
Stores are flat. No slices, no middleware, no persistence.

### New media shell pattern
Media wrappers (image, video) must integrate with the global viewer pattern:
1. On click → call `useImageStore.setSelectedImage(url)` + `setDialogOpen(true)`
2. `ImageViewer` at root layout renders the lightbox

---

## 9. TypeScript Rules

- No `any` — use `unknown` and narrow with `instanceof` or type guards
- No `React.FC` — plain functions with named `interface` props
- `interface` for object shapes; `type` for unions, intersections, mapped types
- String literal unions over `enum`
- All exported functions need explicit return types
- Zod schemas in `content-collections.ts` are the source of truth — infer TypeScript types from them with `z.infer<>` when needed
- `tsconfig.json` `strict: true` is non-negotiable — never add `@ts-ignore` without a comment explaining why
- Use `@/` aliases in all imports — never bare relative paths from `app/` or `components/`

---

## 10. Performance Constraints

| Constraint | Rule |
|---|---|
| Images | Always `next/image`; explicit `width`/`height`; `loading="lazy"` unless above fold |
| Remote images | Only `utfs.io` is allowed — update `next.config.ts` `remotePatterns` if adding a new CDN |
| Fonts | Three fonts are loaded globally (Inter, Outfit, Instrument Serif) — add no new Google Fonts; use `--font-inter`, `--font-outfit`, `--font-instrument-serif` CSS vars |
| Icon imports | Named imports only from `@hugeicons/core-free-icons` — never `import * as` |
| Animation | Animate `transform`/`opacity` only — never `width`, `height`, `top`, `left` (triggers layout) |
| Framer Motion | Use `useMotionValue` + `useSpring` for cursor tracking (see `selected-work.tsx`); never `animate()` layout-affecting properties |
| Bundle | No new dependencies without verifying they are tree-shakeable |
| RSC | Keep data-reading sections (Experience, Writing, Awards) as Server Components — no unnecessary `"use client"` |

---

## 11. Security Constraints

- No `dangerouslySetInnerHTML` — MDX content is compiled at build time through a controlled pipeline
- No `eval` or `new Function` — Three.js shaders are the only dynamic code and are already sandboxed
- No hardcoded secrets or API keys — this site has no env vars currently; if adding any, use `.env.local` and validate at startup with Zod
- External links: always `target="_blank" rel="noopener noreferrer"`
- No user input surfaces — this is a static portfolio; if adding a contact form, validate with Zod and rate-limit at the edge
- The `noUnknownAtRules: "off"` Biome rule is intentional for Tailwind v4 `@theme` / `@custom-variant` syntax — do not restore it

---

## 12. Accessibility Requirements

| Requirement | Implementation |
|---|---|
| Interactive elements | Must have `aria-label` or visible text label |
| Buttons | Always `type="button"` |
| Decorative elements | `aria-hidden` (noise overlay, status dot, dither) |
| Non-interactive animated divs | `pointer-events-none` |
| Mobile nav tooltips | Preserve `<Tooltip><TooltipContent>` — screen reader labels |
| Theme | Do not remove `suppressHydrationWarning` from `<html>` — required by `next-themes` |
| Heading hierarchy | Each page has exactly one `<h1>` — confirm before adding headings in sections |

---

## 13. Anti-Patterns — Never Do These

```
❌  next dev               → use pnpm dev (content-collections must co-run)
❌  import from "lucide-react"  → use @hugeicons/core-free-icons
❌  hardcode siteConfig values  → always import from @/config/site
❌  dark: color overrides for system tokens  → tokens handle dark mode automatically
❌  text-[arbitrary]        → use defined typography scale classes
❌  #hex or rgb() in component className  → OKLCH tokens only
❌  default export from components/  → named exports only (except page.tsx / layout.tsx)
❌  React.FC               → plain function with interface props
❌  any                    → unknown + narrowing
❌  useState for content data  → content-collections is the data layer
❌  fetch() in components  → no API; data is build-time
❌  console.log in production  → remove before commit
❌  commented-out code blocks  → delete, don't comment out
❌  split globals.css       → one global CSS file only
❌  weaken tsconfig strict  → non-negotiable
❌  index as React key in dynamic lists  → use stable unique IDs (_meta.path for MDX items)
❌  new Google Fonts        → use existing --font-* CSS variables
❌  useEffect for derived state  → derive during render
❌  import * as HugeIcons   → named imports only
❌  relative paths from root (../../)  → @/ aliases always
```

---

## 14. Task Routing — Agent & Skill Assignment

### By task type
| Task | Primary agent | Supporting skill |
|---|---|---|
| New feature / new page | `planner` | `nextjs-turbopack`, `frontend-patterns` |
| Any `.ts` / `.tsx` edit | `typescript-reviewer` | `coding-standards` |
| Any code change (post-edit) | `code-reviewer` | — |
| Build / typecheck failure | `build-error-resolver` | `nextjs-turbopack` |
| Dead code / commented blocks | `refactor-cleaner` | — |
| New UI primitive or token | `code-reviewer` | `design-system` |
| New animation or 3D effect | `code-reviewer` | `frontend-patterns` |
| New MDX component | `typescript-reviewer` | `content-engine` |
| Security-adjacent change | `security-reviewer` | `security-review` |
| Visual regression check | — | `browser-qa` |
| New Zustand store | `typescript-reviewer` | — |

### By file changed
| File/dir | Always invoke |
|---|---|
| `config/site.ts` | `code-reviewer` — downstream impact is wide |
| `content-collections.ts` | `typescript-reviewer` — schema changes break all MDX |
| `app/globals.css` | `code-reviewer` — token renames cascade everywhere |
| `components/ui/*` | `typescript-reviewer` + `code-reviewer` |
| `components/sections/*` | `code-reviewer` |
| `app/layout.tsx` | `code-reviewer` — affects every page |
| `lib/store/*` | `typescript-reviewer` |

---

## 15. Repo-Specific Workflows

### Adding a new portfolio project
1. Create `content/work/[project-slug].mdx`
2. Add required frontmatter: `title`, `description`, `href`, `status`, `sort`
3. Set `sort` to the next integer in sequence (check existing files)
4. Optionally add `image` (UploadThing URL), `icon` (path in `/public/icons/`), `stack[]`
5. Run `pnpm typecheck` — schema errors surface immediately
6. The project auto-appears in `/work` listing and home `SelectedWork` section (top 4 by sort)

### Adding a new writing post
1. Create `content/writing/[post-slug].mdx`
2. Required frontmatter: `title`, `summary`, `date` (format: `"YYYY-MM-DD"`)
3. MDX body can use `<ImageShell>`, `<ImageCarousel>`, `<VideoViewer>` inline
4. Run `pnpm typecheck`

### Adding a new home page section
1. Create `components/sections/[section-name].tsx`
2. Decide: Server Component (data-reading, no hooks) or Client Component (animations, state)
3. If using `SectionGrid` layout: `import { SectionGrid, SectionTitle, SectionContent } from "@/components/ui/section-grid"`
4. Add to `app/page.tsx` — import and insert in JSX order
5. No props needed unless the section takes config from page (like `Header`)

### Adding a new MDX inline component
1. Create the component in `components/shells/` or `components/ui/`
2. Register it in the `components` map in `components/mdx.tsx`
3. Export its props type from the component file
4. Update this CLAUDE.md — add to the MDX components list in §8

### Extending the command menu
- All entries live in `components/sections/menu.tsx`
- Navigation uses the internal `navigate(href)` helper — use it for all entries
- Social links come from `siteConfig.links` — never hardcode

### Cleaning `about.tsx` dead code
- Use `refactor-cleaner` agent
- The file has a full duplicate commented-out block at lines 1–111
- Safe to delete — the active implementation starts at line 112

---

## 16. Code Review Expectations

Every code change must pass these checks before being considered complete:

### Automated (non-negotiable)
- [ ] `pnpm typecheck` — zero errors
- [ ] `pnpm lint` — zero errors
- [ ] `pnpm build` — succeeds

### Manual verification checklist
- [ ] Dark mode: tokens render correctly, no hardcoded light colors
- [ ] Light mode: no dark-only assumptions
- [ ] Mobile (≤640px): layout holds, floating nav visible, no overflow
- [ ] Desktop (≥1024px): max-width constraint respected
- [ ] Keyboard nav: `⌘K` menu still functional
- [ ] No `console.log` remaining
- [ ] No commented-out code blocks
- [ ] Accessibility: new interactive elements have labels
- [ ] Performance: new images use `next/image`; no layout-triggering animations

### Review severity
| Severity | Examples | Gate |
|---|---|---|
| BLOCK | type errors, build failure, `any`, hardcoded secrets, broken RSC/client boundary | Must fix |
| HIGH | missing `aria-label`, `console.log`, commented code, dark: overrides for system tokens | Fix before merge |
| MEDIUM | missing explicit return types, index as key, layout-affecting animations | Fix or document |
| LOW | style inconsistencies, suboptimal naming | Advisory |
