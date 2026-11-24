# Candidate: eternalia.dictionary.author-write

Status: candidate (unconfirmed; formal Gate not run)

## Source

- Product revision: `961d291f493df219ac36cf88108d302d680c51ef`
- Normative inputs: existing Confirmed PI/Process/TCE; 100/200 approved scope (no new product requirement).
- [Confirmed PI: dictionary.spelling-collision-implementation](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/Lifecycle/Works/New/eternalia.dictionary.spelling-collision-implementation/CAT/Confirmed/PI.md)
- [Implementation observation: packages/contracts/src/novel.ts](https://github.com/surumeneco/Eternalia_Novel/blob/961d291f493df219ac36cf88108d302d680c51ef/packages/contracts/src/novel.ts)

## Observation

### 同言語内の重複判定

- Observed source symbol: `hasSameLanguageSpellingCollision`.
- Proposed independent observations: 入力綴り・同言語の draft/published 綴り・他言語・自己更新、結果と永続化前後。

## Proposed semantics

- 事前に絞り込んだ同言語候補の draft または published の一致を使う。

## Unknown / next evidence

- This peer name is taken from an existing PI, not proof of a separately implemented Process. Resolve its semantic ownership and explicit provided/accepted operations against the confirmed source before authoring a new normative Process/PI. Do not mirror the target PI with invented events or add product-facing verdict fields.
- Bind each real operation/observation to exact source and independent execution identity; observe actual boundary inputs and effects. For DOM projections, distinguish the test observer's classification from the product interface. Add negative tests that fail when the actual connection or expected effect is absent.
- No runtime trace, peer source confirmation or implementation-conformance pass is asserted by this Candidate.
- CAT-TDD `fb3bd562684d80b016bf08b4cf21ad73079ea8fe` currently returns inconclusive unconditionally for integration-contract obligations. A valid independent verifier path is required; do not convert a receipt or successful UI test into a proof by assertion.
