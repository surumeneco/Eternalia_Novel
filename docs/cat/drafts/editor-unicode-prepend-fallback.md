---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.grapheme-prepend-fallback
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs:
  - eternalia.editor.grapheme-fallback
semantic_contract: markdown-v2
language: ja
---

# DomainSpec Draft: Unicode GB9b Prepend文字素境界

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor | Intl.Segmenter非対応環境のpage/ruby挿入境界 |
| eternalia.reader | UTF-16 offsetと表示文字素の一貫性 |

## 規則（未確認）
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| editor.fallback.prepend.arabic | U+0600またはU+06DD Prependの直後に対応する文字が続く | Unicode GB9bに従いPrependと後続文字の間へのpage/ruby挿入を拒否する | EDIT-PREPEND-01/02 |
| editor.fallback.prepend.syriac | U+070F Prependの直後にシリア文字が続く | 同様に文字素を分断しない | EDIT-PREPEND-03 |
| editor.fallback.prepend.boundary | 完成したPrepend文字素と後続の別文字素の境界 | page挿入を許可しUTF-16 offsetを維持する | EDIT-PREPEND-04 |

## 境界・検証状態

- この文書は新規の**Draft**。Unicode UAX #29 GB9bのPrepend境界を候補仕様とし、既存の確認済み挙動を無断変更しない。
- Node 22 `Intl.Segmenter`で3例が各1文字素になることを参照し、現αベースの [Actions #42639079264](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42639079264) で3件の期待したRedを実測した。候補実装 `dc98cbfaee1d444ee7e358151b1b8f906ea0da9f` はGB9b Prependの限定した集合を保護し、同一HEADの [Actions #42639525786](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42639525786) で該当4件Green、CI 4/4成功を実測した。Unicode全範囲に対する完全なgrapheme分割器を証明するものではない。
- これはfeature上の暫定変更と探索的なCI証拠であり、仕様のConfirmed承認ではない。正式Process/PI/TCE・Process Closure・Model/Implementation Conformance・vectors/Queueは未実施。Android/Gboard/IME実機検証も未実施。CIでのChromium検証は今回の3種類の文字素挿入を実機上で再現してはいない。
