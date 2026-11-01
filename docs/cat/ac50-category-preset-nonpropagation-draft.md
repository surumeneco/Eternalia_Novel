# CAT Draft — AC-50: カテゴリプリセットの新規Tipへのみ適用

Status: Draft (not Confirmed)
Source: forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md (ST-03、カテゴリ別プリセット非伝播規則), 40_開発・検証/400_受入検証計画.md (AC-50)
Scope: カテゴリのプリセットP1→P2変更と、その前後に作成したTipのTipSection独立性。

## Process / invariants

- 新規Tip作成時、所属カテゴリのその時点のプリセットをTipSectionの見出し・本文・順序へ一度だけ複製する。
- カテゴリのプリセット変更は、既存Tip/TipSectionの見出し・本文・順序・IDを自動変更しない。
- 変更後に作成した新規Tipには新しいプリセットだけを適用する。
- 作者の個別編集と公開操作は別Workで検証し、本検証ではプリセット複製のドメイン挙動に限定する。

## Candidate exploratory vectors

| Case | Input | Expected |
| --- | --- | --- |
| V1 | カテゴリP1でTip A作成 | AのTipSectionはP1を保持 |
| V2 | カテゴリをP2に更新 | AのTipSectionのID・内容・順序は不変 |
| V3 | P2でTip B作成 | BのTipSectionはP2を保持しAと独立 |
| V4 | P2を再変更 | A/Bの既存TipSectionはどちらも自動変更されない |

CAT機械Gate・正式生成テストは未実行。これは既存採用仕様の探索的ドメイン検証である。
