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

Textarea selection offsets are UTF-16 code units. In older WebViews lacking `Intl.Segmenter`, the original alpha fallback preserved combining marks, ZWJ, emoji and Hangul, but allowed a cursor boundary after an Indic virama and before a following consonant. Unicode grapheme rule GB9c joins Indic consonant-linker-consonant sequences; a markup insertion inside that cluster can corrupt a user's manuscript.

## Candidate acceptance vectors

| ID | Input | Expected |
| --- | --- | --- |
| AC-IME-INDIC-01 | Devanagari `क्ष` and Bengali `ক্ষ`, no `Intl.Segmenter` | `page` and `ruby` reject the internal UTF-16 boundary before the final consonant |
| AC-IME-INDIC-02 | Full conjunct selected for ruby | Preserve entire base and correct reading-selection UTF-16 offsets |
| AC-IME-INDIC-03 | Two adjacent complete conjunct clusters | Insertion at the boundary between clusters remains valid |
| AC-IME-INDIC-04 | Reference environment with `Intl.Segmenter` | The sample sequences are independently confirmed as single graphemes |

**Exploratory evidence**: At current alpha integration HEAD `dc69067d6c51fe1f2edf043d0e07712cc106caee`, [Actions #42640435652](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42640435652) reproduced two expected Red failures (Devanagari and Bengali). The provisional feature-branch implementation `73fa7dc2d7833b96fc90a6c54a3abec7d2888b4a` restricts the repair to supported Indic consonant/virama chains; [Actions #42641211271](https://github.com/surumeneco/Eternalia_Novel/actions/runs/42641211271) reports four CI jobs successful and both cases Green.

The exact Unicode coverage, including more complex virama/ZWJ/spacing sequences, requires normative review and an authoritative grapheme algorithm; two samples do not prove full Unicode GB9c compliance. Synthetic Node tests are not Android/Gboard/Windows IME or visual acceptance. CAT Process/PI/TCE confirmation and all formal machine Gates remain **not-run**; this Draft and provisional feature commit do not authorize a `develop`/`main` merge.
