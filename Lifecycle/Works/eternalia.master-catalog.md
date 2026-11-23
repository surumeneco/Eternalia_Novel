---
cat_version: '0.2'
kind: work
id: eternalia.master-catalog
status: candidate
process: eternalia.master
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://docs.google.com/document/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/edit
  - https://github.com/surumeneco/Eternalia_Novel/blob/e65b97da88b55eb5307067dc7b752371bfd309bc/docs/cat/drafts/common-tag-div-master.md
decision_ref: ''
refs: []
entry: issue
mode: shadow
flow: issue-work
work_kind: specification
parent: ''
depends_on: []
issue_ref: https://github.com/surumeneco/Eternalia_Novel/issues/165
project_entry_ref: https://docs.google.com/document/d/1clwfVJ3e_t1_QKFfOWxxRIzE9WMFvTiM/edit
spec_status: draft
---

# Work: eternalia.master-catalog

## Evidence

| URI |
| --- |
| https://docs.google.com/document/d/15X2GtGxr7iO4HrFgi5tmqqRGCKeC5flY/edit |
| https://github.com/surumeneco/Eternalia_Novel/blob/e65b97da88b55eb5307067dc7b752371bfd309bc/docs/cat/drafts/common-tag-div-master.md |

## Scope

Multiple IDs in one cell are separated by `;`.

| Process IDs | Changed IDs | Preserved IDs |
| --- | --- | --- |
| eternalia.master | eternalia.master.tag; eternalia.master.div | eternalia.dictionary.class; eternalia.publication |

## Technologies

| Technology |
| --- |

## Repositories

`Allowed paths` uses `;` between path patterns.

| Name | Path | Base ref | Branch pattern | Allowed paths | Production paths | Test paths |
| --- | --- | --- | --- | --- | --- | --- |
| eternalia | . | develop | docs/* | docs/cat/drafts/*;Lifecycle/Works/* | — | — |

## Checks

`Command` uses shell-like quoting only to express argv; execution never uses a shell. List cells use `;`.

| ID | Stage | Runner | CWD | Command | Test IDs | Inputs | Outputs | Timeout |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: |

## Gates

External/semantic gates are reported evidence. `passed` or `not-applicable` requires a concrete evidence/rationale reference.

| Gate | Status | Evidence |
| --- | --- | --- |
| process-closure | not-run | — |
| model-conformance | not-run | — |
| implementation-conformance | not-run | — |
| semantic-review | not-run | — |
| test-oracle-review | not-run | — |
| red-review | not-run | — |
| pr-review | not-run | — |
| ci | not-run | — |
| merge | not-run | — |
| deployment | not-run | — |
| real-use | not-run | — |
