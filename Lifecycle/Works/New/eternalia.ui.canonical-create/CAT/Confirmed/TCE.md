---
cat_version: '0.3'
kind: tce
id: eternalia.ui.canonical-create.tce
status: confirmed
process: eternalia.ui.canonical-create
source_refs:
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs:
  - eternalia.ui.canonical-create.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
---
# TCE: eternalia.ui.canonical-create.tce

網羅要求: closed

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| create.denied | 作成入場判定 | `入力.作者 == 偽` | 1 | `出力.入場可 = 偽` |
| create.root | 作成入場判定 | `入力.作者 == 真 かつ 入力.作成範囲 == "root" かつ 入力.親関係 == "none" かつ 入力.種別整合 == 真` | 1 | `出力.入場可 = 真` |
| create.child | 作成入場判定 | `入力.作者 == 真 かつ 入力.作成範囲 == "child" かつ 入力.親関係 == "same" かつ 入力.種別整合 == 真` | 1 | `出力.入場可 = 真` |
| create.invalid | 作成入場判定 | `入力.作者 == 真 かつ (入力.種別整合 == 偽 または (入力.作成範囲 == "root" かつ 入力.親関係 != "none") または (入力.作成範囲 == "child" かつ 入力.親関係 != "same"))` | 1 | `出力.入場可 = 偽` |

## 適用境界
作成・重複エラー後の正規遷移、未保存意味の引継ぎ、実データ保護は別途実観測。
