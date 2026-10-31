# CAT Draft — Responsive public reading across four domains

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation`. Normative inputs: `100_機能仕様.md` DS-05 and `400_受入検証計画.md` AC-60/65/78; public reader views must be usable without forced horizontal scrolling at representative viewport widths.

## Process / PI candidates

An anonymous reader opens the story, settings, dictionary and timeline routes for a published series on a phone-size, tablet-size and desktop-size Chromium viewport. The pages display their domain-specific content and do not require document-level horizontal scrolling.

- PI-1: Document `scrollWidth <= clientWidth + 2` at 390, 768 and 1280 CSS pixels.
- PI-2: Route content remains present; responsive layout does not replace the domain page with a generic parent view.
- PI-3: No private content is made visible by responsive layout changes.

## TCE candidate

Playwright browser acceptance on built Nuxt/Nest + disposable PostgreSQL, 4 routes × 3 viewport widths, with overflow metrics. This is a browser simulation, **not** proof of real phone/tablet hardware, Japanese IME, contrast or screenshot parity with v0.3.

CAT doctor/guards/process-closure/TestModel/vectors/Queue/conformance: **not-run**.
