# Alpha editor: UTF-16 surrogate boundary integrity (CAT Draft)

Status: **Draft**, not Confirmed. Leaf: TASK-20261101-009.

The author editor uses textarea UTF-16 offsets. Ruby and page-marker insertion must reject a selection whose start or end falls between a high and low surrogate, without modifying the manuscript. Complete supplementary characters and ordinary Japanese text remain editable.

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

Existing ruby-token integrity: page or ruby insertion with a caret inside a valid `｜base《reading》` token must be rejected to prevent corrupting an already-renderable ruby. A caret immediately after the closing `》` remains valid. Token boundaries must match the reader's accepted inline ruby grammar.

Reader grammar normalization: the reserved ruby delimiters `｜`, `《`, and `》` are not permitted inside a ruby base or reading. A later valid ruby token must still be parsed when an earlier malformed prefix contains another start delimiter. The editor's existing-token boundary check must use the same grammar.

Grapheme-cluster integrity: when the runtime provides `Intl.Segmenter`, an insertion selection must start and end at complete grapheme boundaries, not merely at UTF-16 surrogate boundaries. This protects decomposed kana combining marks, emoji ZWJ sequences and regional-indicator flags from being split by page or ruby markup. At runtimes without `Intl.Segmenter`, retain the existing surrogate/CRLF safeguards without claiming full grapheme coverage.

TCE:
- A caret between `か` and combining dakuten U+3099 rejects page/ruby insertion.
- A caret inside `👩‍💻` or between the regional indicators of `🇯🇵` rejects insertion.
- A caret immediately after each complete grapheme and a ruby selection spanning the whole grapheme remain valid.

Runtime insertion-kind integrity: TypeScript's `'page' | 'ruby'` union is erased for JavaScript/browser callers. An unsupported runtime discriminator must return null without silently treating the request as ruby. The two supported kinds retain their existing semantics.

TCE:
- `insertManuscriptMarkup('本文', 1, 1, 'unsupported')` returns null, not an inserted ruby placeholder.
- `page` and `ruby` still produce the expected markup at a valid boundary.
