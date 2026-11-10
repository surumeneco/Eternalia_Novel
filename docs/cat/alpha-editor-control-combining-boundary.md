---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.control-combining-boundary
status: candidate
process: eternalia.editor
source_refs:
  - https://github.com/surumeneco/Eternalia_Novel/blob/b5e83a7aceb60cfbefe15f4f92b889f87be96d2d/apps/web/app/utils/manuscript-markup.ts
refs: []
semantic_contract: markdown-v2
language: ja
---

# Alpha editor: 制御文字直後の結合記号境界（code-to-spec Candidate）

## Targets

| Ref | Aspect |
| --- | --- |
| eternalia.editor.fallback | Intl.Segmenter非対応環境のgrapheme分割とUTF-16選択位置 |

## Rules

| ID | Condition | Requirement | Verification |
| --- | --- | --- | --- |
| EDITOR-CTRL-01 | LF直後に結合濁点U+3099が続く | Unicode GB4/GB5の制御文字境界を優先し、page挿入を許可する | fallbackAllowsBoundaryAfterLfBeforeCombiningMark |
| EDITOR-CTRL-02 | CRまたはNEL直後に結合濁点が続く | 制御文字と結合記号を同一graphemeと誤認しない | fallbackAllowsBoundaryAfterOtherControlsBeforeCombiningMark |
| EDITOR-CTRL-03 | 通常のかな直後に結合濁点が続く | 基底文字と結合記号の内部挿入を拒否する | fallbackRejectsBoundaryInsideKanaCombiningCluster |
| EDITOR-CTRL-04 | CRLFの内部に挿入を試みる | CRLFペアの内部挿入を拒否する | fallbackStillRejectsInsideCrlfPair |

## Evidence and limits

- 現行fallbackは`next`がUnicode Markなら無条件に分割を拒否する。Unicode GB4/GB5の制御文字境界はGB9のExtend結合より優先するため、制御文字の直後は例外。Node 22 `Intl.Segmenter('ja')`の実測を参照にする。
- これはcode-to-spec Candidateであり、仕様のConfirmed昇格やproduction修正の承認ではない。既存のZWJ/Indic/Hangul候補とは独立した境界。
- Android WebView/日本語IME/Chromium実機、正式CAT machine Gatesは未実施。
