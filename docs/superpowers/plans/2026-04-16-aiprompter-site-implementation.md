# AIPrompter Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Astro-based marketing site for `aiprompter.run` while leaving the existing `remote.aiprompter.run` Worker flow untouched.

**Architecture:** Add a new `site/` Astro app inside this repo and keep the current Worker code in `src/index.ts` unchanged. The Astro app owns the public marketing pages (`/` and `/faq`) and links to the existing remote domain instead of reimplementing the websocket control flow.

**Tech Stack:** Astro, TypeScript, plain CSS, Vitest, existing Cloudflare Worker repo

---

## File Structure

### Existing files to keep unchanged

- `src/index.ts`
  Existing remote control Worker entrypoint. Do not modify during the marketing-site implementation.
- `wrangler.jsonc`
  Existing remote Worker config. Keep unchanged for this phase.

### New files to create

- `site/package.json`
  Astro app scripts and dependencies.
- `pnpm-workspace.yaml`
  Workspace definition tying the root Worker package and the `site/` Astro app together.
- `site/astro.config.mjs`
  Astro configuration for static output.
- `site/tsconfig.json`
  TypeScript configuration for the Astro app.
- `site/public/favicon.svg`
  Minimal favicon for the marketing site.
- `site/src/data/site.ts`
  Central source of truth for product copy fragments, CTA URLs, metadata, and FAQ entries.
- `site/src/data/site.test.ts`
  Unit tests for CTA URLs, FAQ content shape, and page metadata inputs.
- `site/src/layouts/BaseLayout.astro`
  Shared document shell and metadata.
- `site/src/components/Hero.astro`
  Homepage hero and primary CTAs.
- `site/src/components/FeatureGrid.astro`
  Core value props section.
- `site/src/components/HowItWorks.astro`
  Three-step remote-control explanation.
- `site/src/components/UseCases.astro`
  Use-case section.
- `site/src/components/FaqPreview.astro`
  Homepage FAQ preview and link to full FAQ page.
- `site/src/components/FinalCta.astro`
  Closing CTA section.
- `site/src/pages/index.astro`
  Homepage.
- `site/src/pages/faq.astro`
  FAQ page.
- `site/src/pages/robots.txt.ts`
  Robots response.
- `site/src/pages/sitemap.xml.ts`
  Sitemap response.
- `site/src/styles/global.css`
  Global styling and page-specific section styles.
- `site/README.md`
  Local developer instructions for running and building the marketing site.

