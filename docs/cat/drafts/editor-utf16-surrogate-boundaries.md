---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.utf16-markup-boundaries
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs:
  - eternalia.editor.grapheme-fallback
  - eternalia.editor.halfwidth-kana
  - eternalia.editor.hangul-jamo
semantic_contract: markdown-v2
language: ja
---

# Alpha editor: UTF-16 surrogate boundary integrity (CAT Draft)

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor | textarea UTF-16選択端点・ruby/page挿入の完全性 |
| eternalia.reader | public RichContent ruby token文法との一致 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| editor.utf16.surrogate | rubyの選択開始・終了位置、またはpageの挿入開始位置がUTF-16 high/low surrogateの間にあるとき | 文字を書き換える位置での挿入を拒否し原文を変更しない | apps/web/tests/manuscript-markup.test.mjs |
| editor.utf16.valid | 補助平面文字の前後または完全な選択のとき | 正当なruby/page挿入を維持する | apps/web/tests/manuscript-markup.test.mjs |
| editor.newline | ruby選択がCR/LF/CRLF/U+0085/U+2028/U+2029を含むとき | 不正なinline rubyへ変換しない。CRLF内部のcaretも拒否する | apps/web/tests/manuscript-markup.test.mjs |
| reader.ruby.grammar | readerが改行または予約delimiterを含むruby tokenを読むとき | 不正tokenはliteralとして扱い後続の有効tokenを読み取る | apps/web/tests/rich-content-tokenizer.test.mjs |
| editor.page.token | pageの挿入開始位置が既存[[page]]内部にあるとき | 破壊する挿入を拒否する。pageは選択文字を置換しないため、終了位置がtoken内部にあってもそのことだけでは拒否しない | apps/web/tests/manuscript-markup.test.mjs |
| editor.ruby.token | 選択端点が有効な既存ruby token内部にあるとき | reader grammarと同じtoken境界で挿入を拒否する | apps/web/tests/manuscript-markup.test.mjs |
| editor.grapheme | rubyの選択開始・終了位置、またはpageの挿入開始位置がgrapheme cluster内部にあるとき | 結合仮名・ZWJ emoji・regional indicatorを分断しない。非対応runtimeのfallbackは限定的とする | apps/web/tests/manuscript-grapheme-fallback.test.mjs |
| editor.kind | JavaScript callerが未対応の挿入kindを渡したとき | nullを返しrubyへ暗黙変換しない | apps/web/tests/manuscript-markup.test.mjs |

Status: **Draft**, not Confirmed. Leaf: TASK-20261101-009.

The author editor uses textarea UTF-16 offsets. Ruby insertion replaces the selected range, so both start and end must be valid UTF-16 boundaries. Page-marker insertion inserts only at start and never replaces the selected text, so only start is a mutation boundary; end must still be a valid in-range integer but may lie inside an existing token or grapheme. An invalid mutation boundary must not change the manuscript. Complete supplementary characters and ordinary Japanese text remain editable.

TCE:
- A page marker inside the surrogate pair of `𠮷` returns null.
- Ruby selection containing only one surrogate half returns null.
- Ruby around the complete `𠮷` remains valid.
- Page marker before or after the complete character remains valid.
- Ruby selection spanning CR, LF, CRLF, Unicode line separator (U+2028), paragraph separator (U+2029), or next-line (U+0085) is rejected rather than converted into invalid inline ruby.
- Page marker insertion at valid UTF-16 boundaries remains unaffected by line-break normalization.
- A collapsed caret between CR and LF must not split the CRLF sequence for either ruby or page insertion; the caret immediately after CRLF remains valid.

Formal CAT machine Gates and real browser/IME/Android tests: **not-run**. No merge or deployment.

Reader parity: the public RichContent ruby tokenizer must not interpret a ruby token whose base or reading spans CR, LF, U+0085, U+2028, or U+2029. Previously stored malformed inline ruby is rendered as literal text instead. Ordinary ruby and page markers remain valid. This parser check is independent of the author editor's insertion guard.

Reserved page marker integrity: a caret within an existing `[[page]]` token must not insert ruby or another page marker into its interior. A ruby selection spanning a complete page marker must be rejected. Insertion immediately before or after the marker remains valid.

Existing ruby-token integrity: page insertion with its insertion caret inside a valid `｜base《reading》` token, or ruby replacement with either endpoint inside it, must be rejected to prevent corruption. A noncollapsed page selection may extend into the existing ruby token because it inserts before the selection and does not replace the token. A caret immediately after the closing `》` remains valid. Token boundaries must match the reader's accepted inline ruby grammar.

Reader grammar normalization: the reserved ruby delimiters `｜`, `《`, and `》` are not permitted inside a ruby base or reading. A later valid ruby token must still be parsed when an earlier malformed prefix contains another start delimiter. The editor's existing-token boundary check must use the same grammar.

Grapheme-cluster integrity: when the runtime provides `Intl.Segmenter`, ruby's replacement start/end and page's insertion start must lie at complete grapheme boundaries, not merely at UTF-16 surrogate boundaries. This protects decomposed kana combining marks, emoji ZWJ sequences and regional-indicator flags from being split by page or ruby markup. At runtimes without `Intl.Segmenter`, retain the existing surrogate/CRLF safeguards without claiming full grapheme coverage.

TCE:
- A caret between `か` and combining dakuten U+3099 rejects page/ruby insertion.
- A caret inside `👩‍💻` or between the regional indicators of `🇯🇵` rejects insertion.
- A caret immediately after each complete grapheme and a ruby selection spanning the whole grapheme remain valid.

Runtime insertion-kind integrity: TypeScript's `'page' | 'ruby'` union is erased for JavaScript/browser callers. An unsupported runtime discriminator must return null without silently treating the request as ruby. The two supported kinds retain their existing semantics.

TCE:
- `insertManuscriptMarkup('本文', 1, 1, 'unsupported')` returns null, not an inserted ruby placeholder.
- `page` and `ruby` still produce the expected markup at a valid boundary.
