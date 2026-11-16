---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.reader-spelling-order.pi
status: confirmed
process: eternalia.dictionary.reader-spelling-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# PI: eternalia.dictionary.reader-spelling-order.pi

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.reader | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.スペル比較 | 受信 | 列挙{左前, 同順位, 右前} | 必須 |
| 出力.表示順 | 送信 | 列挙{左前, 同順位, 右前} | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| compare | 受付 | 順序確認 |

## 制約

| 式 |
| --- |
