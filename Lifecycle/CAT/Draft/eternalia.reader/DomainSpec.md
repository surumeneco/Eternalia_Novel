---
cat_version: '0.3'
kind: domain-spec
id: eternalia.reader.relations
status: draft
process: eternalia.reader
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.reader.pi", "eternalia.reader.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.reader.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.reader | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| reader.order.relation | 同一言語の公開語集合・スペルが同じでマスタ順/手動順だけが異なる二つの実行 | どちらの単語表示列もスペル昇順。スペルが異なる語の相対順はマスタ順/手動順の変更によって反転しない。照合順等の未決部分は固定しない。 | 実API/DOMで複数語と異なるマスタ順・手動順を比較 |
| reader.ui.structure | 公開設定詳細・言語詳細・章詳細のDOMとナビゲーション | 本文・文法リンク・章一覧リンクは実際の公開対象IDと結び付く。未公開本文やリンクは表示しない。 | DOM/アクセシビリティ・リンク遷移・匿名HTTPの対象ID照合 |
| reader.pos.rename | 同じ安定品詞IDの下書き名称変更前後と明示公開後 | 公開前は公開マスタの旧名称、明示公開後は同じIDの新公開名称。下書き名称は漏れない。 | 同一単語IDの公開表示と公開マスタの複数実行照合 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
