# Candidate: eternalia.dictionary.reader

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: dictionary.reader-spelling-order-implementation](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.dictionary.reader-spelling-order-implementation/CAT/Confirmed/PI.md)
- [Implementation observation: apps/web/app/components/ReaderDomainListing.vue](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/apps/web/app/components/ReaderDomainListing.vue)

## Observation

### 正規辞書一覧でのソート

- Observed source symbol: `compareDictionaryWordSpelling`.
- Proposed independent observations: 実際の公開語のタイトル・読み・品詞・選択フィルタと DOM 上の語順。比較関数単体と実ルートの結線を別々に観測。

## Proposed semantics

- 正規ルートの実ソートで comparator が使われる。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
