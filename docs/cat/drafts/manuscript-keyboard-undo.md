---
cat_version: '0.3'
kind: domain-spec
id: eternalia.editor.keyboard-undo-ime
status: draft
process: eternalia.editor
source_refs:
  - https://drive.google.com/file/d/1HjDxCgsLOPP0Q4PSqEFxHNYpvABdYyNx/view
refs:
  - eternalia.editor.utf16-markup-boundaries
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: Manuscript keyboard Undo and IME-safe markup (CAT Draft)

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.editor | textareaの入力・選択・ruby挿入・Undo |
| eternalia.editor.utf16-markup-boundaries | UTF-16 surrogateと既存token境界の整合性 |
| eternalia.publication | 下書き編集と明示公開の分離 |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| editor.undo.atomic | 作者が選択範囲へrubyを挿入した後にキーボードUndoするとき | ruby挿入を一つのundoable操作として元の原稿へ正確に戻し、以前の通常入力を削除しない | IME-UNDO-01 |
| editor.ime.composition | 日本語IME composition中にrubyツールバー操作が行われたとき | composition中の入力を変更・破損せず、確定前のruby挿入を拒否する | IME-UNDO-02 |
| editor.selection | 選択端点がUTF-16 surrogateや予約markup tokenの内部にあるとき | 不正な部分選択からrubyを生成しない。既存の選択境界Draftと整合する | IME-UNDO-03 |
| editor.no-publish | 作者が入力・ruby挿入・Undo・IME確定を行うとき | 操作だけで下書きを自動保存・公開しない | IME-UNDO-04 |
| editor.evidence | Chromiumの合成compositionイベントで検証するとき | その結果を実Windows日本語IME/Android Gboardの操作確認済みと扱わない | IME-UNDO-02, IME-UNDO-04 |

## 受入ベクトル（Draft、未実行）

- IME-UNDO-01: native keyboard entry → select → ruby toolbar → Ctrl+Zで原文が完全に復元され、先行入力は残る。
- IME-UNDO-02: compositionstart → ruby toolbar → compositionendで未確定入力が変更されない。実IME候補選択・確定は別の実機受入とする。
- IME-UNDO-03: supplementary characterを含むUTF-16 selectionが正当な境界でのみruby化され、不正な端点は拒否される。
- IME-UNDO-04: 上記操作後に明示的な保存・公開をしない限り公開本文は変化しない。

## 出典・Gate境界

既存PI-1〜5とTCE候補、WR-02/05/07、DS-05、AC-03/15/65を意味変更せず構造化したDraft。具体的editor実装やmarkup構文を新たな規範として承認しない。正式CAT Process/PI/TCE・semantic machine Gates、実Windows IME/Android Gboard、実機Undo・視覚検証は**not-run**。合成Playwrightや既存unit testの成功を実機受入やConfirmedと混同しない。
