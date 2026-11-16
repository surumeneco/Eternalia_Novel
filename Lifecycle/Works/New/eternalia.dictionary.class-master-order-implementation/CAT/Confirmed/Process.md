---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.class-order
status: confirmed
process: eternalia.dictionary.class-order
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
refs: ["eternalia.dictionary.class-order.pi"]
semantic_contract: markdown-v2
language: ja
decision_ref: https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
---

# Process: eternalia.dictionary.class-order

LG-05の言語単位**品詞マスタの手動順**を、現在位置から一つ前/後へ動かせるかどうかという境界判断として表現する。品詞マスタの追加時は順序列末尾へ追加される。言語の公開版は明示公開まで変更せず、単語のスペル順へ影響しない。

## 契約

閉世界: 真

入力の移動可能性は現在位置・列長・方向から算出される。個々のIDと名称を保持し、所属言語と意味参照は変えない。品詞名改名・削除の整合処理は範囲外。

## 境界

| PI |
| --- |
| eternalia.dictionary.class-order.pi |

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
| 順序変更 | eternalia.dictionary.class-order.pi/move |
