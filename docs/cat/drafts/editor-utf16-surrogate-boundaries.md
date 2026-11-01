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

Formal CAT machine Gates and real browser/IME/Android tests: **not-run**. No merge or deployment.
