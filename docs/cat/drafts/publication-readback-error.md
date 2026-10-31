# CAT Draft — Publication mutation acknowledgement after failed reload

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Normative inputs: `100_機能仕様.md` CM-05/06, `400_受入検証計画.md` AC-11/12/14/64.

## Process candidate

A publication management mutation is accepted by the API, but the subsequent author-library reload fails (e.g. temporary 503). The UI must not claim that the final visible state is confirmed. It must show a reload error, leave the current editor state intact, and permit an explicit retry. This is an **ambiguous post-write readback**, not a failed write or an opportunity to resend blindly.

## PI/TCE candidates

- PI-1: Successful POST + failed GET does not produce a misleading success acknowledgement.
- PI-2: The UI reports the readback failure and allows a later reload to reconcile the authoritative state.
- PI-3: No automatic duplicate POST is issued.
- TCE: Playwright route interception of the GET following an accepted publication-schedule POST; assert error and absence of success; unroute, reload and restore the schedule.

Formal CAT gates and normative Red/Green: **not-run**.
