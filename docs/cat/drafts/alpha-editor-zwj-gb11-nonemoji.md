---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.zwj-gb11-nonemoji
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha editor: conditional GB11 ZWJ boundary in Segmenter fallback (CAT Draft)

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.editor | `insertManuscriptMarkup` の `Intl.Segmenter` 非対応WebView用fallback |
| eternalia.reader | Unicode grapheme境界を保ったページ/ルビ編集とUTF-16 selection offsets |

修正前のfallbackは `previous === U+200D` を無条件に分割禁止としていた。一方、Unicode GB11のZWJ後方接続は、ZWJの前にExtended_Pictographicがあり、次がExtended_Pictographicである等の文脈に依存する。通常の文字 `a‍b` や `a‍💻` ではZWJ直後が正当なgrapheme境界となり得る。`Intl.Segmenter('ja', {granularity:'grapheme'})` の観測を独立参照とし、emoji ZWJ `👩‍💻` の非分割を維持する。PR #9のIndic conjunct、PR #10のPrependとは異なる境界。

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| editor.gb11.nonemoji-letter | fallback有効、`a + ZWJ + b` のZWJ直後 | 正当なgrapheme境界としてpage挿入を許可する | EDITOR-GB11-01 |
| editor.gb11.nonemoji-emoji | fallback有効、`a + ZWJ + 💻` のZWJ直後 | 前方がExtended_Pictographicでないためpage挿入を許可する | EDITOR-GB11-02 |
| editor.gb11.emoji-control | fallback有効、`👩 + ZWJ + 💻` のZWJ直後 | emoji ZWJ grapheme内部としてpage/ruby挿入を拒否する | EDITOR-GB11-03 |
| editor.gb11.ruby | `a + ZWJ` の完全graphemeを選択 | ルビ挿入を許可し、UTF-16 offsetsを保持する | EDITOR-GB11-04 |

## Test model / TCE

- EDITOR-GB11-01 (旧Red→候補Green): `前a‍b後` のUTF-16 offset 3でpageを挿入できる。
- EDITOR-GB11-02 (旧Red→候補Green): `前a‍💻後` のoffset 3でpageを挿入できる。
- EDITOR-GB11-03 (Green): `前👩‍💻後` のZWJ後、emoji内部でpage/rubyを拒否する。
- EDITOR-GB11-04 (旧Red→候補Green): `前a‍b後` の範囲[1,3]をruby化できる。

## 検証・Gate

Node 22 `Intl.Segmenter` の境界を参照した合成テストで、現αと結合したHEAD `3b5717600bd56a581000d4483267c9031c1d3f81` の [Actions #42642136977](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42642136977) は期待した3件のRedを記録。候補修正HEAD `ea3fccd501197218eaae124d6fe65cd9e919961a` の [Actions #42642522936](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42642522936) は4/4 CI成功、同4ケースGreen。Unicode UAX #29 GB11の完全準拠や実Android WebView・日本語IME・Chromiumでの当該Unicode入力操作は別途確認が必要。

**Draft / not Confirmed.** 規範CAT Process/PI/TCEの確認、process-closure、TestModel、model-conformance、vectors、Queue、current-item、implementation-conformanceおよび実機受入は not-run。候補コードはfeature branchにのみ反映。Confirmedへの昇格、`develop`/`main`へのマージ承認、実機の受入完了を意味しない。
