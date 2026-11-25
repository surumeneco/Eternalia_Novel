---
cat_version: '0.3'
kind: tce
id: eternalia.author.management.tce
status: draft
process: eternalia.author.management
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.management.pi"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# TCE: eternalia.author.management.tce

網羅要求: partial

## 振る舞い
| ID | 起点 | 条件 | 結果 | 効果 |
| --- | --- | --- | --- | --- |
| management.reject.edit | 編集要求 | `観測.認証役割 != "作者"` | 1 | `出力.画面 = "ログイン"` |
| management.reject.create | 作成要求 | `観測.認証役割 != "作者"` | 1 | `出力.画面 = "ログイン"` |

## 振る舞いの意味契約（形式化途上）

下表が今回の要求上の振る舞いであり、上表はそのうち現行記法で書ける局所状態・結果の断片である。未形式化のCondition・Effectも削除・合格扱いしない。重複IDは同一振る舞いの部分式と意味の対応であり、別の選択肢を意味しない。

| ID | 起点 | Condition（意味） | Effect（意味） | 要求 |
| --- | --- | --- | --- | --- |
| management.select | 系列選択 | 認可済みかつ対象シリーズが存在する | 選択系列を確定し、当該系列の管理入口を表示する。 | AC-81 |
| management.list | 一覧閲覧 | 正規管理系列の一覧を閲覧する | 所属と種別に合う資料のグリッドを表示し、対象ID・名称・表示順・編集導線を実データに対応させる。章行には編・部の所属を表示し、選択済みシリーズを属性列として重複表示しない。 | 200 §6.2、AC-81 |
| management.language | 言語絞込 | 単語管理一覧で言語を選択・解除 | 指定言語IDの単語だけを表示する。解除時は系列内の対象へ戻し、別系列を混ぜない。 | 200 §6.2、AC-81 |
| management.edit | 編集要求 | 認可済みかつパスの対象ID・系列・種別・祖先が整合 | その対象IDの正規個別編集へ入る。旧item/createクエリがあっても編集IDや作成モードを上書きしない。無認可ではログイン/拒否、対象不正ではデータ非開示の拒否。 | IA-05/06、AC-95 |
| management.create | 作成要求 | 認可済みかつシリーズ作成なら親なし、子資料作成なら正規系列内の実在親と子種別が整合 | 該当する新規作成画面へ入る。不整合・未認可は拒否。作成成功後は実際に作成したIDの正規個別編集へ進む。LG-08の重複とその他保存失敗は辞書編集の振る舞いに従う。 | 200 §6.2/6.4、AC-81/95 |
| master.delete | 共通マスタ削除 | 認可済み・対象IDと改訂が一致・参照なし・削除確定 | そのマスタだけを削除して再取得時に不在となる。改訂不一致なら競合、参照ありなら拒否し、対象と参照を維持する。認可拒否や失敗では削除しない。 | Issue #165 IA-2、既存削除仕様 |

## 残る形式化

実際の境界値、関係・効果の完全な式、操作別出力Presence、到達可能性を確定したうえでclosedを要求する。現行Compiler未対応の箇所は未証明として扱い、旧真偽判定に戻さない。
