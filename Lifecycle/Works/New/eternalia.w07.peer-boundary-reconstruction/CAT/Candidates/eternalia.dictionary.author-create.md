# Candidate: eternalia.dictionary.author-create

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: dictionary.master-only-create](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.dictionary.master-only-create/CAT/Confirmed/PI.md)
- [Implementation observation: packages/contracts/src/novel.ts](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/packages/contracts/src/novel.ts)

## Observation

### 単語の生成時の品詞参照検証

- Observed source symbol: `isRegisteredCreateWordPartOfSpeech`.
- Proposed independent observations: 対象言語のドラフトマスタID集合、要求中の意味のID、成功または拒否、永続化前後の状態。

## Proposed semantics

- 未指定は許可し、非登録IDを拒否。別言語のマスタでは代替しない。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
