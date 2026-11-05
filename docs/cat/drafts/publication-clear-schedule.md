# CAT Draft — Clear publication schedule in author management

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`; candidate `spec-implementation`. Inputs: PB-05 in `100_機能仕様.md`, AC-17/54/70 in `400_受入検証計画.md`, and the existing `setVisibility` contract. A null request timestamp is normalized to current time by the domain service when public; `canReadPublished` never treats a stored null timestamp as visible.

## Process candidate

A published series is scheduled for a future start and therefore invisible anonymously. The author opens `/studio/publication`, clears the date input for that series, and saves. The API must accept the action, assign an immediate effective start time, and restore anonymous access without republishing or changing content.

## PI/TCE candidates

- PI-1: Empty publication-management datetime means remove the future schedule and publish immediately (same operation available in `/studio`).
- PI-2: Invalid nonempty date is rejected; empty date is not misclassified as invalid.
- PI-3: The existing published snapshot remains unchanged.
- TCE: Playwright date clearing in publication management, then anonymous direct item 200 and unchanged content on disposable PostgreSQL with synthetic author.

No formal CAT doctor/guards/process-closure/TestModel/vectors/Queue/conformance or normative Red/Green is claimed.
