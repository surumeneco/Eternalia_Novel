---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.reader-spelling-order
status: confirmed
process: eternalia.dictionary.reader-spelling-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.reader-spelling-order.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# Process: eternalia.dictionary.reader-spelling-order

ユーザー承認済みLG-07の読者向け**単語のスペル順のみ**に限る比較結果の解釈Process。比較結果は対象言語の公開済み二単語のスペルから算出した値とする。**単語の手動位置や品詞マスタの並びを受け取らず、並べ替え基準として使用しない**。

## 契約

閉世界: 真

文字列の照合方法・ユーザー定義の照合順序・複数言語の見出し順・公開投影や他の検索条件は本Processの外で、LG-07とPB-03による独立した受入に従う。

## 境界

| PI |
| --- |
| eternalia.dictionary.reader-spelling-order.pi |

## 仕様状態

| ID | Domain |
| --- | --- |

## 観測能力

| ID | 情報源 | Domain |
| --- | --- | --- |

## 作用能力

| ID | 対象 | Domain |
| --- | --- | --- |

## 起点

| ID | 由来 |
| --- | --- |
| 順序確認 | eternalia.dictionary.reader-spelling-order.pi/compare |
