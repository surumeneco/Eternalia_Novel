---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.master-only-input.pi
status: confirmed
process: eternalia.dictionary.master-only-input
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# PI: eternalia.dictionary.master-only-input.pi

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.author-edit | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.マスタ登録あり | 受信 | 真偽 | 必須 |
| 入力.マスタ外旧値あり | 受信 | 真偽 | 必須 |
| 出力.選択有効 | 送信 | 真偽 | 必須 |
| 出力.旧値保持表示 | 送信 | 真偽 | 必須 |
| 出力.自由入力 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| show | 受付 | 品詞欄表示 |

## 制約

| 式 |
| --- |
