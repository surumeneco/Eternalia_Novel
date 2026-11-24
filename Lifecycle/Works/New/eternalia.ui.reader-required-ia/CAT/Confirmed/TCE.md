---
cat_version: '0.3'
kind: tce
id: eternalia.ui.reader-required-ia.tce
status: confirmed
process: eternalia.ui.reader-required-ia
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.reader-required-ia.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# TCE: eternalia.ui.reader-required-ia.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| reader.required.ia | 公開資料閲覧 | `入力.操作 == "正規設定集と辞書"` | 1 | `出力.名称項目検索 = "適合"; 出力.タグ絞込 = "適合"; 出力.名称順 = "適合"; 出力.非公開除外 = "適合"; 出力.設定項目本文 = "適合"; 出力.文法導線 = "適合"` |

## 適用境界
100 ST-09・200 §6.1/§8: 正規カテゴリ一覧で名称・公開項目検索、タグ絞込、名称順、非公開除外、設定詳細の公開項目本文、言語詳細の公開文法導線を保持。既存公開投影・親子・他系列拒否は維持する。 実際の disposable HTTP fixture・Chromium の操作とDOM観測で判定する。
