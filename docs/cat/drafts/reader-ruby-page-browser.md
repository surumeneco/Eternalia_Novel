# CAT Draft — Reader ruby and page navigation

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: WR-05/07 and DS-05 in `100_機能仕様.md`, AC-03/15/65/78 in `400_受入検証計画.md`.

A published chapter containing supported ruby syntax and a page marker renders the base text and reading as semantic HTML ruby. In paged reading mode, only the current page is shown. Previous/next controls are keyboard-accessible native buttons, expose page position via polite live text, and are disabled at boundaries. The reader does not expose the underlying author draft.

TCE: Playwright anonymous chapter reader with synthetic published fixture, ruby DOM assertions and page navigation. Formal CAT gates and normative Red/Green: **not-run**.
