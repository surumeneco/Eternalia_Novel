---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.class-order.pi
status: confirmed
process: eternalia.dictionary.class-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# PI: eternalia.dictionary.class-order.pi

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.author-edit | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.方向 | 受信 | 列挙{前, 後} | 必須 |
| 入力.移動可能 | 受信 | 真偽 | 必須 |
| 出力.順序変化 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| move | 受付 | 順序変更 |

## 制約

| 式 |
| --- |