## Task 1: Scaffold the Astro app without touching the remote Worker

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/README.md`

- [ ] **Step 1: Write the failing dependency/layout test**

Create `site/package.json` with a missing Astro dependency on purpose:

```json
{
  "name": "aiprompter-site",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Run the install-free validation to verify it fails**

Run:

```bash
pnpm --dir site build
```

Expected: fail with a message that `astro` is not found or cannot run.

- [ ] **Step 3: Write the minimal Astro scaffold**

Replace `site/package.json` and add the config files:

```json
{
  "name": "aiprompter-site",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "astro": "^5.7.0",
    "typescript": "^5.4.5",
    "vitest": "^2.1.8"
  }
}
```

```js
// site/astro.config.mjs
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://aiprompter.run",
  output: "static",
});
```

```json
// site/tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": "."
  }
}
```

```md
<!-- site/README.md -->
# AIPrompter marketing site

## Commands

- `pnpm install`
- `pnpm --dir site dev`
- `pnpm --dir site build`
- `pnpm --dir site test`

## Scope

This app owns `aiprompter.run` marketing pages only. Do not move the existing remote Worker flow into this app.
```

- [ ] **Step 4: Run the scaffold validation**

Run:

```bash
pnpm install
pnpm --dir site build
```

Expected: Astro build runs and then fails because no pages exist yet, or succeeds with an empty app if Astro allows it. Either result confirms the toolchain is wired.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml site/package.json site/astro.config.mjs site/tsconfig.json site/README.md pnpm-lock.yaml
git commit -m "chore: scaffold astro marketing site"
```

## Task 2: Centralize page content and test the critical links before building UI

**Files:**
- Create: `site/src/data/site.ts`
- Create: `site/src/data/site.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `site/src/data/site.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { faqItems, meta, primaryActions, steps } from "./site";

describe("site data", () => {
  it("keeps the remote CTA pointed at the existing remote domain", () => {
    expect(primaryActions.remote.href).toBe("https://remote.aiprompter.run/");
  });

  it("exposes a room-code setup explanation in the how-it-works steps", () => {
    expect(steps.map((step) => step.title)).toContain("Enter the room code on web remote");
  });

  it("includes FAQ items for remote flow and second-device setup", () => {
    const questions = faqItems.map((item) => item.question);
    expect(questions).toContain("Do I need two devices?");
    expect(questions).toContain("How does the web remote work?");
  });

  it("defines metadata for both homepage and faq", () => {
    expect(meta.home.title.length).toBeGreaterThan(20);
    expect(meta.faq.title.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm --dir site test src/data/site.test.ts
```

Expected: fail because `site.ts` does not exist yet.

- [ ] **Step 3: Write the minimal content module**

Create `site/src/data/site.ts`:

```ts
export const primaryActions = {
  download: {
    label: "Download App",
    href: "https://apps.apple.com/",
  },
  remote: {
    label: "Open Web Remote",
    href: "https://remote.aiprompter.run/",
  },
} as const;

export const meta = {
  home: {
    title: "AIPrompter, a teleprompter app with web remote control",
    description:
      "Use AIPrompter to read scripts smoothly and control your teleprompter from another phone with a simple room code.",
  },
  faq: {
    title: "AIPrompter FAQ, setup, room code, and web remote help",
    description:
      "Learn how AIPrompter works, how the room code setup works, and when to use the web remote during recording.",
  },
} as const;

export const steps = [
  {
    title: "Open AIPrompter on your recording device",
    body: "Start your script on the main phone or iPad you use as the prompter.",
  },
  {
    title: "Get the room code from the prompter",
    body: "The app shows a room code that links the prompter to a separate controller device.",
  },
  {
    title: "Enter the room code on web remote",
    body: "Open the web remote on another phone and control play, speed, and position without touching the prompter.",
  },
] as const;

export const faqItems = [
  {
    question: "How does the web remote work?",
    answer:
      "Open the remote page on a second device, enter the room code from the prompter, and use the controls to manage playback remotely.",
  },
  {
    question: "Do I need two devices?",
    answer:
      "The remote experience works best with a second phone, but the app itself is still the main teleprompter experience.",
  },
  {
    question: "What is the room code?",
    answer:
      "The room code is the short code shown by the prompter that pairs the web remote with the active device.",
  },
  {
    question: "Can I use it while recording?",
    answer:
      "Yes. The remote flow is designed to help you adjust scrolling without touching the device that is being used for reading or recording.",
  },
] as const;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm --dir site test src/data/site.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/src/data/site.ts site/src/data/site.test.ts
git commit -m "feat: add marketing site content model"
```

## Task 3: Build the shared layout and metadata shell

**Files:**
- Create: `site/src/layouts/BaseLayout.astro`
- Create: `site/src/styles/global.css`
- Create: `site/public/favicon.svg`
- Modify: `site/src/data/site.ts`

- [ ] **Step 1: Write the failing build check**

Create `site/src/layouts/BaseLayout.astro` with an invalid import to force a build failure:

```astro
---
import "../styles/missing.css";
const { title, description } = Astro.props;
---

<html lang="en">
  <head>
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: Run the build to verify it fails**

Run:

```bash
pnpm --dir site build
```

Expected: fail because `../styles/missing.css` does not exist.

- [ ] **Step 3: Write the minimal layout and base styles**

Replace the layout and add styles:

```astro
---
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  path: string;
}

const { title, description, path } = Astro.props;
const canonical = new URL(path, Astro.site);
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical.toString()} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

