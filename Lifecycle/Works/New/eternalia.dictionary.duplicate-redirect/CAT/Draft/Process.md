---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.spelling-admission
status: draft
process: eternalia.dictionary.spelling-admission
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs:
  - eternalia.dictionary.spelling-admission.pi
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.dictionary.spelling-admission

LG-08の同一言語内重複拒否を、単語の新規登録・改名保存に共通する書込可否判定として表現するための**設計Draft**。既存単語の編集UIや公開版の更新操作自体はこのProcessには含めない。公開済みX・未公開下書きYの食い違いから新規Xを許可する経路を排除することが目的であり、新しいUI仕様を採用するものではない。

## 契約

閉世界: 真

同一言語・未削除・編集中の自己ID以外の既存単語について、下書きスペルまたは保持中の公開稿スペルが登録候補と一致すれば新規登録・改名保存を許可しない。別言語・論理削除済み・自己IDは衝突集合から除外する。観測能力の具体的取得方法・衝突先選択のID順序は設計／適合検証の責務とし、この表現から追加の正本決定を推定しない。

## 境界

| PI |
| --- |
| eternalia.dictionary.spelling-admission.pi |

## 仕様状態

| ID | Domain |
| --- | --- |

## 観測能力

| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.他語下書き同綴 | 同一言語で未削除かつ自己以外の登録済み単語の下書きスペル | 真偽 |
| 観測.他語公開稿同綴 | 同じ登録済み単語の明示公開スナップショットに保持されたスペル | 真偽 |
| 観測.衝突先ID | 一致した登録済み単語の既存ID（衝突がある場合） | 文字列 |

## 作用能力

| ID | 対象 | Domain |
| --- | --- | --- |

## 起点

| ID | 由来 |
| --- | --- |
| 登録可否検査 | eternalia.dictionary.spelling-admission.pi/check |
