# Candidate: eternalia.dictionary.author-edit

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: dictionary.class-master-order-implementation](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.dictionary.class-master-order-implementation/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/components/LanguageStructureEditor.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/components/LanguageStructureEditor.vue)
- [Confirmed PI: dictionary.master-only-author-input](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.dictionary.master-only-author-input/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/components/WordMeaningsEditor.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/components/WordMeaningsEditor.vue)

## Observation

### LanguageStructureEditor.vue の並べ替え操作

- Observed source symbol: `moveLanguageClass(classes.value, index, direction)`.
- Proposed independent observations: 操作前のID列・対象位置・方向、実操作後のID列。先頭/末尾の無効操作を含む。

### 意味編集と新規単語入力

- Observed source symbol: `wordClassInputPolicy`.
- Proposed independent observations: 実マスタと既存選択、表示された選択肢・disabled・保存値。新規入力側は studio.vue の選択欄も観測。

## Proposed semantics

- 並べ替えはドラフト側の品詞マスタ順序の変更。保存・公開は別境界。
- 既存参照の表示と新規選択の許可を分ける。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
