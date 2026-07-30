---
name: design-taste-frontend
description: Anti-slop frontend skill for landing pages, portfolios, and redesigns. The agent reads the brief, infers the right design direction, and ships interfaces that do not look templated. Real design systems when applicable, audit-first on redesigns, strict pre-flight check.
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is **contextual**. None of it fires automatically. First read the brief, then pull only what fits.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, **infer what the user actually wants**. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. **Page kind** - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. **Vibe words** the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. **Reference signals** - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. **Audience** - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. **Brand assets that already exist** - logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
6. **Quiet constraints** - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: **"Reading this as: \<page kind> for \<audience>, with a \<vibe> language, leaning toward \<design system or aesthetic family>."**

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly **one** clarifying question and only when the design read genuinely diverges.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* **`DESIGN_VARIANCE: 8`** - 1 = Perfect Symmetry, 10 = Artsy Chaos
* **`MOTION_INTENSITY: 6`** - 1 = Static, 10 = Cinematic / Physics
* **`VISUAL_DENSITY: 4`** - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

**Baseline:** `8 / 6 / 4`. Use these unless the design read overrides them.

### 1.A Dial Inference (design read -> dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |
| Editorial / Blog | 6 | 4 | 3 |
| Public-sector service | 3 | 2 | 5 |
| Redesign - preserve | match | match+1 | match |
| Redesign - overhaul | +2 | +2 | match |

---

## 2. BRIEF -> DESIGN SYSTEM MAP

### 2.A When to reach for a real design system
| Brief reads as... | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS / dashboards | `@fluentui/react-components` | Official Fluent UI |
| Google-ish UI, Material-flavored product | `@material/web` + Material 3 tokens | Official, theme-able |
| IBM-style B2B / enterprise analytics | `@carbon/react` + `@carbon/styles` | Official Carbon |
| Shopify app surfaces | `polaris.js` web components | Required for Shopify admin |
| Atlassian / Jira-style product | `@atlaskit/*` + `@atlaskit/tokens` | Official Atlassian DS |
| GitHub-style devtool | `@primer/css` or `@primer/react-brand` | Official Primer |
| Public-sector UK service | `govuk-frontend` | Legally expected |
| US public-sector / trust-first | `uswds` | Same |
| Fast local-business / agency MVP | Bootstrap 5.3 | Boring, fast, works |
| Modern accessible React foundation | `@radix-ui/themes` | Primitives + polished theme |
| Modern SaaS where you own the components | shadcn/ui | You own the code |
| Tailwind-based modern SaaS / AI marketing | Tailwind v4 utilities | Default for indie builds |

**One system per project.** Do not mix systems.

### 2.B When the brief is an aesthetic, not a system
| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism | `backdrop-filter`, layered borders, solid-fill fallback for `prefers-reduced-transparency` |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library. |
| Brutalism | Native CSS, monospace, raw borders. No library. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. No library. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. No library. |
| Aurora / mesh gradients | SVG or layered radial gradients. No library. |
| Kinetic typography | Native CSS animations, GSAP for hijacks. No library. |
| **Apple Liquid Glass** | Web approximation only using `backdrop-filter`. Label clearly as approximation. |

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS

### 3.A Stack
* **Framework:** React or Next.js. Default to Server Components (RSC).
  * **RSC SAFETY:** Global state works ONLY in Client Components. Wrap providers in a `"use client"` component.
  * **INTERACTIVITY ISOLATION:** Any component using Motion, scroll listeners, or pointer physics MUST be an isolated leaf with `'use client'` at the top.
* **Styling:** **Tailwind v4** (default). For v4: do NOT use `tailwindcss` plugin in `postcss.config.js`. Use `@tailwindcss/postcss` or the Vite plugin.
* **Animation:** **Motion** (formerly Framer Motion). Import from `motion/react`.
* **Fonts:** Always use `next/font` or self-host with `@font-face` + `font-display: swap`. Never link Google Fonts via `<link>` in production.

