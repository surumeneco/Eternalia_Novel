---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.halfwidth-kana
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: halfwidth kana grapheme fallback

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor.markup | textarea UTF-16選択offsetとruby/page挿入 |
| eternalia.editor.fallback | Intl.Segmenter非対応時の書記素境界 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| kana.voiced | Segmenterがなく半角カナbaseとU+FF9Eの間にcaretがあるとき | ruby/page markupを内部境界に挿入しない | EDIT-GRAPHEME-14 |
| kana.semivoiced | Segmenterがなく半角カナbaseとU+FF9Fの間にcaretがあるとき | ruby/page markupを内部境界に挿入しない | EDIT-GRAPHEME-15 |
| kana.complete | 半角カナと濁点/半濁点の完全なcluster直後にcaretがあるとき | 通常の挿入可能境界を維持する | EDIT-GRAPHEME-16 |
| kana.segmenter | Intl.Segmenterが利用可能なとき | 既存のSegmenter判定とUTF-16 offset契約を維持する | EDIT-GRAPHEME-17 |

## 検証境界

`ｶﾞ`、`ﾊﾟ` の半角濁点/半濁点はUnicode modifier letterであり、結合記号`\\p{M}`だけでは内部境界を検出できない。既存の日本語IMEイベント、native Undo、Android Gboard、長文レイアウトの実機受入は別の検証条件。

CAT状態は**Draft**。正式なProcess/PI/TCE確認、機械Gate、実Android/IME/Undo受入はnot-run。既存Nodeテスト/CIを規範Confirmedと混同しない。
