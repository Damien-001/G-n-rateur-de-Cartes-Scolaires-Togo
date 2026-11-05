# Product Judgment Guidelines (Vercel Method)

Product judgment is the ability to choose what to build, what to simplify, and what to omit based on real user context.

---

## 1. The Decision Hierarchy

When building a feature:
1. **User Goal > Developer Convenience:** If an architecture pattern makes code easier to write but makes the interface slower, harder to tap, or confusing on mobile, redesign the code, not the user experience.
2. **Predictable Defaults > Endless Configurations:** Users hate filling out settings they do not understand. Provide smart, sensible defaults (e.g., auto-scale A4 to phone width, select standard card density 10/page).
3. **Explicit Feedback > Silent Failure:** Never let an operation finish with no feedback. If an action succeeds, celebrate it cleanly. If it fails, explain *why* and give a 1-click retry.

---

## 2. Reversibility & Destructive Actions

* **Non-destructive actions:** Must be immediate and non-intrusive (e.g., changing a filter, toggling view modes). No confirmation dialogs needed.
* **Destructive actions (deletions, resets):**
  - Always require explicit confirmation.
  - State clearly what will be lost (e.g., "Supprimer cet élève effacera définitivement sa carte et son matricule").
  - Offer an undo toast or two-step verification if data loss is permanent.

---

## 3. The 3 Questions Before Coding

Before writing any component:
1. **What is the worst thing that can happen on this screen?**
   - Slow internet connection?
   - Expired session?
   - 0 data available?
   - 1000 items in the list?
   *(Address this state in your initial design, not as an afterthought).*
2. **Can a user complete the primary task in 2 taps?**
   - If it takes 4 modal dialogs and nested tabs, flatten the hierarchy.
3. **Does this look and feel like high-end software?**
   - No generic placeholders, no harsh system alerts (`alert()`), no raw unformatted dates or timestamps.
