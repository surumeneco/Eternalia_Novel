---
cat_version: '0.3'
kind: domain-spec
id: eternalia.alpha.manuscript-indic-conjunct-fallback
status: draft
process: eternalia.manuscript
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha: Indic conjunct grapheme boundaries without Intl.Segmenter (CAT Draft)

Status: **Draft**, not Confirmed. Leaf TASK-20261101-009.

## Boundary

Textarea selection offsets are UTF-16 code units. In older WebViews lacking `Intl.Segmenter`, the current fallback preserves combining marks, ZWJ, emoji and Hangul, but may allow a cursor boundary after an Indic virama and before a following consonant. Unicode grapheme rule GB9c joins Indic consonant-linker-consonant sequences; a markup insertion inside that cluster can corrupt a user's manuscript.

## Candidate acceptance vectors

| ID | Input | Expected |
| --- | --- | --- |
| AC-IME-INDIC-01 | Devanagari `क्ष` and Bengali `ক্ষ`, no `Intl.Segmenter` | `page` and `ruby` reject the internal UTF-16 boundary before the final consonant |
| AC-IME-INDIC-02 | Full conjunct selected for ruby | Preserve entire base and correct reading-selection UTF-16 offsets |
| AC-IME-INDIC-03 | Two adjacent complete conjunct clusters | Insertion at the boundary between clusters remains valid |
| AC-IME-INDIC-04 | Reference environment with `Intl.Segmenter` | The sample sequences are independently confirmed as single graphemes |

The exact Unicode coverage, including more complex virama/ZWJ/spacing sequences, requires normative review and an authoritative grapheme algorithm; do not infer that two samples prove full Unicode GB9c compliance. Synthetic Node tests are not Android/Gboard/Windows IME or visual acceptance. CAT formal machine Gates not-run; no production fix/merge before Confirmed.