```css
/* site/src/styles/global.css */
:root {
  --bg: #f4efe6;
  --paper: rgba(255, 250, 242, 0.86);
  --ink: #1f1b18;
  --muted: #6b6259;
  --accent: #ff6a3d;
  --accent-deep: #b63d1c;
  --line: rgba(31, 27, 24, 0.12);
  --shadow: 0 24px 80px rgba(78, 46, 28, 0.12);
  font-family: "Georgia", "Times New Roman", serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(255, 138, 92, 0.24), transparent 30%),
    linear-gradient(180deg, #f8f3eb 0%, #f1e6d8 100%);
}

a {
  color: inherit;
  text-decoration: none;
}

main {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
}
```

```svg
<!-- site/public/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#1f1b18" />
  <path d="M18 22h28v6H35v22h-6V28H18z" fill="#ff6a3d" />
</svg>
```

- [ ] **Step 4: Run the build to verify it passes this layer**

Run:

```bash
npm --prefix site run build
```

Expected: build still fails because pages do not exist yet, but the missing stylesheet error is gone.

- [ ] **Step 5: Commit**

```bash
git add site/src/layouts/BaseLayout.astro site/src/styles/global.css site/public/favicon.svg
git commit -m "feat: add astro layout shell"
```

## Task 4: Implement the homepage sections and homepage route

**Files:**
- Create: `site/src/components/Hero.astro`
- Create: `site/src/components/FeatureGrid.astro`
- Create: `site/src/components/HowItWorks.astro`
- Create: `site/src/components/UseCases.astro`
- Create: `site/src/components/FaqPreview.astro`
- Create: `site/src/components/FinalCta.astro`
- Create: `site/src/pages/index.astro`
- Modify: `site/src/styles/global.css`
- Test: `site/src/data/site.test.ts`

- [ ] **Step 1: Extend the content test with homepage-specific assertions**

Append this test to `site/src/data/site.test.ts`:

```ts
it("keeps exactly two primary homepage actions", () => {
  expect(Object.keys(primaryActions)).toEqual(["download", "remote"]);
});
```

- [ ] **Step 2: Run the tests to verify the new assertion fails if data shape changed**

Run:

```bash
pnpm --dir site test src/data/site.test.ts
```

Expected: PASS if the content module is still correct. This is the guardrail before writing UI.

- [ ] **Step 3: Write the homepage components and route**

Create:

```astro
--- 
// site/src/components/Hero.astro
import { primaryActions } from "../data/site";
---

<section class="hero">
  <p class="eyebrow">Teleprompter with web remote</p>
  <h1>Read naturally, record smoothly, and control the prompter from another phone.</h1>
  <p class="lede">
    AIPrompter helps creators, presenters, and educators keep their script moving without touching the main device.
  </p>
  <div class="hero-actions">
    <a class="button button-primary" href={primaryActions.download.href}>{primaryActions.download.label}</a>
    <a class="button button-secondary" href={primaryActions.remote.href}>{primaryActions.remote.label}</a>
  </div>
</section>
```

```astro
---
// site/src/components/FeatureGrid.astro
---

<section class="panel">
  <div class="section-heading">
    <p class="eyebrow">Why it works</p>
    <h2>Built for recording situations where touching the screen breaks your flow.</h2>
  </div>
  <div class="feature-grid">
    <article><h3>Remote control from another phone</h3><p>Adjust play, speed, and position without walking back to the camera setup.</p></article>
    <article><h3>Cleaner delivery while reading</h3><p>Keep your script visible and your hands away from the main screen while speaking.</p></article>
    <article><h3>Fast room-code pairing</h3><p>Connect the controller through a simple code instead of a complicated setup flow.</p></article>
  </div>
</section>
```

```astro
---
// site/src/components/HowItWorks.astro
import { steps } from "../data/site";
---

<section class="panel">
  <div class="section-heading">
    <p class="eyebrow">How it works</p>
    <h2>Three steps from script to remote control.</h2>
  </div>
  <ol class="steps">
    {steps.map((step) => (
      <li>
        <h3>{step.title}</h3>
        <p>{step.body}</p>
      </li>
    ))}
  </ol>
</section>
```

