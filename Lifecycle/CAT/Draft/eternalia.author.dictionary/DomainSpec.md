---
cat_version: '0.3'
kind: domain-spec
id: eternalia.author.dictionary.relations
status: draft
process: eternalia.author.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: ["eternalia.author.dictionary.pi", "eternalia.author.dictionary.tce"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Domain Specification: eternalia.author.dictionary.relations

## 対象
| Ref | Aspect |
| --- | --- |
| eternalia.author.dictionary | 複数実行間の関係・実DOM構造・状態不変性（適用する規則に限定） |

## 規則
| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| dictionary.class.id | 品詞名変更前後と参照中の語 | 既存の品詞IDおよび意味からの参照は名称変更前後で同じ。 | 作者編集・保存・再取得と公開後の参照の複数実行照合 |
| word.spelling.reservation | 公開X・下書きY・非公開化・明示公開更新・適法な論理削除という実行列 | 保持公開版Xが存在し未削除の間はXを再利用できず、公開Yへの更新または適法な削除後に再利用できる。 | 同一語IDを保持する実HTTP/DB実行列、他言語と自己の反例 |
| word.duplicate.atomic | 重複による拒否と未保存意味の引継ぎの前後 | DB上の既存語・新規登録件数・保持公開版は不変であり、編集画面の入力だけが追加される。 | HTTP/DB状態前後比較とブラウザの編集値の観測 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
