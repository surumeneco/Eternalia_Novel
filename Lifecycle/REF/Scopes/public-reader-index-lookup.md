# Public-tree ID lookup — independent refactor scope

## Fixed source and authority

Retain adopted PB-03/PB-06/PB-10 anonymous published-snapshot and ancestor-visibility semantics. GitHub `develop@e9f639f99622275ce552437949b1592a17075f95` has `packages/contracts/src/novel.ts` blob `e629274ee03ae5c94527a1f815411f60a8f313f5`. This is behavior-preserving code work; it does not make new semantic commitments.

## Allowed source change

Cache the first occurrence of each ID in a local Map for *only one `publicTree` call*, sharing it with its descendant projection/ancestor/related-tip/etymology reference lookups. `toReader`, `publicAncestorsOf`, and other exported calls preserve their original signatures and behavior. The existing parent-chain cycle handling, publication/time visibility, same-series filtering, returned order, reader fields, hidden references and error paths remain unchanged. Only `packages/contracts/src/novel.ts` may be hand-edited; `packages/contracts/dist/novel.js` is compiler-generated locally and not published in the PR. No test change, CAT Queue change or threshold adoption.

## Unchanged test oracle

Seven original JUnit tests in `public-tree-volume-privacy`, `public-projection-matrix`, `related-tip-ancestor-privacy` and `word-etymology-public-projection`, including the existing 187-node case. Separate contracts exploratory regression and TypeScript compilation. Use pinned CAT-TDD 896cae83 baseline, refactor Guard and regression, with exact input revisions.

The optimization is intended to avoid repeat O(n) node ID scans in an O(n)-indexed tree traversal. No numerical speedup, SLA or formal Process Closure is inferred.
