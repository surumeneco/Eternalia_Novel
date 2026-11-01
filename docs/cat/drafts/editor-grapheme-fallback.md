---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.grapheme-fallback
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: Segmenter非対応WebViewの文字素境界

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor | textarea UTF-16 offsetのpage/ruby挿入 |
| eternalia.reader | 読者側と一致するinline markup grammar |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| editor.fallback.kana | Intl.Segmenter不在時に分解かなと結合濁点の間へ挿入するとき | page/ruby挿入を拒否し文字素を分断しない | EDIT-GRAPHEME-FALLBACK-01 |
| editor.fallback.emoji | Segmenter不在時にZWJ絵文字・skin tone修飾の途中へ挿入するとき | page/ruby挿入を拒否する | EDIT-GRAPHEME-FALLBACK-02 |
| editor.fallback.flags | Segmenter不在時にregional indicator列を扱うとき | 2 indicatorの旗内部は拒否し、完成した旗同士の境界は許可する | EDIT-GRAPHEME-FALLBACK-03 |
| editor.fallback.tag | Segmenter不在時にU+E0020〜U+E007Fのsubdivision flag tag列を扱うとき | tag途中の挿入を拒否し、完成後の境界は許可する | EDIT-GRAPHEME-FALLBACK-04 |
| editor.fallback.regression | 通常文字・CRLF・supplementary surrogate境界を扱うとき | 従来の合法挿入と不正境界拒否を保持する | EDIT-GRAPHEME-FALLBACK-05 |

## 境界と状態

既存EDIT-GRAPHEME-FALLBACK-01〜05を意味変更せず構造化したTASK-20261101-009のCAT Draft。Intl.Segmenter利用可能時の挙動を変えず、fallbackは日本語結合文字・絵文字・旗などを保守的に扱うが、全Unicode文字素の完全な分割防止は保証しない。Android日本語IME・native Undo/Redo・モバイル視覚検証・正式CAT Process/PI/TCEと機械Gateはnot-run。Confirmed・マージ・デプロイを意味しない。
