# CAT Draft — AC-25: 2シリーズ間の設定・辞書・年代データ分離

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (SR-01〜04, ST-03, LG-05〜08, TL-01〜06, PB-10〜12), 40_開発・検証/400_受入検証計画.md (AC-25)
Scope: A/B各シリーズにカテゴリ→Tip、言語→Word、年代区分→Eventを登録し、匿名公開ツリーを比較する。

## Process / invariants

- A/Bの同名の設定・単語・出来事はシリーズごとに別IDと親子関係を持ち、公開ツリーに相互混入しない。
- A/Bを公開したとき、各シリーズの設定・辞書・年代の項目は自分のシリーズにのみ現れる。
- Bのカテゴリだけを非公開にしても、A全体とBの他ドメインは維持され、Bのカテゴリ・Tipのみ匿名公開から除外される。
- 本Workはドメイン間の所属・公開境界の検証であり、言語構造・年代換算・実作者UI全機能の受入を意味しない。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | A/Bそれぞれにカテゴリ/Tip、言語/Word、年代区分/Eventを登録して公開 | 各公開ツリーは自身のIDのみ保持 |
| V2 | Bのカテゴリを非公開に変更 | Bカテゴリ/Tipは消えるがBのWord/EventとA全体は維持 |
| V3 | A/Bに同名の要素を登録 | ID・内容・所属シリーズが混在しない |

正式CAT Gate、実Discord認証、年代換算等は未実施。
