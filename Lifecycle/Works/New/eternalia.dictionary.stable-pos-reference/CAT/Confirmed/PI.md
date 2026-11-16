---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.stable-pos-reference.pi
status: confirmed
process: eternalia.dictionary.stable-pos-reference
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# PI: 公開品詞名の安定ID解決

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.public-reader | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.品詞ID指定あり | 受信 | 真偽 | 必須 |
| 入力.公開マスタ内に同IDあり | 受信 | 真偽 | 必須 |
| 出力.公開名を表示 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| resolve | 受付 | 品詞名解決 |

## 制約

| 式 |
| --- |
