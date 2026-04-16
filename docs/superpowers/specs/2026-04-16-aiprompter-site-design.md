# AIPrompter Main Site Design

## Goal

Create a public-facing website for `aiprompter.run` that explains the Teleprompter product, supports basic SEO, and directs users to the existing web remote without changing the current remote-control workflow.

This first phase is intentionally narrow:

- Launch a lightweight but credible product site
- Preserve the current remote-control flow on `remote.aiprompter.run`
- Build on a stack that is easy to extend into more SEO-oriented pages later

## Hard Constraints

- `remote.aiprompter.run` must keep working as-is
- Existing remote links such as `https://remote.aiprompter.run/?room=E8Z80P` must remain valid
- The new main site must not take over websocket or room-control responsibilities
- The first version should stay simple and fast to ship

## Recommended Architecture

### Site split

- `aiprompter.run`: Astro-based marketing site
- `remote.aiprompter.run`: existing Cloudflare Worker for remote control

The two properties should remain separate at the routing and deployment level. The marketing site links into the remote experience but does not share its runtime concerns.

### Why this split

- Lowest compatibility risk
- Clear separation between acquisition and utility
- Easier debugging when issues occur
- Better long-term SEO structure for the main domain

## Technology Stack

### Main site

- Astro
- TypeScript
- Plain CSS

### Not included in phase 1

- React
- Tailwind
- CMS
- Database
- User accounts

The site is content-first. Astro gives strong static output and SEO-friendly HTML without introducing a heavier application stack.

## Phase 1 Pages

### `/`

Primary landing page for new users and the main SEO entry point.

Responsibilities:

- Explain what the product is
- Explain why remote control matters
- Show who the product is for
- Give users two clear actions:
  - download the app
  - open the web remote

### `/faq`

Support page for conversion and SEO.

Responsibilities:

- Answer practical questions the homepage should not over-explain
- Capture search intent around usage and setup
- Reduce friction before install or remote usage

## Homepage Information Architecture

### 1. Hero

Purpose: establish product identity immediately.

Content:

- product name
- concise value proposition
- short supporting copy
- primary CTA: `Download App`
- secondary CTA: `Open Web Remote`

The hero should make clear that this is a teleprompter product with remote-control capability, not just a standalone web remote.

### 2. Core Value Props

Purpose: explain the practical reasons to choose the product.

Recommended message areas:

- remote control from another phone
- smoother reading while recording videos or speaking
- simple setup with room code pairing

This section should stay short and skimmable.

### 3. How It Works

Purpose: make the remote feature feel understandable and low-friction.

Three-step structure:

1. Open the teleprompter app
2. Get the room code on the prompter device
3. Open the web remote on another phone and connect

This section is important both for conversion and for matching long-tail search intent.

### 4. Use Cases

Purpose: connect the product to concrete user scenarios.

Recommended use cases:

- talking-head videos
- online courses
- presentations
- livestreams

### 5. FAQ Preview

Purpose: surface the most conversion-critical questions directly on the homepage and link to the full FAQ page.

Recommended preview topics:

- Do I need a second device?
- How does the web remote work?
- Is setup complicated?
- Can I use it while recording?

### 6. Final CTA

Purpose: restate the two main actions near the bottom of the page.

- `Download App`
- `Open Web Remote`

## FAQ Scope

The FAQ page should answer practical usage questions, not become a generic knowledge base.

Initial topics:

- What is AIPrompter?
- How does the web remote work?
- Do I need two devices?
- What is the room code?
- Can I use it for video recording?
- Is the remote page the same as the app?

## SEO Approach

The first version should be a conversion-focused landing page with enough structured text to support SEO.

### SEO requirements for phase 1

- server-rendered/static HTML output
- unique page titles and meta descriptions
- meaningful headings and section copy
- internal links between homepage and FAQ
- sitemap and robots support
- clean URLs

### Target search themes

- teleprompter with remote control
- teleprompter remote on phone
- web remote for teleprompter
- teleprompter for video recording

The content should read naturally. Exact-match keyword stuffing is out of scope.

## Visual Direction

The site should feel more product-focused than corporate.

Guidelines:

- clean but not generic
- mobile-first layout
- product-oriented typography and spacing
- strong CTA contrast
- visual emphasis on remote control as differentiator

Because the actual utility lives on `remote.aiprompter.run`, the homepage should feel trustworthy and polished without looking like a dashboard.

## Compatibility Strategy

The remote workflow is explicitly out of scope for modification in phase 1.

Protected behaviors:

- websocket room flow
- existing room query parameter behavior
- existing remote domain and URL shape

The homepage may link to the remote page, including roomless entry. It should not reimplement the remote logic.

## Deployment Strategy

Recommended deployment model:

- keep current remote Worker deployment unchanged
- deploy Astro site separately for `aiprompter.run`

This avoids coupling marketing-site releases to remote-control stability.

## Testing Strategy

For phase 1, validation should focus on:

- mobile and desktop layout sanity
- CTA link correctness
- FAQ page rendering
- metadata and page titles
- no impact to the existing remote domain

## Out of Scope

- moving remote logic into Astro
- building a full web teleprompter app
- account system
- analytics-heavy marketing stack
- blog or content CMS
- localization expansion in phase 1

## Future Expansion Path

If the main site grows, the next logical additions are:

- feature pages such as `/remote-control`
- legal pages such as `/privacy` and `/terms`
- comparison or use-case pages for additional SEO coverage

If a true web app is needed later, it should be introduced separately rather than forcing the marketing site to evolve into an application shell.