### 3.B State
* Local `useState` / `useReducer` for isolated UI.
* **NEVER** use `useState` to track continuous values (mouse position, scroll progress). Use Motion's `useMotionValue` / `useTransform` / `useScroll`.

### 3.C Icons
* **Allowed (priority order):** `@phosphor-icons/react`, `hugeicons-react`, `@radix-ui/react-icons`, `@tabler/icons-react`.
* **Discouraged:** `lucide-react`. Acceptable only when explicitly requested.
* **NEVER hand-roll SVG icons.** One family per project. Standardize `strokeWidth` globally.

### 3.D Emoji Policy
Discouraged by default. Replace with icon-library glyphs. Allow only when user explicitly asks for playful / social-native vibe.

### 3.E Responsiveness & Layout Mechanics
* Contain page layouts using `max-w-[1400px] mx-auto` or `max-w-7xl`.
* **Viewport Stability:** NEVER use `h-screen`. ALWAYS use `min-h-[100dvh]`.
* **Grid over Flex-Math:** NEVER use complex flexbox percentage math. ALWAYS use CSS Grid.

### 3.F Dependency Verification (mandatory)
Before importing ANY 3rd-party library, check `package.json`. Never assume a library exists.

---

## 4. DESIGN ENGINEERING DIRECTIVES

### 4.1 Typography
* **Display / Headlines:** Default `text-4xl md:text-6xl tracking-tighter leading-none`.
* **Body / Paragraphs:** Default `text-base text-gray-600 leading-relaxed max-w-[65ch]`.
* **Sans font choice:** Discouraged as default: `Inter`. Pick `Geist`, `Outfit`, `Cabinet Grotesk`, `Satoshi`, or brand-appropriate serif first.
* **SERIF DISCIPLINE:** Serif is very discouraged as default. Only acceptable when brand brief names it OR the aesthetic is genuinely editorial/luxury/publication. **BANNED as defaults:** `Fraunces` and `Instrument_Serif`.
* **ITALIC DESCENDER CLEARANCE (mandatory):** When italic is used in display type with descender letters (`y g j p q`), use `leading-[1.1]` minimum and add `pb-1` reserve.

### 4.2 Color Calibration
* Max 1 accent color. Saturation < 80% by default.
* **THE LILA RULE:** AI Purple / Blue glow is discouraged as default. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents.
* **One palette per project.**
* **COLOR CONSISTENCY LOCK (mandatory):** Once an accent color is chosen, it is used on the WHOLE page.
* **PREMIUM-CONSUMER PALETTE BAN (mandatory):** For premium-consumer briefs, the AI-default warm beige/cream + brass/clay/oxblood/ochre + espresso palette is BANNED. Use alternatives: Cold Luxury, Forest, Black and Tan, Cobalt + Cream, etc.

### 4.3 Layout Diversification
* **ANTI-CENTER BIAS:** Centered Hero / H1 sections are avoided when `DESIGN_VARIANCE > 4`. Force split-screen, left-aligned, or asymmetric structures.

### 4.4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy.
* **SHAPE CONSISTENCY LOCK (mandatory):** Pick ONE corner-radius scale and stick to it.

### 4.5 Interactive UI States
* Always implement full cycles: Loading, Empty States, Error States, Tactile Feedback.
* **BUTTON CONTRAST CHECK (mandatory):** Verify button text is readable against button background. WCAG AA min (4.5:1).
* **CTA BUTTON WRAP BAN (mandatory):** Button text MUST fit on one line at desktop.
* **NO DUPLICATE CTA INTENT (mandatory):** Two CTAs with the same intent on one page is a Pre-Flight Fail.
* **FORM CONTRAST CHECK (mandatory):** All form elements pass WCAG AA contrast.

