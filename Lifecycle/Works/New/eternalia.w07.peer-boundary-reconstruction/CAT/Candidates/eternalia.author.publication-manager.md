# Candidate: eternalia.author.publication-manager

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: publication.author-status-on-tip-move](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.publication.author-status-on-tip-move/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/pages/studio/publication.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/pages/studio/publication.vue)

## Observation

### 公開管理の実効公開状態

- Observed source symbol: `ancestry / published / status`.
- Proposed independent observations: tip の公開版親と現在のドラフト親、両祖先の公開状態、一覧ステータス・公開フィルタ。

## Proposed semantics

- 公開版の親を辿る。ドラフトの移動自体で公開版の所属を変更しない。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
