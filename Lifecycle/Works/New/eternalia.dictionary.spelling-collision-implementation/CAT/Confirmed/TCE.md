---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.spelling-collision.tce
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

# TCE: eternalia.dictionary.spelling-collision.tce

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| collision.none | 重複確認 | `否定(入力.下書き同綴) かつ 否定(入力.公開版同綴)` | 1 | `出力.拒否 = 偽` |
| collision.draft-only | 重複確認 | `入力.下書き同綴 かつ 否定(入力.公開版同綴)` | 1 | `出力.拒否 = 真` |
| collision.published-only | 重複確認 | `否定(入力.下書き同綴) かつ 入力.公開版同綴` | 1 | `出力.拒否 = 真` |
| collision.both | 重複確認 | `入力.下書き同綴 かつ 入力.公開版同綴` | 1 | `出力.拒否 = 真` |

## 適用境界

このTCEは衝突判定の4真偽状態を網羅する。候補スペルの文字列比較、対象言語/削除/自己ID除外、衝突先の既存単語ID、409応答、未保存意味の引継ぎ、公開/非公開・保存原子性については既存LG-08/PB-18/AC-09とDomainSpecの要求を保持し、別途実際の境界試験で検証する。