### 4.6 Data & Form Patterns
* Label ABOVE input. Error text BELOW input. No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules)
* **Hero MUST fit in the initial viewport.** Headline max 2 lines on desktop, subtext max **20 words** AND max 3-4 lines, CTAs visible without scroll.
* **HERO TOP PADDING CAP (mandatory):** Hero top padding max `pt-24` at desktop.
* **HERO STACK DISCIPLINE (max 4 text elements):** eyebrow OR brand strip, headline, subtext, CTAs. No tagline below CTAs, no trust micro-strip in hero.
* **"Used by / Trusted by" logo wall belongs UNDER the hero, never inside it.**
* **Navigation MUST render on a single line on desktop.** Height cap: 80px max desktop.
* **BENTO CELL COUNT RULE (mandatory):** Exactly as many cells as you have content for. No empty cells.
* **Section-Layout-Repetition Ban:** Each layout family appears at most ONCE on the page.
* **ZIGZAG ALTERNATION CAP (mandatory):** Max 2 consecutive sections with image+text-split pattern.
* **EYEBROW RESTRAINT (mandatory):** Maximum 1 eyebrow per 3 sections. Pre-Flight Check: count `uppercase tracking` instances.
* **SPLIT-HEADER BAN (mandatory):** No "left big headline + right small explainer paragraph" as section header.
* **Bento Background Diversity (mandatory):** At least 2-3 cells need real visual variation.
* **Mobile collapse must be explicit per section.**

### 4.8 Image & Visual Asset Strategy
* **Image-generation tool first** if available.
* **Real web images second:** use `https://picsum.photos/seed/{descriptive-seed}/{w}/{h}`.
* **Last resort:** leave clearly-labeled placeholder slots. Tell the user what images are needed.
* **Div-based fake screenshots are banned.**
* **Real SVG logos for social proof.** Use Simple Icons (`https://cdn.simpleicons.org/{slug}/ffffff`) or devicon.
* **LOGO-ONLY rule (mandatory):** logo wall = logos and nothing else. No category labels below logos.

### 4.9 Content Density
* Default content shape per section: headline (<=8 words) + sub-paragraph (<=25 words) + one visual OR one CTA.
* **Long lists need a different UI component** (2-column split, card grid, accordion, carousel, marquee).
* **COPY SELF-AUDIT (mandatory before ship):** Re-read every visible string. Flag and rewrite AI-hallucination phrases.
* **Fake-precise numbers are flagged.** Numbers must come from real data or be labeled as mock.

### 4.10 Quotes & Testimonials
* **Max 3 lines** of quote body. No em-dashes in quote text. Attribution: name + role + company.

### 4.11 Page Theme Lock
* The page has ONE theme. Sections do not invert. Pick light, dark, or auto and lock it.

---

## 5. CONTEXT-AWARE PROACTIVITY

These are tools, not defaults. Use them when the design read calls for them.

* **Magnetic Micro-physics:** Use when `MOTION_INTENSITY > 5` AND brief reads premium / playful / agency. Implement EXCLUSIVELY with Motion's `useMotionValue` / `useTransform`. Never `useState`.
* **"Motion claimed, motion shown."** If `MOTION_INTENSITY > 4`, the page must actually move. A static page that claims `MOTION_INTENSITY: 7` is broken.
* **MOTION MUST BE MOTIVATED (mandatory).** Each animation needs a reason: hierarchy, storytelling, feedback, or state transition.
* **MARQUEE MAX-ONE-PER-PAGE (mandatory).**
* **Forbidden Animation Patterns:**
  - `window.addEventListener("scroll", ...)` is banned.
  - Custom scroll progress using `window.scrollY` in React state.
  - `requestAnimationFrame` loops that touch React state.

