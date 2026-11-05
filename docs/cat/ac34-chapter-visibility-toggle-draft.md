# CAT Draft — AC-34: 公開済み章の非公開化と再公開

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (PB-10〜12), 40_開発・検証/400_受入検証計画.md (AC-34)
Scope: 公開済みの章を作者が非公開化し、既存公開スナップショットを保持したまま再公開する。

## Process / invariants

- 章と祖先を明示公開した後、匿名直URLで公開版本文が読める。
- 作者が章を非公開にすると、匿名直URLとシリーズ公開ツリーから章が消え、作者の下書き・公開スナップショットは保持される。
- 作者が明示再公開すると、公開スナップショットの本文を匿名直URLで再取得できる。非公開・再公開は下書きの暗黙公開を伴わない。
- 本Workは章の公開切替のみであり、予約公開時刻や別アカウント権限は対象外。

## Candidate exploratory vectors

| Case | Action | Expected |
| --- | --- | --- |
| V1 | 祖先と章を公開 | 匿名200、公開版本文表示 |
| V2 | 章のみ非公開 | 匿名404、作者DBにpublished保持 |
| V3 | 章を明示再公開 | 匿名200、元の公開版本文復帰 |

CAT機械Gate、実Discord認証、予約日時境界は未実行。
