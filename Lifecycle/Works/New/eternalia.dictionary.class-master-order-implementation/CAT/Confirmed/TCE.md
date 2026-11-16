---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.class-order.tce
status: confirmed
process: eternalia.dictionary.class-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.class-order.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# TCE: eternalia.dictionary.class-order.tce

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| class.up.available | 順序変更 | `入力.方向 == "前" かつ 入力.移動可能` | 1 | `出力.順序変化 = 真` |
| class.up.boundary | 順序変更 | `入力.方向 == "前" かつ 否定(入力.移動可能)` | 1 | `出力.順序変化 = 偽` |
| class.down.available | 順序変更 | `入力.方向 == "後" かつ 入力.移動可能` | 1 | `出力.順序変化 = 真` |
| class.down.boundary | 順序変更 | `入力.方向 == "後" かつ 否定(入力.移動可能)` | 1 | `出力.順序変化 = 偽` |

## 適用境界

本TCEはマスタの1ステップ移動の可否だけを保証する。実配列の安定性、参照ID不変性、UI、保存・公開分離は独立した技術・領域別検査が必要。