### 5.A Sticky-Stack - Canonical Skeleton

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```

### 5.B Horizontal-Pan - Canonical Skeleton

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

### 5.C Scroll-Reveal Stagger - Canonical Skeleton

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

---

## 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### 6.A Hardware Acceleration
* Animate ONLY `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`.
* Use `will-change: transform` sparingly.

### 6.B Reduced Motion (mandatory)
* **Any motion above `MOTION_INTENSITY > 3` MUST honor `prefers-reduced-motion`.** This is non-negotiable.

### 6.C Dark Mode (mandatory for consumer-facing pages)
* Design for **both modes from the start**. Never ship light-only or dark-only without explicit instruction.
* Respect `prefers-color-scheme: dark`.

### 6.D Core Web Vitals Targets
* **LCP** < 2.5s. **INP** < 200ms. **CLS** < 0.1. Run Lighthouse before declaring a page done.

### 6.E DOM Cost
* Apply grain / noise filters EXCLUSIVELY to fixed, `pointer-events-none` pseudo-elements. NEVER on scrolling containers.

### 6.F Z-Index Restraint
NEVER spam arbitrary `z-50`. Use z-index strictly for systemic layer contexts.

---

## 7. DIAL DEFINITIONS (Technical Reference)

### DESIGN_VARIANCE (Level 1-10)
* **1-3 (Predictable):** Symmetrical CSS Grid, equal paddings, centered alignment.
* **4-7 (Offset):** `margin-top: -2rem` overlaps, varied image aspect ratios, left-aligned headers over center-aligned data.
* **8-10 (Asymmetric):** Masonry layouts, CSS Grid with fractional units, massive empty zones.

### MOTION_INTENSITY (Level 1-10)
* **1-3 (Static):** No automatic animations. CSS `:hover` and `:active` states only.
* **4-7 (Fluid CSS):** `transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`.
* **8-10 (Advanced Choreography):** Complex scroll-triggered reveals, parallax, scroll-driven animation. Use Motion hooks. **NEVER use `window.addEventListener('scroll')`**.

### VISUAL_DENSITY (Level 1-10)
* **1-3 (Art Gallery):** Lots of white space. Huge section gaps.
* **4-7 (Daily App):** Standard web app spacing.
* **8-10 (Cockpit):** Tight paddings. 1px lines separate data. Mandatory: `font-mono` for all numbers.

---

## 8. DARK MODE PROTOCOL

Dual-mode by default. Never assume light-only.

### 8.A Token Strategy
* **Tailwind `dark:` variant** (default): every color utility paired with dark variant.
* **CSS variables** (for shadcn/ui, Radix Themes): define semantic tokens, swap under `[data-theme="dark"]`.

### 8.B Requirements
* **Contrast** - WCAG AA minimum for body text, AAA target for hero copy.
* **Hierarchy parity** - visual hierarchy works in both modes.
* **Brand fidelity** - primary brand color stays recognisable.
* **No pure `#000000` and no pure `#ffffff`** - use off-black and off-white.

### 8.C Default Mode
Respect `prefers-color-scheme` unless the brand insists.

### 8.D Test in Both Modes Before Finishing
Open the page in both modes during development.

---

## 9. AI TELLS (Forbidden Patterns)

### 9.A Visual & CSS
* **NO neon / outer glows** by default.
* **NO pure black (`#000000`).**
* **NO oversaturated accents.**
* **NO excessive gradient text** for headers.
* **NO custom mouse cursors.**

### 9.B Typography
* **AVOID Inter as default.**
* **NO oversized H1s** that just scream.

### 9.C Layout & Spacing
* **NO 3-column equal feature cards.**

### 9.D Content & Data
* **NO generic names** ("John Doe", "Sarah Chan").
* **NO generic avatars.**
* **NO fake-perfect numbers** (99.99%, 50%).
* **NO startup-slop brand names** ("Acme", "Nexus", "SmartFlow").
* **NO filler verbs** ("Elevate", "Seamless", "Unleash").

### 9.E External Resources
* **NO hand-rolled SVG icons.**
* **NO div-based fake screenshots.**
* **NO broken Unsplash links.**

