# CAT Draft — Author sibling ordering browser acceptance

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: WR-03 and CM-01/06 in `100_機能仕様.md`, AC-02/11/12/56 in `400_受入検証計画.md`.

## Process candidate

The author creates a private test subtree containing two sibling chapters under one part, opens the actual order editor, selects that parent and kind, moves the first chapter down, and sees a changed local order. Navigating away without applying asks for confirmation; cancellation retains the change. Explicit save applies the order via the real API and PostgreSQL, and a subsequent reload preserves the new order. Unrelated siblings and content remain unchanged.

## PI/TCE candidates

- PI-1: Reorder affects only siblings of the same parent and kind.
- PI-2: Unapplied changes are protected from silent navigation loss.
- PI-3: The persisted order is confirmed by fresh admin API readback.
- PI-4: Reordering does not alter chapter draft or published content.
- TCE: Playwright author UI + Nest/PostgreSQL assertions, synthetic author and disposable DB.

Formal CAT gates and normative Red/Green: **not-run**.
