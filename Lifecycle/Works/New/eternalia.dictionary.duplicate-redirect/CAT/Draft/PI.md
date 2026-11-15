---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.spelling-admission.pi
status: draft
process: eternalia.dictionary.spelling-admission
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# PI: eternalia.dictionary.spelling-admission.pi

このPIは、単語保存の直前に同綴判定を依頼する抽象境界である。APIのHTTPメッセージ形式やDBの物理列ではない。作者UIの未保存意味データは別の仕様に属する。

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.author-write | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.言語ID | 受信 | 文字列 | 必須 |
| 入力.スペル | 受信 | 文字列 | 必須 |
| 入力.編集中単語ID | 受信 | 文字列 | 任意 |
| 出力.登録可能 | 送信 | 真偽 | 必須 |
| 出力.重複先ID | 送信 | 文字列 | 任意 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 登録可否検査 |

## 制約

| 式 |
| --- |
