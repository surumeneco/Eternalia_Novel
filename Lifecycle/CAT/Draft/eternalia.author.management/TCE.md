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

ここでは完全な意味上のCondition・Effectを一つの表に保持する。バッククォート内は正規式へ変換した部分、自由記述は未変換の完全な意味要求である。全表の変換が終わるまでモデルの規範的な合格とはしない。未記述Effectを「不変」や「出力なし」として合格扱いする部分Outcomeを置かない。

| ID | 起点 | 条件 | 結果 | 効果 | 要求 |
| --- | --- | --- | --- | --- | --- |
| management.select | 系列選択 | `観測.認証役割 == "作者" かつ 観測.系列ID == 入力.シリーズID` | 1 | `状態.選択シリーズ = 入力.シリーズID; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "管理入口"; 出力.選択系列ID = 入力.シリーズID` | AC-81 |
| management.select.denied | 系列選択 | `否定(観測.認証役割 == "作者")` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "ログイン"` | AC-81 |
| management.select.missing | 系列選択 | `観測.認証役割 == "作者" かつ 否定(観測.系列ID == 入力.シリーズID)` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "対象拒否"` | AC-81/95 |
| management.list | 一覧閲覧 | 正規管理系列の一覧を閲覧する | 1 | 所属と種別に合う資料のグリッドを表示し、対象ID・名称・表示順・編集導線を実データに対応させる。章行には編・部の所属を表示し、選択済みシリーズを属性列として重複表示しない。 | 200 §6.2、AC-81 |
| management.language | 言語絞込 | 単語管理一覧で言語を選択・解除 | 1 | 指定言語IDの単語だけを表示する。解除時は系列内の対象へ戻し、別系列を混ぜない。 | 200 §6.2、AC-81 |
| management.edit | 編集要求 | `観測.認証役割 == "作者" かつ 観測.編集ID == 入力.対象ID かつ 観測.編集所属系列 == 入力.シリーズID かつ 観測.編集種別 == 入力.種別` | 1 | `状態.選択シリーズ = 入力.シリーズID; 状態.選択言語 = なし; 状態.編集対象 = 入力.対象ID; 出力.画面 = "個別編集"; 出力.編集対象ID = 入力.対象ID; 出力.選択系列ID = 入力.シリーズID` | IA-05/06、AC-95 |
| management.create | 作成要求 | `観測.認証役割 == "作者" かつ ((入力.作成系列ID == なし かつ 入力.親ID == なし かつ 入力.種別 == "series") または (入力.作成系列ID != なし かつ 入力.親ID != なし かつ 観測.作成親ID == 入力.親ID かつ 観測.作成親系列 == 入力.作成系列ID かつ ((観測.作成親種別 == "series" かつ (入力.種別 == "volume" または 入力.種別 == "category" または 入力.種別 == "language" または 入力.種別 == "periodization")) または (観測.作成親種別 == "volume" かつ (入力.種別 == "part")) または (観測.作成親種別 == "part" かつ (入力.種別 == "chapter")) または (観測.作成親種別 == "category" かつ (入力.種別 == "tip")) または (観測.作成親種別 == "tip" かつ (入力.種別 == "tipSection")) または (観測.作成親種別 == "language" かつ (入力.種別 == "word" または 入力.種別 == "grammar")) または (観測.作成親種別 == "periodization" かつ (入力.種別 == "event")))))` | 1 | `状態.選択シリーズ = 入力.作成系列ID; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "新規作成"` | 200 §6.2/6.4、AC-81/95 |
| master.delete | 共通マスタ削除 | `入力.削除確定 かつ 観測.認証役割 == "作者" かつ 観測.削除対象ID == 入力.対象ID かつ 観測.削除対象改訂 == 入力.改訂 かつ 観測.削除対象参照数 == 0` | 1 | `作用.削除対象 = 入力.対象ID; 出力.削除結果 = "削除成功"` | Issue #165 IA-2 |
| master.delete | 共通マスタ削除 | `入力.削除確定 かつ 観測.認証役割 == "作者" かつ 観測.削除対象ID == 入力.対象ID かつ 観測.削除対象改訂 == 入力.改訂 かつ 観測.削除対象参照数 == 0` | 2 | `出力.削除結果 = "削除失敗"` | Issue #165 IA-2 |
| management.reject.edit.auth | 編集要求 | `否定(観測.認証役割 == "作者")` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "ログイン"` | AC-81/95 |
| management.reject.edit.target | 編集要求 | `観測.認証役割 == "作者" かつ 否定(観測.編集ID == 入力.対象ID かつ 観測.編集所属系列 == 入力.シリーズID かつ 観測.編集種別 == 入力.種別)` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "対象拒否"` | AC-81/95 |
| management.reject.create.auth | 作成要求 | `否定(観測.認証役割 == "作者")` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "ログイン"` | AC-81/95 |
| management.reject.create.target | 作成要求 | `観測.認証役割 == "作者" かつ 否定(((入力.作成系列ID == なし かつ 入力.親ID == なし かつ 入力.種別 == "series") または (入力.作成系列ID != なし かつ 入力.親ID != なし かつ 観測.作成親ID == 入力.親ID かつ 観測.作成親系列 == 入力.作成系列ID かつ ((観測.作成親種別 == "series" かつ (入力.種別 == "volume" または 入力.種別 == "category" または 入力.種別 == "language" または 入力.種別 == "periodization")) または (観測.作成親種別 == "volume" かつ (入力.種別 == "part")) または (観測.作成親種別 == "part" かつ (入力.種別 == "chapter")) または (観測.作成親種別 == "category" かつ (入力.種別 == "tip")) または (観測.作成親種別 == "tip" かつ (入力.種別 == "tipSection")) または (観測.作成親種別 == "language" かつ (入力.種別 == "word" または 入力.種別 == "grammar")) または (観測.作成親種別 == "periodization" かつ (入力.種別 == "event"))))))` | 1 | `状態.選択シリーズ = なし; 状態.選択言語 = なし; 状態.編集対象 = なし; 出力.画面 = "対象拒否"` | AC-81/95 |
| master.delete.conflict | 共通マスタ削除 | `入力.削除確定 かつ 観測.認証役割 == "作者" かつ 観測.削除対象ID == 入力.対象ID かつ 否定(観測.削除対象改訂 == 入力.改訂)` | 1 | `出力.削除結果 = "競合"` | Issue #165 IA-2 |
| master.delete.referenced | 共通マスタ削除 | `入力.削除確定 かつ 観測.認証役割 == "作者" かつ 観測.削除対象ID == 入力.対象ID かつ 観測.削除対象改訂 == 入力.改訂 かつ 観測.削除対象参照数 > 0` | 1 | `出力.削除結果 = "参照あり"` | Issue #165 IA-2 |
| master.delete.cancel | 共通マスタ削除 | `否定(入力.削除確定)` | 1 | `なし` | Issue #165 IA-2 |
| master.delete.rejected.auth | 共通マスタ削除 | `入力.削除確定 かつ 否定(観測.認証役割 == "作者")` | 1 | `出力.削除結果 = "認可拒否"` | Issue #165 IA-2 |
| master.delete.rejected.target | 共通マスタ削除 | `入力.削除確定 かつ 観測.認証役割 == "作者" かつ 観測.削除対象ID != 入力.対象ID` | 1 | `出力.削除結果 = "削除失敗"` | Issue #165 IA-2 |

作成要求はフォームへの入場であり、作成完了時の実IDをこの起点で先取りしない。作成結果による正規編集への遷移は management.editor.handoff の同一実行・成功結果の関係に従う。削除の許容結果2は確定操作の失敗であり、成功は実対象の削除と読戻しに依存する。通信断だけで永続化結果を推定しない。

## 残る形式化

自由記述のCondition・Effectを元の意味を保持して機械式へ変換し、操作別出力Presence、起点、到達可能性、例外・不変条件を確定する。未対応は未証明のまま扱い、旧真偽判定や一部EffectのみのOutcomeに戻さない。網羅要求をclosedにする前に残る条件を解消する。
