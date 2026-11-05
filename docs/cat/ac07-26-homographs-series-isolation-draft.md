# CAT Draft — AC-07/26/27: 同綴語とシリーズ境界

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/40_開発・検証/400_受入検証計画.md (AC-07, AC-26, AC-27)
Scope: PostgreSQL統合テスト。新たな一意制約やUI仕様は定めない。

## Process / invariant

- 1シリーズ内の異なる言語に同一表記の単語を登録できる。
- 単語は表示文字列ではなく固有IDと所属言語IDで識別され、公開本文や意味を混同しない。
- 別シリーズにも同一表記の言語・単語を登録できる。匿名のシリーズ別公開ツリーは他シリーズの単語を混入させない。
- シリーズBを非公開にしても、シリーズAの公開単語は影響を受けない。

## Candidate vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | シリーズAの言語A1/A2に同名の公開単語 | 両方の異なるID・parentId・本文が公開ツリーに保持される |
| V2 | シリーズBの言語B1に同名の公開単語 | A/Bのツリーは混在しない |
| V3 | シリーズBを非公開 | Bの公開ツリーは空、Aは不変 |

## Evidence / Gate boundary

実PostgreSQL上の保存・公開・再読込・シリーズ分離を探索的に検証する。正規CAT TestModel/Queue/Red/Green/implementation-conformanceはこのDraftから生成しておらず、CIのGreenをCAT Gate合格とみなさない。
