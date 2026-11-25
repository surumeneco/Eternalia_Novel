---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.management.relations
status: draft
process: eternalia.author.management
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.management.pi", "eternalia.author.management.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.author.management.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.management | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| management.grid | 正規管理一覧のDOM/アクセシビリティ構造 | 章の編・部所属と表示順を行の対象に対応させ、系列を重複属性列にせず、言語選択は語一覧を限定できる。 | 実グリッド行のID、列見出し、編集リンク、複数言語の可視行を照合 |
| master.atomic | 削除競合または参照ありの削除要求前後 | 対象マスタと参照集合・改訂を無断変更しない。 | 実PostgreSQL/HTTPの前後状態と失敗応答、削除確定時の読戻し |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
