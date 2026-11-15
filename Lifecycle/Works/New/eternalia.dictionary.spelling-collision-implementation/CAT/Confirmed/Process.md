---
cat_version: '0.3'
kind: process
id: eternalia.dictionary.spelling-collision
status: confirmed
process: eternalia.dictionary.spelling-collision
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: 
  - eternalia.dictionary.spelling-collision.pi
semantic_contract: markdown-v2
language: ja
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
---

# Process: eternalia.dictionary.spelling-collision

ユーザーが承認したLG-08同綴衝突条件を、**二つの真偽観測を受けた純粋な拒否判定**に限定して形式化する。既存IDの特定・同一言語抽出・論理削除・自己除外・公開版の保有判定は呼出元が行う。このProcessだけで登録原子性/HTTP409/既存語編集UI/公開投影を保証しない。

## 契約

閉世界: 真

- 入力.下書き同綴: 未削除・同一言語・自己以外の登録済み語の下書きスペルが候補と一致。
- 入力.公開版同綴: 同一集合内の語が保持する公開版スペルが候補と一致（非公開化しただけでは消えず、明示更新か適法な論理削除で解除）。
- いずれか真なら拒否、双方偽なら許可。これら観測の算出・衝突先IDと保存原子性はLG-08及び個別実装/受入検査の義務として残す。

## 境界

| PI |
| --- |
| eternalia.dictionary.spelling-collision.pi |

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
| 重複確認 | eternalia.dictionary.spelling-collision.pi/check |
