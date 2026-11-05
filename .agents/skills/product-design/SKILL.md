---
name: product-design
description: Vercel Product Design and Product Judgment methodology by John Phamous ("Teaching Agents Product Design at Vercel"). Forces agents to think like senior product designers and design engineers rather than code generators. Eliminates AI slop by requiring clear user jobs, outcomes over outputs, state mapping (loading, empty, error, edge cases), mobile ergonomics, resilience, and interface craft before coding. Use when building, modifying, or reviewing user-facing interfaces, UX flows, components, dashboards, or mobile views.
metadata:
  author: vercel
  source: https://vercel.com/blog/teaching-agents-product-design-at-vercel
  version: "1.0.0"
---

# Product Design & Product Judgment (Vercel Methodology)

This skill teaches agents the exact design philosophy, product judgment, and interface craftsmanship developed at Vercel by John Phamous.

Coding agents naturally generate functional code, but lack the context of *why* design decisions exist. This skill bridges the gap between raw code and human product design.

---

## The 5 Core Directives

### 1. Start with the job, not the pixels
Before writing any HTML, CSS, or React:
* **Who** is acting? (Role, context, device)
* **What** are they trying to accomplish? (The user's real-world job-to-be-done)
* **What object** is being acted upon?
* **What system state** actually changes?

### 2. Define the outcome before the output
* **Output** is the code/component you build (e.g., a modal, a table, a download button).
* **Outcome** is the real result for the user (e.g., "The school director exports and inspects 24 cards in under 5 seconds on their iPhone").
Never implement an output until the desired outcome, failure boundaries, and success signals are explicitly defined.

### 3. Evidence over taste
* Do not invent arbitrary styles or rely on default AI patterns ("AI slop").
* Anchor decisions in:
  - Canonical repository patterns and design tokens
  - User ergonomics (touch size, thumb reach, readability)
  - Established platform conventions (iOS AirPrint vs. Desktop save, system modals vs. inline drawers)

### 4. Make the primary task unmistakable
* Every screen, view, or surface has **one primary job**.
* Visually elevate the primary action (strong contrast, clear position, unmistakable hierarchy).
* De-emphasize secondary actions; hide tertiary actions behind contextual disclosure.

### 5. Inline disclosure before modals
* Modals interrupt the user's mental model and often break on small screens.
* Prefer inline expansion, accordion disclosures, sliding sheets, or dedicated sub-views over stacked dialogs.
* Only use blocking modals for destructive actions (e.g. permanent deletion) or mission-critical completions (e.g. download ready fallback).

---

## The 7-Step Design & Build Loop

When tasked with any user-facing feature:

1. **Set Scope & Mode:** Identify the target surface (mobile viewport, desktop layout, embedded widget).
2. **Model the Decision:** Write down the user goal and what happens if something goes wrong.
3. **Map All 5 States:**
   - **Empty State:** First-time user, zero items (must provide guidance, never a blank void).
   - **Loading State:** Skeleton or progress feedback showing what is happening.
   - **Success State:** Clear affirmation and immediate next action.
   - **Error State:** Human-readable explanation and recovery path (retry button, fallback).
   - **Edge Cases:** Very long names, 100+ items, tiny screens (< 375px), slow networks.
4. **Enforce Mobile Ergonomics:**
   - Minimum **44 × 44 px** touch target for interactive elements.
   - **Zero horizontal scroll traps:** Never center an overflowing element with `items-center` without `w-fit min-w-full`.
   - Generous bottom padding (`pb-28` to `pb-36`) to avoid mobile bottom navigation overlays.
5. **Resilience & Fallbacks:**
   - If an async operation takes > 2 seconds (e.g., canvas rendering, PDF generation, CSV import), mobile Safari will block silent downloads. Provide a direct, synchronous download/open link.
   - Always offer a native fallback (e.g., `window.print()` alongside JS PDF generation).
6. **Interface Quality & Craft:**
   - Typographic hierarchy: Maximum 3 font sizes per component card.
   - High contrast ratios (WCAG AA minimum: 4.5:1 for body text, 3:1 for large text).
   - Subtle, intentional micro-interactions (active:scale-95, smooth hover transitions).
7. **Verify & Review:**
   - Test on small viewport (360px) and wide viewport (1440px).
   - Verify keyboard navigability and screen-reader accessibility.

---

## References

For detailed sub-rules, consult:
- `references/product-judgment.md`: Intent, reversibility, and decision trees.
- `references/interface-quality.md`: Spacing, typography, color tokens, and visual polish.
- `references/resilience.md`: Mobile Safari quirks, error recovery, and async state guards.
- `references/copy.md`: Clear, concise, human-centric UI writing.
