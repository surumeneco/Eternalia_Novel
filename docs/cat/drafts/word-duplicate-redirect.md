---
cat_version: '0.3'
kind: domain-spec
id: eternalia.dictionary.duplicate-word-redirect
status: draft
process: eternalia.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# DomainSpec: 同一言語の同綴語登録と既存語への編集移行（Draft）

## 対象と出典

- 2026-11-12利用者決定「同じスペルの場合はエラー文を出して登録不能とします。その後、該当する既存スペルの編集画面へと遷移し、一致する品詞欄の末尾に追加した状態で編集状態とします。」
- 現行要件 LG-08 / AC-09。異なる言語の同綴は登録可能、公開版の変更は明示公開版更新時のみ。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.dictionary | 同綴語の登録拒否と既存単語編集への未保存引継ぎ |
| eternalia.publication | 下書き変更は公開版に自動反映しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| dictionary.duplicate.create | 同じ言語で同一スペルの単語を作成 | 原子的に新規登録を拒否し、既存単語IDと明示的な重複コードを返す | WORD-DUP-01 |
| dictionary.duplicate.edit | 既存単語の名前を他の同一言語の既存スペルへ変更 | 競合として拒否し、保存済みの下書き・公開版を変更しない | WORD-DUP-02 |
| dictionary.duplicate.foreign | 異なる言語で同じスペルを作成 | 独立の単語として作成を許す | WORD-DUP-03 |
| dictionary.duplicate.redirect | 登録画面の重複エラー | 既存単語の編集画面を開き、入力した品詞・説明を該当品詞群の末尾へ未保存で追記。既存の意味・参照・公開版を改変しない | WORD-DUP-04 |
| dictionary.phonotactics | 音韻制約に違反 | 警告を表示し、登録そのものは遮断しない（不正な構造・参照は拒否） | WORD-DUP-05 |

## 受入ベクトル（Draft）

- WORD-DUP-01: 同一言語内の重複作成は409、既存語IDを返し、ライブラリは不変。
- WORD-DUP-02: 登録済み2単語のスペルを一致させる変更は409、旧値を保持。
- WORD-DUP-03: 別言語の同綴は登録可能で、元の言語のIDとは異なる。
- WORD-DUP-04: 登録画面に同綴・品詞・意味を入力した場合、エラー表示後既存編集画面へ切り替わり、既存意味の後に未保存の意味が入る。元の公開版も不変。
- WORD-DUP-05: 音韻規則の診断警告が保存APIの拒否条件に転用されない。

## 承認とGate

利用者による動作要求の決定は取得済み。正式Process/PI/TCE一式は未確認であり、本書はCAT Draftのまま。正規Process Closure・Model Conformance・implementation-conformanceの完了を主張しない。
