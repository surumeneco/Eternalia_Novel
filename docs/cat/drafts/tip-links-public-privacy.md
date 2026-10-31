# CAT Draft — Related settings and public-reference privacy

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: ST-06–10 and PB-03/10–18 in `100_機能仕様.md`, AC-33/34/35/69/70 in `400_受入検証計画.md`.

Within one series, an author can tag a Tip and add another Tip as an ordered related reference in the actual browser editor. Saving a draft does not publish it. After explicit publication, anonymous projection includes the tags and only related Tips that are effectively public. If a related Tip becomes private, its title and ID must disappear from the reader-facing related-reference list without altering the author's saved relationship.

TCE: Playwright TipLinksEditor, real admin/public API and disposable PostgreSQL with synthetic author; no real Discord OAuth2. Formal CAT gates and normative Red/Green: **not-run**.
