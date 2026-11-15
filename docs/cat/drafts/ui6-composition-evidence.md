---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.composition-evidence-observation
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/e70b4206aef818e62913d77c3ee0c045571c7773/scripts/audit-ui-component-deps.mjs
  - https://github.com/surumeneco/Eternalia_Novel/blob/e70b4206aef818e62913d77c3ee0c045571c7773/docs/cat/drafts/ui6-role-trial.md
refs: []
semantic_contract: markdown-v2
language: ja
---

# UI6 静的依存と合成箇所の出所別観測（Draft）

## 根拠・範囲

採用済みのUI6試験導入方針は `ui.composition` として表示上の親子・静的依存を区別し、許可依存表は未決としている。現行の15 Vue SFCについて既存監査器は開始タグと同一ディレクトリ静的importを`dependsOn`に合併するため、根拠別の分析ができない。`ReaderPanel`の`<slot />`などの合成境界も報告されない。

本Draftは**ソースから確定的に読める局所証拠だけを補助的に抽出**する。既存の統合依存グラフ、循環検出、試用6分類、CIの安全性を保ち、UI6依存許可/意味契約を新たに確定しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.composition.provenance | 同一ディレクトリ内SFCのテンプレートタグ参照と明示`.vue`importを出所別に保持する |
| eternalia.ui.composition.slots | `<slot>`受け口と`v-slot`/`#name`供給構文を、静的依存と分けて報告する |
| eternalia.ui.composition.dynamic | `<component :is>`等の動的解決箇所を未解決のまま報告し、依存先を捏造しない |
| eternalia.ui.composition.authority | 観測の完全性/限界とUI6規範判定の非実行を区別する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-COMP-01 | テンプレートだけ／静的importだけ／両方で同一SFCを使用 | 統合`dependsOn`の既存順序・循環を保持しつつ、`templateTags`/`staticImports`に出所を分ける | 実Nodeスイート |
| UI6-COMP-02 | `<slot />`、名前付き`<slot name="...">`、`<template #header>`または`v-slot`を使用 | 字句的な受け口/供給構文の件数と種類を報告し、slot委譲を依存辺に追加しない | 実Nodeスイート |
| UI6-COMP-03 | `<component :is="selection">`を使用 | 動的箇所を未解決と表示し、対象SFCへ仮の静的依存辺を追加しない | 実Nodeスイート |
| UI6-COMP-04 | script/style/comment/属性引用内に擬似タグがある | 偽陽性を作らない。現行15 SFCは不変の試用分類・循環なし、`ReaderPanel`のslot受け口を観測する | 実Nodeスイート |
| UI6-COMP-05 | 出所別観測がすべて実行できる | `normativeClassification`/`normativeDependencyRules`/`domContract`は`not-run`のままとし、未解析のDOM投影/JSの全動的解決を合格扱いしない | 実Nodeスイート |

## 非対象・限界

Vue Compiler ASTではない限定字句スキャンであり、複数ディレクトリの依存先、動的参照の実行値、slot内容がどこに実DOMとして現れるか、ネスト・循環の規範的許否、UI6分類とCAT Gateの適合を推論しない。確認済みNormative Process/PI/TCEへの昇格権限はないため本ArtifactはDraftを維持する。
