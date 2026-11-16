---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.master-only-create
status: confirmed
process: eternalia.dictionary.master-only-create
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.master-only-create.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# Process: 新規単語の品詞マスタ登録検証

LG-05の採用済み要求「単語の品詞は所属言語の品詞マスタから選び、未登録品詞を単語入力から新設しない」の新規単語作成境界を担当する。作者UIではなく、直接API入力が通るドメインの作成処理で非空の品詞を検査する。新規単語に指定された各意味の非空品詞は、その単語の所属言語の現在の下書き品詞マスタに存在しなければ拒否する。空の品詞は従来どおり未指定として扱う。既存単語の編集・過去のマスタ外値の移行・マスタの改名削除は別Workであり、本Processが解決したとしない。

## 契約

閉世界: 真

このProcessは各意味について登録可否の判断を返し、読者の公開版を変更しない。作成APIは全意味の非空品詞が許可された場合のみ新規単語を保存する。

## 境界

| PI |
| --- |
| eternalia.dictionary.master-only-create.pi |

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
| 品詞照合 | eternalia.dictionary.master-only-create.pi/check |
