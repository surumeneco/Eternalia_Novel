# Candidate: eternalia.ui.admin

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: ui.admin-navigation](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.ui.admin-navigation/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/components/AdminEditBridge.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/components/AdminEditBridge.vue)

## Observation

### 正規管理編集ルートへの入場

- Observed source symbol: `auth / valid / canonical-target`.
- Proposed independent observations: 実HTTP認証、対象ID・kind・祖先系列、旧クエリ、正規エディタ表示/拒否。middleware の認証も別に観測。

## Proposed semantics

- 正規経路だけで対象を特定し、認証・対象・系列・種類が一致する場合に編集する。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
