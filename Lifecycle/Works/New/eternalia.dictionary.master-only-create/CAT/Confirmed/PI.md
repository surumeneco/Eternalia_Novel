---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.master-only-create.pi
status: confirmed
process: eternalia.dictionary.master-only-create
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# PI: 新規単語の品詞マスタ照合

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.author-create | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.品詞指定あり | 受信 | 真偽 | 必須 |
| 入力.品詞が所属言語マスタ内 | 受信 | 真偽 | 必須 |
| 出力.登録可 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 品詞照合 |

## 制約

| 式 |
| --- |
