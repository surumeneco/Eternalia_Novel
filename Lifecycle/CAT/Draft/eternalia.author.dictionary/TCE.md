---
cat_version: '0.3'
kind: tce
id: eternalia.author.dictionary.tce
status: draft
process: eternalia.author.dictionary
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
  - https://github.com/surumeneco/Eternalia_Novel/issues/39#issuecomment-6898199909
refs: ["eternalia.author.dictionary.pi"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# TCE: eternalia.author.dictionary.tce

網羅要求: partial

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | --- | --- |
| dictionary.select.language | 言語選択 | `観測.認証役割 == "作者" かつ 観測.言語ID == 入力.言語ID かつ 観測.言語所属系列ID == 入力.シリーズID` | 1 | `状態.選択系列 = 入力.シリーズID; 状態.選択言語 = 入力.言語ID` |

## 振る舞いの意味契約（形式化途上）

下表が今回の要求上の振る舞いであり、上表はそのうち現行記法で書ける局所状態・結果の断片である。未形式化のCondition・Effectも削除・合格扱いしない。重複IDは同一振る舞いの部分式と意味の対応であり、別の選択肢を意味しない。

| ID | 起点 | Condition（意味） | Effect（意味） | 要求 |
| --- | --- | --- | --- | --- |
| dictionary.select.language | 言語選択 | 認可済みで指定系列に実在言語が所属する | 選択言語を変更し、その言語の下書き品詞列と単語入力候補を表示する。未認可・所属不正では表示・保存を許さない。 | LG-05、AC-81 |
| class.append | 品詞追加 | 認可済みの選択言語に品詞を追加 | 実際の新規安定ID・名称を持つ項目を編集中品詞列の末尾に加える。既存ID・名称・順序を保持する。 | LG-05 |
| class.move | 品詞移動 | 対象IDが列に存在し、指定方向の隣接項目が存在する | 対象と隣接項目だけを交換する。先頭の前移動・末尾の後移動は列を変更しない。すべての項目のID・名称・所属と意味参照を維持する。 | LG-05 |
| class.rename | 品詞名称編集 | 認可済みかつ対象が選択言語のマスタに存在する | 対象の名称のみ変更しID・既存意味参照を保持する。参照切れを生じる操作は許可しない。 | LG-05 |
| class.save | 品詞保存 | 認可済みで有効な編集列 | 下書きマスタを編集列に更新し、保持公開マスタと他言語を変更しない。 | LG-05、PB-18 |
| word.open | 語編集開始 | 正規言語内の新規または既存語を開く | 新規・編集フォームは当該言語の実在IDを選択肢として提示し、空マスタでも自由入力を提供しない。保存済みの旧マスタ外値は存在する場合に保持表示するが、新規選択肢にしない。 | LG-05（旧値表示は従来仕様の保持、旧形式移行は対象外） |
| word.save.valid | 語保存 | 認可済み・構造と参照が有効・同綴衝突なし | 入力語を当該言語に保存し、成功時は保存したIDの正規編集へ遷移する。各非空品詞IDは当該下書きマスタに所属する。空品詞は未指定。音韻警告のみでは入力継続可能。公開版は不変。 | LG-05、LG-08、PB-18 |
| word.save.duplicate | 語保存 | 自己以外の未削除同一言語語の下書きまたは保持公開スペルと一致する | 保存を拒否し、衝突語IDの正規編集へ遷移して入力意味を一致品詞の末尾へ未保存で追加し、既存の意味ID・定義・語源参照を維持する。公開版・保存済み語は変更しない。異言語・自己・論理削除済み語は衝突に含めない。 | LG-08、AC-67 |
| word.save.rejected | 語保存 | 未認可・構造不正・無効参照または保存失敗 | 保存しない。重複以外の失敗では入力内容を保持し、不正な対象へ遷移しない。 | LG-05、LG-08、AC-95 |

## 残る形式化

実際の境界値、関係・効果の完全な式、操作別出力Presence、到達可能性を確定したうえでclosedを要求する。現行Compiler未対応の箇所は未証明として扱い、旧真偽判定に戻さない。
