# Interface Quality & Craft (Vercel Method)

Interface quality separates amateur AI prototypes from world-class production software.

---

## 1. Visual Hierarchy & Spacing

* **8px Grid Rhythm:** All padding, margins, gaps, and heights must adhere to multiples of 4px and 8px (`gap-2`, `gap-3`, `gap-4`, `p-4`, `p-6`).
* **Content Breathing Room:** Give elements space to breathe. Avoid cramped tables or edge-to-edge text without container padding.
* **Surface Layering:**
  - Base layer: Subtle neutral canvas (`bg-slate-50`, `#faf9f6`, `bg-zinc-50`).
  - Card layer: Pure white or elevated dark card (`bg-white` with subtle border `border-slate-200/80` and soft shadow `shadow-xs` or `shadow-sm`).
  - Active/Overlay layer: Elevated modal or drawer (`shadow-xl` with backdrop blur `backdrop-blur-md`).

---

## 2. Typography Rules

* **Single or Dual Typeface Maximum:** One crisp modern sans-serif (e.g. Plus Jakarta Sans, Inter, Outfit, Geist).
* **Strict Size Scale:**
  - Page Titles: `text-xl` or `text-2xl font-black`
  - Section Headers: `text-base` or `text-lg font-bold`
  - Card Titles: `text-sm font-bold`
  - Body & Form labels: `text-xs font-semibold`
  - Meta, badges, subtext: `text-[10px]` or `text-[11px] font-bold uppercase tracking-wider`
* **Never truncate critical information** without a tooltip, expansion toggle, or dedicated full view.

---

## 3. Tactile Ergonomics & Micro-Interactions

* **Touch Target Size:** Interactive elements must have a minimum clickable area of **44 × 44 px** on mobile viewports.
* **Tap Feedback:**
  - Every button, tab, and card must provide instantaneous visual feedback on tap/click (`active:scale-95`, `transition-transform duration-150`).
* **Icons + Labels:** Icons alone are often ambiguous. Pair icons with concise labels on primary actions (e.g., `[ 🖨️ Imprimer ]`, `[ 📥 Télécharger PDF ]`).
