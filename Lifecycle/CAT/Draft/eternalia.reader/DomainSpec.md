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
| reader.words.relation | 言語閲覧、検索、品詞絞込 | Wを公開単語の実列、Lを選択言語、qを検索語、cを選択品詞IDとする。表示ID集合はWのうち同一言語L・実効公開・採用済みスペル/意味検索条件・cが未指定または当該単語の意味の品詞ID=cを満たす全語と一致する。表示列はそのID・公開スペルの重複なし射影でスペル昇順。異なるスペルの相対順を作者手動順や品詞順で反転させない。検索の未決照合方式・同綴のタイブレークは新規固定しない。 | 実公開資料集合と検索条件から独立に対象集合と順序を比較。欠落/余剰/異系列/非公開の対照 |
| reader.settings.relation | カテゴリ閲覧、設定検索、タグ絞込、名称順 | 選択カテゴリの公開Tipのうち名称またはその公開設定項目が検索条件に適合し、指定タグがあれば実タグ参照を持つものだけを表示する。非公開項目は検索条件判定にも漏えいさせない。名称順選択時は表示対象の実名称順。既定順の未決細目を固定しない。 | 公開/非公開設定と項目、タグID、検索語と実DOM列・検索結果を照合 |
| reader.pos.label | 公開単語詳細の意味品詞 | 各表示意味IDについて、単語の所属言語の公開マスタ内で同一安定品詞IDを持つ項目が存在する場合のみその公開nameを表示する。不在・未指定はラベルなしとし、同名の別ID・別言語・下書き名称を代用しない。 | 実意味ID・公開マスタIDとDOMラベル、未指定/別ID/非公開マスタ対照 |
| reader.chapter.relation | 正規公開章の章一覧導線を操作する前後 | 操作前に表示した章の保持公開版上の所属部ID p が、遷移先として観測される部ID・表示対象IDに一致する。遷移後の章ID集合は同一の正規公開部pに所属する実効公開章の全件と一致し、採用された章順を保持する。操作時点で部が非公開ならその情報を返さない。下書きの親・別部・別系列・適合ラベルを代用しない。 | 実章の公開親ID、リンク先ID、遷移後URL/章ID列を前後比較。非公開親/別系列の対照 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
