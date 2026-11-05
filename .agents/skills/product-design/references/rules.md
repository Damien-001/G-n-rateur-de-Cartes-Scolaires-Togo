# Product Design Compliance Checklist (Vercel Method)

Before completing any frontend or UI task, verify this checklist:

- [ ] **Job Defined:** Is the primary user job clear?
- [ ] **Unmistakable Action:** Can the user spot the main action in under 1 second?
- [ ] **Mobile Touch Test:** Are all buttons at least 44px tall with `active:scale-95` feedback?
- [ ] **Zero Scroll Trap:** Does any horizontal overflow clip the left side? (If yes, use `w-fit min-w-full`).
- [ ] **All 5 States Covered:** Empty state, Loading indicator, Success feedback, Human-readable Error, Edge cases.
- [ ] **Safe Async Downloads:** If generating files or PDFs on mobile, is there a direct open/download link?
- [ ] **Contrast Check:** Are all texts legible against their backgrounds?
- [ ] **No AI Slop:** No gratuitous neon gradients, no useless generic badges, no giant empty spaces, no broken viewports.
