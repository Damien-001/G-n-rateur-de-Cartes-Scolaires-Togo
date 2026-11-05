# Resilience & Edge Cases (Vercel Method)

Software must work gracefully in the messiest real-world conditions.

---

## 1. Mobile Safari & iOS WebKit Quirks

* **Asynchronous Download Block:**
  - Safari invalidates user gesture tokens after ~2 seconds.
  - Never rely solely on programmatic `a.click()` after heavy background processing (like PDF generation or ZIP creation).
  - **Required Pattern:** Show a completion modal with a direct user-clickable link:
    `<a href={blobUrl} target="_blank" download={filename}>Ouvrir / Télécharger</a>`.
* **Canvas Memory Limits:**
  - Rendering large canvas elements (> 3M pixels) will silently crash iOS Safari.
  - On viewports `< 768px`, cap canvas scale to `1.2x` - `1.5x` instead of `2x` or `3x`.
* **Fixed Bottom Bar Overlaps:**
  - Always add bottom padding (`pb-28` to `pb-36`) to scrollable views so floating action buttons or fixed bottom navigation bars never obscure content.

---

## 2. Horizontal Scroll Clipping (The Center-Overflow Trap)

* **Problem:** Centering overflowing elements with `items-center` or `justify-center` causes the left side to enter negative coordinate space (`scrollLeft < 0`), which browsers cannot scroll back to.
* **Fix:** Wrap scrollable content in:
  ```html
  <div className="w-full overflow-x-auto">
    <div className="w-fit min-w-full mx-auto flex flex-col items-center">
      <!-- Content starts at scrollLeft = 0, no clipping -->
    </div>
  </div>
  ```

---

## 3. Network & Offline Fault Tolerance

* **Image CORS:** Always specify `crossOrigin="anonymous"` on images that may be converted to canvas or exported.
* **Network Dropouts:** If an API call fails, display the error in human-readable terms with a "Réessayer" (Retry) button.
* **Optimistic Updates:** Update the UI immediately on user action, then roll back smoothly if the backend reports an error.
