# CAT Draft — Four-domain author visibility / anonymous reader E2E

Status: **Draft, not Confirmed**. Task `TASK-20261031-001`, candidate `spec-implementation` flow. No formal CAT gates have been run.

## Source requirements

- `100_機能仕様.md`: PB-01/03/05/10–18; ancestor and self visibility; chapter, TipSection, Word/Grammar, Periodization/Event independent publication.
- `400_受入検証計画.md`: AC-16/17/20/21/33–45/69/70; `430_α版段階的実装計画・引継ぎ_20261029.md` A6/W6.1.
- Synthetic author session only, disposable PostgreSQL; not Discord real identity verification.

## Process and PI candidates

Given already published nodes in each domain (chapter, TipSection, Word, Event), an authorized author opens the node in the actual Nuxt studio, toggles it private, and sees a refreshed state. Anonymous direct API and browser views must not disclose the item. The author restores visibility, and the original published snapshot must become anonymously readable again. A visibility change must not implicitly alter the published content.

- PI-1: Each domain has its own effective visibility.
- PI-2: Private items return 404 to anonymous direct item requests and do not reveal their titles in direct reader UI.
- PI-3: Reopening visibility restores previously published data without a new publish.
- PI-4: An author's visibility operation does not mutate the saved draft or published snapshot body.

## TCE candidate

For each `[chapter, tipSection, word, event]`, Playwright opens `/studio?item=id`, toggles visibility off/on, asserts UI state and anonymous API 404/200, and checks public body is unchanged. The original visibility is restored to avoid contaminating later HTTP tests.

Formal process-closure/TestModel/vectors/Queue/guard/conformance: **not-run**; browser/CI results are separate evidence.
