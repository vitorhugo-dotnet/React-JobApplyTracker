# Buy Me a Coffee Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing Buy Me a Coffee destination to desktop and mobile Applywell navigation.

**Architecture:** A shared navigation module owns the external URL, while a reusable SVG icon keeps both entry points visually consistent. The desktop topbar renders an icon-only link at `md+`; the existing mobile speed-dial menu renders a labeled link below `md`.

**Tech Stack:** React 19, TypeScript 6, Tailwind CSS 3, Playwright.

## Global Constraints

- Destination: `https://www.buymeacoffee.com/vitorhugo1207`.
- Open in a new tab with `rel="noopener noreferrer"`.
- Preserve the monochrome Applywell design system.
- Do not add a second mobile floating action button.

---

### Task 1: Navigation links

**Files:**
- Create: `src/components/layout/externalLinks.ts`
- Modify: `src/components/ui/icons.tsx`
- Modify: `src/components/layout/Topbar.tsx`
- Modify: `src/components/layout/MobileNav.tsx`
- Test: `tests/navigation.spec.ts`

**Interfaces:**
- Produces: `BUY_ME_A_COFFEE_URL: string` and `CoffeeIcon(p: IconProps): JSX.Element`.
- Consumes: existing `Topbar`, `MobileNav`, Playwright authenticated fixture, and Tailwind breakpoints.

- [ ] **Step 1: Write failing responsive navigation tests**

Add Playwright cases that authenticate, set desktop/mobile viewports, assert the correct Buy Me a Coffee link is visible, and verify its `href`, `target`, and `rel` attributes.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx playwright test tests/navigation.spec.ts`
Expected: FAIL because no link named `Buy me a coffee` exists.

- [ ] **Step 3: Implement the shared link, icon, and responsive entry points**

Create the URL constant, add the coffee cup SVG, render the desktop link with `hidden md:grid`, and add the labeled external link to the existing mobile menu.

- [ ] **Step 4: Run tests and static checks**

Run: `npx playwright test tests/navigation.spec.ts && npm run typecheck && npm run build`
Expected: all commands exit successfully.

- [ ] **Step 5: Commit**

Stage only the plan, test, constant, icon, topbar, and mobile navigation files. Commit with `feat: add Buy Me a Coffee navigation`.
