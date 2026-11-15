---
cat_version: '0.3'
kind: pi
id: eternalia.dictionary.spelling-collision.pi
status: confirmed
process: eternalia.dictionary.spelling-collision
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: []
semantic_contract: markdown-v2
language: ja
decision_ref: https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
---

# PI: eternalia.dictionary.spelling-collision.pi

本PIの真偽入力は既存語集合をフィルタし、下書き・保持中公開版のスペル一致を確認した結果である。実際のHTTP DTOやDBの表現形式を指定しない。

## 境界

| 相手Process | 方向 |
| --- | --- |
| eternalia.dictionary.author-write | 双方向 |

## 項目

| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.下書き同綴 | 受信 | 真偽 | 必須 |
| 入力.公開版同綴 | 受信 | 真偽 | 必須 |
| 出力.拒否 | 送信 | 真偽 | 必須 |

## 操作

| ID | 方向 | 起点 |
| --- | --- | --- |
| check | 受付 | 重複確認 |

## 制約

| 式 |
| --- |