### 9.F Production-Test Tells (banned outright)
* **NO version labels in the hero** (`V0.6`, `BETA`, `ALPHA`).
* **NO section-number eyebrows** (`001 · Capabilities`).
* **NO decorative colored status dots on every list/nav/badge.**
* **NO crosshair / hairline grid lines as decoration.**
* **NO weather / locale strips** unless brief is globally-distributed.
* **Scroll cues are banned** (`Scroll`, `↓ scroll`).

### 9.G EM-DASH BAN (mandatory)
**Em-dash (`—`) is COMPLETELY banned.** Banned in headlines, eyebrows, labels, pills, button text, captions, nav items, body copy, quote attribution. There is no "limited use" allowance. Zero em-dashes.

---

## 10. REFERENCE VOCABULARY (Pattern Names)

### Hero Paradigms
* Asymmetric Split Hero, Editorial Manifesto Hero, Video / Media Mask Hero, Kinetic-Type Hero, Curtain-Reveal Hero, Scroll-Pinned Hero

### Navigation & Menus
* Mac OS Dock Magnification, Magnetic Button, Gooey Menu, Dynamic Island, Contextual Radial Menu, Floating Speed Dial, Mega Menu Reveal

### Layout & Grids
* Bento Grid, Masonry Layout, Chroma Grid, Split-Screen Scroll, Sticky-Stack Sections

### Cards & Containers
* Parallax Tilt Card, Spotlight Border Card, Glassmorphism Panel, Holographic Foil Card, Tinder Swipe Stack, Morphing Modal

### Scroll Animations
* Sticky Scroll Stack, Horizontal Scroll Hijack, Locomotive / Sequence Scroll, Zoom Parallax, Scroll Progress Path, Liquid Swipe Transition

### Typography & Text
* Kinetic Marquee, Text Mask Reveal, Text Scramble Effect, Circular Text Path, Gradient Stroke Animation, Kinetic Typography Grid

---

## 11. REDESIGN PROTOCOL

### 11.A Detect the Mode
* **Greenfield** - no existing site or full overhaul approved.
* **Redesign - Preserve** - modernise without breaking the brand.
* **Redesign - Overhaul** - new visual language on top of existing content.

### 11.B Audit Before Touching
Document: brand tokens, IA, content blocks, patterns to preserve, patterns to retire, dial reading of existing site, SEO baseline.

### 11.C Preservation Rules
* Do not change IA unless asked. Extract brand colors. Preserve copy voice. Honor accessibility wins. Respect analytics events.

### 11.D Modernisation Levers
1. Typography refresh
2. Spacing & rhythm
3. Color recalibration
4. Motion layer
5. Hero & key-section recomposition
6. Full block replacement

### 11.F What Never Changes Silently
Never modify without explicit approval: URL structure, primary nav labels, form field names, brand logo, legal copy.

---

## 12. THE BLOCK LIBRARY (Contract - Implementations Land Here Iteratively)

**Status:** schema defined. Blocks will be added iteratively.

### 12.A File Location
```
skills/taste-skill/blocks/
  hero/ feature/ social-proof/ pricing/ cta/ footer/ navigation/ portfolio/ transition/
```

### 12.B Required Frontmatter
```yaml
---
name: asymmetric-split-hero
category: hero
dial_compatibility:
  variance: [6, 10]
  motion: [3, 10]
  density: [2, 5]
when_to_use: "Landing pages with one strong asset and one strong message."
not_for: "Editorial / manifesto launches."
stack: ["react", "next", "tailwind", "motion"]
---
```

### 12.C Required Body Sections
1. Visual sketch
2. Props API
3. Code sketch
4. Mobile fallback
5. Motion variants
6. Dark-mode notes
7. Anti-patterns
8. References

---

## 13. OUT OF SCOPE

This skill is NOT for:
* Dashboards / dense product UI / admin panels
* Data tables
* Multi-step forms / wizards
* Code editors
* Native mobile
* Realtime collab UIs

