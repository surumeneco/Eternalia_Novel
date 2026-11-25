---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.publication.relations
status: draft
process: eternalia.author.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.publication.pi", "eternalia.author.publication.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.author.publication.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.publication | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| publication.move.trace | Tipが公開親Aに属し下書きのみ親Bへ移動する実行列 | 公開前はAの公開条件、明示公開後はBの公開条件が実効公開可否を決める。作者画面の実効状態と匿名読者の実際の可視性を同じ時刻・同じ公開版で照合する。 | A/Bの可視条件を逆転させたChromium・匿名HTTP・DBの公開版前後観測 |
| publication.snapshot.frame | 下書き保存と公開版更新の区別 | 下書きだけを保存した前後では匿名の公開内容・所属・公開判定は不変。明示公開後のみ許可された公開版差が生じる。 | 公開スナップショット前後と一覧・詳細・検索の比較 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
