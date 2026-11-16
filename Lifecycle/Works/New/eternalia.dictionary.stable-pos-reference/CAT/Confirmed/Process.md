---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.stable-pos-reference
status: confirmed
process: eternalia.dictionary.stable-pos-reference
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.stable-pos-reference.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# Process: 品詞マスタの安定ID参照と公開名称解決

2026-11-16利用者判断で、α版の品詞は言語マスタの安定IDを参照する。新規・編集単語の品詞IDは所属言語の下書きマスタに存在しなければならず、表示名は公開側からは公開言語マスタの名称を参照する。単語の品詞文字列を保存正本として扱わない。移行対象の実運用データは未確認であり、このProcessは移行処理を要件としない。

## 契約

閉世界: 真

公開表示名の解決は入力された品詞IDが公開マスタに存在するときだけ成功する。省略はラベルなしで、公開マスタに存在しないIDの下書き名称は絶対に公開しない。

## 境界

| PI |
| --- |
| eternalia.dictionary.stable-pos-reference.pi |

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
| 品詞名解決 | eternalia.dictionary.stable-pos-reference.pi/resolve |
