---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.reader-spelling-order.tce
status: confirmed
process: eternalia.dictionary.reader-spelling-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.reader-spelling-order.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# TCE: eternalia.dictionary.reader-spelling-order.tce

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| order.left | 順序確認 | `入力.スペル比較 == "左前"` | 1 | `出力.表示順 = "左前"` |
| order.equal | 順序確認 | `入力.スペル比較 == "同順位"` | 1 | `出力.表示順 = "同順位"` |
| order.right | 順序確認 | `入力.スペル比較 == "右前"` | 1 | `出力.表示順 = "右前"` |

## 適用境界

このTCEはスペル比較の結果を単語一覧の前後関係に変換する決定のみ保証する。公開投影の秘匿、言語別の所属、実際のスペル照合、DOM上の整列と品詞フィルタは別の領域試験で検査し、正規Gate成功から推定しない。
