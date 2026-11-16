---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.master-only-input
status: confirmed
process: eternalia.dictionary.master-only-input
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.master-only-input.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# Process: eternalia.dictionary.master-only-input

LG-05の作者向け通常入力では、所属言語の品詞マスタからのみ品詞を選び、マスタ外品詞の自由入力欄を提供しない。品詞マスタが空でも自由入力には切り替えない。既存データに保存されたマスタ外の旧値は、黙って削除・変換せず編集時に表示して保持する。選択可能な項目としては提供しない。これはUI入口の範囲であり、サーバー側の直接API入力やマスタ項目改名/削除に伴う参照整合性は別Work。

## 契約

閉世界: 真

このProcessの出力は作者の新規・編集フォームで使う品詞選択コントロールに限る。言語マスタ・既存下書きデータに書き込まない。

## 境界

| PI |
| --- |
| eternalia.dictionary.master-only-input.pi |

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
| 品詞欄表示 | eternalia.dictionary.master-only-input.pi/show |
