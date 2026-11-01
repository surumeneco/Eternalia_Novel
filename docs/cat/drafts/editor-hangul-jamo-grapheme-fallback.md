---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.hangul-jamo
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: Hangul Jamo grapheme fallback

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor.markup | textarea UTF-16選択offsetとruby/page挿入 |
| eternalia.editor.fallback | Segmenter非対応時のHangul書記素境界 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| jamo.lvt | Segmenter非対応でL/V/Tの連結Jamo cluster内にcaretがあるとき | GB6–GB8の内部境界にruby/page markupを挿入しない | EDIT-GRAPHEME-18 |
| jamo.precomposed | precomposed LV/LVT音節と後続T Jamoの間にcaretがあるとき | 同一書記素として内部挿入を拒否する | EDIT-GRAPHEME-19 |
| jamo.complete | 完全なHangul cluster直後にcaretがあるとき | 通常の挿入可能境界を維持する | EDIT-GRAPHEME-20 |
| jamo.adjacent | 二つの完全なclusterの間にcaretがあるとき | cluster間の有効な挿入境界を維持する | EDIT-GRAPHEME-21 |

## 検証境界

`각` の二つの内部境界と `각` の内部境界は拒否するが、cluster終端や隣接cluster間の境界は許容する。Unicode結合記号判定だけでGB6–GB8を代替しない。既存の日本語・絵文字の処理とUTF-16 offset契約を維持する。

CAT状態は**Draft**。正式Process/PI/TCEと機械Gate、実Android/Gboard IME、native Undoの受入はnot-run。既存Nodeテスト/CIを規範Confirmedと混同しない。