If the brief is one of the above, **say so explicitly** and point to the right tool.

---

## 14. FINAL PRE-FLIGHT CHECK

Run this matrix before outputting code. **NOT OPTIONAL.**

- [ ] Brief inference declared?
- [ ] Dial values explicit and reasoned?
- [ ] Design system chosen or aesthetic labeled honestly?
- [ ] Redesign mode detected and audit performed?
- [ ] **ZERO em-dashes (`—`) anywhere on the page?**
- [ ] Page Theme Lock: ONE theme for whole page?
- [ ] Color Consistency Lock: one accent color?
- [ ] Shape Consistency Lock: one corner-radius system?
- [ ] Button Contrast Check: every CTA text readable (WCAG AA 4.5:1)?
- [ ] CTA Button Wrap: no CTA wraps to 2+ lines at desktop?
- [ ] Form Contrast Check: all form elements pass WCAG AA?
- [ ] Serif discipline: NOT Fraunces or Instrument_Serif?
- [ ] Premium-consumer palette: NOT beige+brass+espresso?
- [ ] Italic descender clearance: `leading-[1.1]` min + `pb-1` reserve?
- [ ] Hero fits viewport: headline ≤2 lines, subtext ≤20 words ≤4 lines?
- [ ] Hero top padding: max `pt-24` at desktop?
- [ ] Hero stack: max 4 text elements?
- [ ] EYEBROW COUNT: count `uppercase tracking` ≤ ceil(sectionCount / 3)?
- [ ] Split-Header Ban: no left headline + right explainer?
- [ ] Zigzag Alternation: no 3+ consecutive image+text-split?
- [ ] No Duplicate CTA Intent?
- [ ] Logo wall = logo only: no category labels below?
- [ ] Bento Background Diversity: 2-3 cells with real visual variation?
- [ ] "Used by" logo wall UNDER hero, not inside?
- [ ] Copy Self-Audit: no AI-hallucinated phrases?
- [ ] Motion motivated: each animation has a reason?
- [ ] Marquee max-one-per-page?
- [ ] Navigation on ONE line at desktop, height ≤80px?
- [ ] Section-Layout-Repetition: 4+ different layout families?
- [ ] Bento exact cell count: N items → N cells?
- [ ] Long lists use right UI component?
- [ ] Real images used: gen-tool or Picsum-seed?
- [ ] No pills/labels overlaid on images?
- [ ] No photo-credit captions as decoration?
- [ ] No version footers on marketing pages?
- [ ] No micro-meta-sentences under eyebrows?
- [ ] No decoration text strip at hero bottom?
- [ ] No floating top-right sub-text in section headings?
- [ ] No scoring/progress bars with filled background tracks?
- [ ] No locale / time / weather strips (unless justified)?
- [ ] No scroll cues?
- [ ] No version labels in hero?
- [ ] No section-numbering eyebrows?
- [ ] No decorative dots?
- [ ] No `border-t` + `border-b` on every row?
- [ ] Content density sane: ≤25-word sub-paragraphs?
- [ ] Quotes ≤3 lines?
- [ ] Motion claimed = motion shown?
- [ ] GSAP sticky-stack / horizontal-pan: `start: "top top"`, `pin: true`?
- [ ] No `window.addEventListener('scroll')`?
- [ ] Reduced motion wrapped for `MOTION_INTENSITY > 3`?
- [ ] Dark mode tokens defined and tested in both modes?
- [ ] Mobile collapse explicit?
- [ ] Viewport stability: `min-h-[100dvh]`, never `h-screen`?
- [ ] `useEffect` animations have cleanup functions?
- [ ] Empty / loading / error states provided?
- [ ] Cards omitted where possible?
- [ ] Icons from allowed library only?
- [ ] Motion isolated in client-leaf components?
- [ ] No AI Tells from Section 9?
- [ ] Core Web Vitals plausibly hit?
- [ ] One design system per project?

