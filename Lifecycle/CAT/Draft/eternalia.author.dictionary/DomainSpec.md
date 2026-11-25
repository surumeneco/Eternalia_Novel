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
| dictionary.language.source | 言語選択 | 観測.言語IDと観測.言語所属系列IDは入力言語IDに対応する実在言語の保存状態に由来する。観測.下書き品詞列はその言語の全下書きマスタ列をID・名称・説明・順序ごと保持する。他言語や公開版を代用しない。未保存破棄確認が必要な選択は確定後を起点とする。 | 保存データ・表示された実ID/列の前後照合 |
| dictionary.word.editor.source | 語編集開始（未保存破棄の確認が必要な場合は確定後） | 直接URLを含む編集開始要求の系列・言語IDを保存済み階層から解決し、認可済みの同一系列・言語の実在未削除語だけを編集対象とする。事前に別の選択操作を要求しない。観測.編集語ID・編集語所属言語ID・編集語スペル・編集語意味列は同一の保存済み下書き語に由来し、他語・公開版を代用しない。新規語はスペル・意味を空で開始し、公開選択の初期値は公開（作者は非公開に変更可能）。品詞候補のID・名称・順序は選択言語の保存済み下書きマスタに一致し、未指定を許容する。空マスタでも自由入力は提供せず、既存の未登録参照を保持表示する場合も新規選択肢にはしない。 | 新規・既存・拒否の実画面を分け、保存済み語のID/スペル/全意味、同一言語の候補列・実DOMの選択肢と初期値を照合。別言語、不在、空マスタ、旧値、未保存破棄取消を対照。 |
| dictionary.class.sequence | 品詞追加・移動・名称編集の単一実行前後 | Mを編集開始時の順序列、Nを操作後の順序列とする。追加ではN=Mに新項目を末尾追加し、そのIDは実際の新規採番IDで既存IDと異なり名称・説明は編集開始時は空。TCEの列追加・列交換は列値の全位置を保持する規範関係であり、採番の新規性、観測位置の実IDとの対応、保存済み状態と公開版の不変性は別途検証する。保存済み値の制約を新規の未保存入力に要求しない。移動では観測.対象品詞位置は指定IDと一致する実項目の位置i（不在は-1）であり、別項目位置で代用しない。方向d（前=-1、後=1）に対してj=i+d。0≦i,j≦長さ(M)-1ならN[i]=M[j]、N[j]=M[i]、その他の全位置kでN[k]=M[k]。対象不在・境界外ならN=M。名称変更では該当IDのnameだけが変化し、列長、全ID、description、他項目を保持する。検査器都合で列を固定長の位置や有限個のIDに置換しない。製品側の既存入力制約（保存時の有効な名称・参照ID・重複ID拒否等）と検査器の証明範囲を区別する。 | 実配列・ID・値の完全比較。先頭/末尾・内部・任意長列・参照中IDを対照 |
| dictionary.word.collision | 語保存の重複条件 | Lを選択言語、wを編集対象ID（新規はなし）、sを入力スペルとする。候補集合Cは L に属する未削除かつID≠wの語のうち、下書きスペル=sまたは保持公開版スペル=sを満たすID全体。Cが空でない場合は保存を拒否し、実際の衝突語IDを用いる。自己と他言語はCに入らず、非公開化のみでは保持公開版を除去しない。Cを外部から渡される適合フラグで代用しない。 | 実保存状態からの独立集合計算とHTTP応答・未保存編集対象照合 |
| dictionary.meanings.merge | 重複拒否後の意味引継ぎ | 保存済みの意味列をM、入力意味をIとし、一致品詞の既存意味群末尾へ入力意味を未保存で追加する。既存意味のID・定義・語源参照・所属と公開版は不変。表示だけを変え、永続化は後続の明示保存で行う。複数入力時の具体的な同順位規則は採用済み要求を超えて固定しない。 | 同一語IDの実DB前後、編集フォームの値と保存操作の分離 |

自由文の規則・観測関係は正式な機械証明済みではない。単一実行の操作・状態変化はTCEに置き、検証方法は規範Interfaceにしない。
