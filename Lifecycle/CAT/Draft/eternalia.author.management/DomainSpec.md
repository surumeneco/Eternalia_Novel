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
| management.source.identity | 系列選択・正規編集・正規作成 | 対象ID・種別は実資料から取得し、系列所属は実祖先の親参照を辿って最上位シリーズへ到達したID。親不在・循環・系列不一致の場合は正規所属として扱わない。旧item/createクエリを観測しても対象・モードを上書きしない。 | 正規/異系列/種別不一致/旧クエリ併存の実URL、対象IDと操作可否を比較 |
| management.grid.data | 一覧閲覧と単語の言語絞込 | Aを保存済み資料列、Sを選択系列、Kを一覧種別、Lを選択言語とする。表示行ID集合はAのうち実祖先系列=Sかつ種別=Kを満たすものと完全一致し、K=wordかつL≠なしなら直接親ID=Lも必要。章行はその章の実祖先の編ID・部IDと対応し、表示順・名称・編集対象IDは同じ資料に由来する。L解除は系列S内の全対象へ戻す。 | 実DB/API資料集合とDOM行ID、列・編集URLの完全対応、別系列・別言語の反例 |
| management.editor.handoff | 正規作成画面への入場と別の保存成功/失敗イベント、正規編集への遷移 | 作成成功後は当該作成実行で実際に保存された安定IDの正規編集へ移る。保存失敗では作成入力を保持し、LG-08衝突時は辞書編集の衝突語・未保存意味引継ぎに従う。未保存破棄確認を経ない既存編集値の破棄を許さない。入場時に未来の作成IDを要求しない。個別編集内容の状態を管理ナビゲーションProcessの所有状態として重複させない。 | 作成前後の実HTTP応答ID、ブラウザURLとフォーム値、取消/失敗での保持 |
| master.source.references | 確定削除時の整合性検査 | 観測.削除対象IDと改訂は同一の実対象マスタに由来し、観測.削除対象参照数はそのIDへの現在の保存参照集合の要素数。採用済みタグの下書き・保持公開版・作者メモ参照を含む。対象不在、改訂競合、参照ありは作用なし。確認後に参照が追加された場合も参照切れを生じさせない。 | 実DBの対象・参照・改訂を独立読戻し。削除と参照追加の整合性、拒否時の全状態保存 |
| master.delete.result | 削除成功・失敗の結果 | 成功時は指定IDだけが再取得時に不在となり、他マスタと参照は維持する。確定失敗では削除を成立させない。通信障害等で確定結果を取得できない場合、成功と断定せず読戻しで状態を確かめる。確認取消は削除要求を送らない。 | 成功/競合/参照あり/取消の実HTTP・DB・UI前後比較 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
