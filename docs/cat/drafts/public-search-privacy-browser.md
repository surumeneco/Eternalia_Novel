# CAT Draft — Public search excludes private content

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: PB-03/10–18 and CM-03 in `100_機能仕様.md`, AC-20/21/45/70 in `400_受入検証計画.md`.

Anonymous search must operate only on the published tree of the selected public series. It can find published title/body, word meanings and public tags, and can filter by domain, but must not reveal hidden descendants or unpublished draft text in results. The browser search view must not issue admin requests or embed private titles.

TCE: Playwright anonymous search against disposable seeded PostgreSQL, public word versus hidden Tip, domain filtering and no private-text leakage. Formal CAT gates and normative Red/Green: **not-run**.