If a single checkbox cannot be honestly ticked, the page is not done. Fix it before delivering.

---

# APPENDICES - Real Source-Backed Reference Material

## Appendix A - Install Commands per Design System

```bash
# Material Web (Material 3)
npm install @material/web

# Fluent UI React (v9)
npm install @fluentui/react-components

# Fluent UI Web Components
npm install @fluentui/web-components @fluentui/tokens

# IBM Carbon
npm install @carbon/react @carbon/styles

# Radix Themes
npm install @radix-ui/themes

# shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card badge separator input

# Primer CSS
npm install --save @primer/css

# Primer Brand
npm install @primer/react-brand

# GOV.UK Frontend
npm install govuk-frontend

# USWDS
npm install uswds

# Atlassian Design System
yarn add @atlaskit/css-reset @atlaskit/tokens @atlaskit/button @atlaskit/badge

# Bootstrap 5.3
npm install bootstrap
```

## Appendix B - Canonical Sources

### Material Web
- https://github.com/material-components/material-web
- https://material-web.dev/theming/material-theming/
- https://m3.material.io/develop/web

### Fluent UI
- https://fluent2.microsoft.design/get-started/develop
- https://fluent2.microsoft.design/components/web/react/
- https://github.com/microsoft/fluentui

### Carbon
- https://carbondesignsystem.com/
- https://github.com/carbon-design-system/carbon

### Shopify Polaris
- https://shopify.dev/docs/api/app-home/web-components
- https://github.com/Shopify/polaris-react

### Atlassian
- https://atlassian.design/get-started/develop
- https://atlassian.design/components/button/examples

### Primer
- https://primer.style/
- https://github.com/primer/css

### GOV.UK
- https://design-system.service.gov.uk/components/button/
- https://github.com/alphagov/govuk-frontend

### USWDS
- https://designsystem.digital.gov/documentation/developers/
- https://github.com/uswds/uswds

### Bootstrap
- https://getbootstrap.com/docs/5.3/layout/grid/

### Tailwind
- https://tailwindcss.com/docs/dark-mode
- https://tailwindcss.com/blog/tailwindcss-v4

### Radix
- https://www.radix-ui.com/themes/docs/components/theme
- https://github.com/radix-ui/themes

### shadcn/ui
- https://ui.shadcn.com/docs
- https://github.com/shadcn-ui/ui

### Native CSS / W3C standards
- https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout
- https://drafts.csswg.org/scroll-animations-1/

### Apple Liquid Glass
- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/documentation/SwiftUI/Material

---

## Appendix C - Apple Liquid Glass: Honest Web Approximation

### What is official
Apple documents Liquid Glass for **Apple platforms**. It belongs to Apple platform APIs, **not a public web CSS package**.

### What is NOT official
There is no `liquid-glass.css` from Apple for websites.

### Safer web approximation skeleton

```css
.liquid-glass-web-approx {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / .32);
  background:
    linear-gradient(135deg, rgb(255 255 255 / .30), rgb(255 255 255 / .08)),
    rgb(255 255 255 / .12);
  backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  -webkit-backdrop-filter: blur(24px) saturate(180%) contrast(1.05);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / .48),
    inset 0 -1px 0 rgb(255 255 255 / .12),
    0 18px 60px rgb(0 0 0 / .18);
}

@media (prefers-color-scheme: dark) {
  .liquid-glass-web-approx {
    border-color: rgb(255 255 255 / .18);
    background:
      linear-gradient(135deg, rgb(255 255 255 / .16), rgb(255 255 255 / .04)),
      rgb(15 23 42 / .42);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / .22),
      0 18px 60px rgb(0 0 0 / .42);
  }
}

@media (prefers-reduced-transparency: reduce) {
  .liquid-glass-web-approx {
    background: rgb(255 255 255 / .96);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
}
```

---

**End of taste-skill SKILL.md**
