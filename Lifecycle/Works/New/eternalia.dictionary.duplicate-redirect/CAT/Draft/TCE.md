---
cat_version: '0.3'
kind: tce
id: eternalia.dictionary.spelling-admission.tce
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

# TCE: eternalia.dictionary.spelling-admission.tce

網羅要求: closed

## 振る舞い

| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | ---: | --- |
| spelling.reject | 登録可否検査 | `観測.他語下書き同綴 または 観測.他語公開稿同綴` | 1 | `出力.登録可能 = 偽; 出力.重複先ID = 観測.衝突先ID` |
| spelling.allow | 登録可否検査 | `否定(観測.他語下書き同綴) かつ 否定(観測.他語公開稿同綴)` | 1 | `出力.登録可能 = 真` |

## 残る仕様・検証境界

- 本TCEの閉世界は**登録可否判定に限定**される。DB原子性、HTTP 409、UIの未保存引継ぎ、明示公開の独立性は既存DomainSpecとLG-08/PB-18の対象であり、本TCEの単独通過で全受入を保証しない。
- 衝突先IDは実際に同一言語で一致した既存単語でなければならない。複数件すでに不整合があるデータでどのIDを先に返すかの順序は確定事項としない。
- 登録可否の観測値が入出力PIに直接現れないため、ベクトル生成・技術Bindingで十分な可観測性を確保できない場合、CAT Gateは `blocked / inconclusive` のまま扱う。