```astro
---
// site/src/components/UseCases.astro
---

<section class="panel panel-split">
  <div class="section-heading">
    <p class="eyebrow">Use cases</p>
    <h2>Made for solo creators and small teams that need a smoother recording setup.</h2>
  </div>
  <div class="use-case-list">
    <div><strong>Video recording</strong><p>Keep the script moving while the camera stays locked in place.</p></div>
    <div><strong>Online courses</strong><p>Maintain steady delivery without stopping to touch the teleprompter device.</p></div>
    <div><strong>Presentations</strong><p>Use the room-code remote flow for cleaner pacing during rehearsals and live delivery.</p></div>
    <div><strong>Livestreams</strong><p>Make quick adjustments without disrupting the visible device.</p></div>
  </div>
</section>
```

```astro
---
// site/src/components/FaqPreview.astro
import { faqItems } from "../data/site";
---

<section class="panel">
  <div class="section-heading">
    <p class="eyebrow">FAQ</p>
    <h2>Questions people ask before they install or connect the remote.</h2>
  </div>
  <div class="faq-list">
    {faqItems.slice(0, 4).map((item) => (
      <article>
        <h3>{item.question}</h3>
        <p>{item.answer}</p>
      </article>
    ))}
  </div>
  <a class="text-link" href="/faq">Read the full FAQ</a>
</section>
```

```astro
---
// site/src/components/FinalCta.astro
import { primaryActions } from "../data/site";
---

<section class="final-cta">
  <p class="eyebrow">Ready to try it</p>
  <h2>Start with the app, then use the web remote when you need hands-off control.</h2>
  <div class="hero-actions">
    <a class="button button-primary" href={primaryActions.download.href}>{primaryActions.download.label}</a>
    <a class="button button-secondary" href={primaryActions.remote.href}>{primaryActions.remote.label}</a>
  </div>
</section>
```

```astro
---
// site/src/pages/index.astro
import BaseLayout from "../layouts/BaseLayout.astro";
import FeatureGrid from "../components/FeatureGrid.astro";
import FaqPreview from "../components/FaqPreview.astro";
import FinalCta from "../components/FinalCta.astro";
import Hero from "../components/Hero.astro";
import HowItWorks from "../components/HowItWorks.astro";
import UseCases from "../components/UseCases.astro";
import { meta } from "../data/site";
---

<BaseLayout title={meta.home.title} description={meta.home.description} path="/">
  <main>
    <Hero />
    <FeatureGrid />
    <HowItWorks />
    <UseCases />
    <FaqPreview />
    <FinalCta />
  </main>
</BaseLayout>
```

Append the required classes to `site/src/styles/global.css`:

```css
.hero,
.panel,
.final-cta {
  margin: 24px 0;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--paper);
  box-shadow: var(--shadow);
}

.hero h1,
.section-heading h2,
.final-cta h2 {
  margin: 0;
  font-size: clamp(2.8rem, 6vw, 5.6rem);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.lede,
.panel p {
  color: var(--muted);
  font-size: 1.05rem;
  line-height: 1.7;
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent-deep);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.78rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0 22px;
  border-radius: 999px;
}

.button-primary {
  background: var(--ink);
  color: #fff7f0;
}

.button-secondary {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.55);
}

.feature-grid,
.use-case-list,
.faq-list,
.steps {
  display: grid;
  gap: 16px;
}

.feature-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.steps {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  padding-left: 0;
  list-style: none;
}

.faq-list article,
.feature-grid article,
.steps li,
.use-case-list > div {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(31, 27, 24, 0.08);
}

.text-link {
  display: inline-block;
  margin-top: 16px;
  color: var(--accent-deep);
}

@media (max-width: 720px) {
  .hero,
  .panel,
  .final-cta {
    padding: 24px;
  }
}
```

- [ ] **Step 4: Run the build to verify the homepage works**

Run:

```bash
pnpm --dir site build
```

Expected: build still fails only because the FAQ route, robots, and sitemap are not created yet.

- [ ] **Step 5: Commit**

```bash
git add site/src/components site/src/pages/index.astro site/src/styles/global.css site/src/data/site.test.ts
git commit -m "feat: add astro homepage"
```

## Task 5: Implement FAQ, robots, and sitemap pages

