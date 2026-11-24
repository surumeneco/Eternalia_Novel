# Candidate: eternalia.reader.chapter

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: ui.chapter-return](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.ui.chapter-return/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/components/ReaderDomainDetail.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/components/ReaderDomainDetail.vue)

## Observation

### 章詳細の目次遷移

- Observed source symbol: `publicNodeRoute(tree??[],item.parentId)`.
- Proposed independent observations: 公開章の親ID、目次リンクhref、クリック後URLと表示見出し。

## Proposed semantics

- 所属部の章一覧に遷移。所属部の章一覧はURLを判定した意味分類であり、製品が返す文字列ではない。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
