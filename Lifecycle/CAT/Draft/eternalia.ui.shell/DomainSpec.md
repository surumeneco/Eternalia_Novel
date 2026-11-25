---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.shell.relations
status: draft
process: eternalia.ui.shell
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.ui.shell.pi", "eternalia.ui.shell.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.ui.shell.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.ui.shell | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| shell.layout.invariance | 同一画面幅でメニューを閉じた状態と展開状態 | ヘッダーの高さ・幅は同じで、本文を押し下げない。右起点は主、左起点は副。 | 実ブラウザのbounding box前後比較とキーボード・タッチ操作 |
| shell.focus.boundary | パネル展開時のDOM/アクセシビリティ構造とフォーカス列 | 背景へのキーボード・ポインタ操作は遮断され、操作可能なパネルと対応する起点の間で循環し、利用者による閉鎖時には可視の起点に復帰する。 | 実DOM・Tab/Shift+Tab/Esc・背景クリックの観測 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