**Files:**
- Create: `site/src/pages/faq.astro`
- Create: `site/src/pages/robots.txt.ts`
- Create: `site/src/pages/sitemap.xml.ts`
- Modify: `site/src/data/site.ts`

- [ ] **Step 1: Write the failing build check for missing routes**

Create `site/src/pages/faq.astro` with a broken import:

```astro
---
import BaseLayout from "../layouts/MissingLayout.astro";
---

<BaseLayout title="FAQ" description="FAQ" path="/faq">
  <main></main>
</BaseLayout>
```

- [ ] **Step 2: Run the build to verify it fails**

Run:

```bash
pnpm --dir site build
```

Expected: fail because `MissingLayout.astro` does not exist.

- [ ] **Step 3: Write the minimal remaining pages**

Replace `site/src/pages/faq.astro` and add the two route files:

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { faqItems, meta, primaryActions } from "../data/site";
---

<BaseLayout title={meta.faq.title} description={meta.faq.description} path="/faq">
  <main>
    <section class="hero">
      <p class="eyebrow">FAQ</p>
      <h1>Everything you need to know before using the app or opening the web remote.</h1>
      <p class="lede">
        This page covers the room code flow, device setup, and when to use the remote during recording.
      </p>
      <div class="hero-actions">
        <a class="button button-primary" href={primaryActions.download.href}>{primaryActions.download.label}</a>
        <a class="button button-secondary" href={primaryActions.remote.href}>{primaryActions.remote.label}</a>
      </div>
    </section>

    <section class="panel">
      <div class="faq-list">
        {faqItems.map((item) => (
          <article>
            <h2>{item.question}</h2>
            <p>{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  </main>
</BaseLayout>
```

```ts
// site/src/pages/robots.txt.ts
export function GET() {
  return new Response(
    ["User-agent: *", "Allow: /", "Sitemap: https://aiprompter.run/sitemap.xml"].join("\n"),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
```

```ts
// site/src/pages/sitemap.xml.ts
const pages = ["", "/faq"];

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (path) => `  <url><loc>https://aiprompter.run${path || "/"}</loc></url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
```

- [ ] **Step 4: Run the build to verify it passes**

Run:

```bash
npm --prefix site run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/src/pages/faq.astro site/src/pages/robots.txt.ts site/src/pages/sitemap.xml.ts
git commit -m "feat: add faq and seo routes"
```

## Task 6: Verify behavior and document deployment boundaries

**Files:**
- Modify: `site/README.md`
- Test: `site/src/data/site.test.ts`

- [ ] **Step 1: Add the final smoke test command to local docs**

Append to `site/README.md`:

```md
## Verification

- `pnpm --dir site test`
- `pnpm --dir site build`

The Astro app is for `aiprompter.run` only.
Do not change `src/index.ts` when updating the marketing site unless the task explicitly includes the remote control Worker.
```

- [ ] **Step 2: Run the final test suite**

Run:

```bash
pnpm --dir site test
```

Expected: PASS.

- [ ] **Step 3: Run the final production build**

Run:

```bash
pnpm --dir site build
```

Expected: PASS and generate static output under `site/dist`.

- [ ] **Step 4: Confirm the existing remote Worker file is untouched**

Run:

```bash
git diff -- src/index.ts wrangler.jsonc
```

Expected: no diff output.

- [ ] **Step 5: Commit**

```bash
git add site/README.md site/dist
git commit -m "docs: document astro site verification"
```

## Self-Review

### Spec coverage

- Main site built with Astro: covered in Tasks 1 through 5.
- Remote Worker compatibility: protected by architecture choices and explicit no-touch verification in Task 6.
- Homepage and FAQ pages: covered in Tasks 4 and 5.
- SEO basics: metadata, robots, sitemap, and internal links covered in Tasks 3 through 5.

### Placeholder scan

No `TBD`, `TODO`, or implicit “handle this later” language remains in the task steps.

### Type consistency

- `primaryActions`, `meta`, `steps`, and `faqItems` are defined once in `site/src/data/site.ts`.
- All components consume those names consistently.
