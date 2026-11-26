---
cat_version: '0.3'
kind: process
id: eternalia.author.management
status: draft
process: eternalia.author.management
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.management.pi", "eternalia.author.management.tce", "eternalia.author.management.relations"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.author.management

作者が正規管理一覧から対象を選択し、正規作成・編集へ進む責務。共通Tag/Div管理は同一作者境界の操作として扱うが、言語品詞マスタとは別の領域。権限・所属の実データと対象IDを境界で区別する。

本DraftはW07の採用済み差分を再配置する。全機能をこの部分仕様だけで閉包したとは扱わない。相手は実際の利用者という外部Processであり、検証用の論理サービスを捏造しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.author.management.pi |

## 仕様状態
| ID | Domain |
| --- | --- |
| 状態.選択シリーズ | nullable<string> |
| 状態.一覧種別 | nullable<string> |
| 状態.選択言語 | nullable<string> |
| 状態.編集対象 | nullable<string> |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.認証役割 | サーバーの作者認可 | enum{作者,非作者,未ログイン} |
| 観測.資料階層 | 対象と実祖先・所属・種別 | sequence<record<id:string,parentId:nullable<string>,seriesId:string,kind:string,title:string,order:integer,isPublic:boolean,hasSnapshot:boolean>> |
| 観測.共通マスタ | Tag/Divの保存済み状態と改訂 | sequence<record<id:string,kind:enum{tag,div},revision:integer,name:string>> |
| 観測.マスタ参照 | 現在の参照関係 | sequence<record<masterKind:enum{tag,div},masterId:string,targetId:string>> |
| 観測.系列ID | 系列選択・一覧閲覧で対象となった実在シリーズのID（不在はなし） | nullable<string> |
| 観測.一覧取得 | 同一一覧閲覧での作者API取得結果（失敗は成功した空列と区別） | enum{取得済み,取得失敗} |
| 観測.編集ID | 編集パスに対応する実在資料ID（不在はなし） | nullable<string> |
| 観測.編集所属系列 | 編集対象から祖先を辿って得た実在シリーズID（不正な祖先はなし） | nullable<string> |
| 観測.編集種別 | 編集対象の実際の種別（不在はなし） | nullable<string> |
| 観測.作成親ID | 作成パスに対応する実在親ID | nullable<string> |
| 観測.作成親系列 | 作成親の実在する祖先系列ID | nullable<string> |
| 観測.作成親種別 | 作成親の実際の種別 | nullable<string> |
| 観測.削除対象種別 | 実対象が属する共通マスタ種別（対象不在はなし） | nullable<enum{tag,div}> |
| 観測.削除対象ID | 削除対象マスタの実在ID（不在はなし） | nullable<string> |
| 観測.削除対象改訂 | 対象マスタの実改訂（不在はなし） | nullable<integer> |
| 観測.削除対象参照あり | 同一種別・IDへの現実の保存参照が一件以上存在するか（実DB参照集合の存在判定。削除可否・試験合否ではない） | boolean |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |
| 作用.削除対象 | 指定種別の共通マスタの確定削除ID（種別と同一作用） | string |
| 作用.削除種別 | 同一確定削除の共通マスタ種別 | enum{tag,div} |

## 起点
| ID | 由来 |
| --- | --- |
| 系列選択 | eternalia.author.management.pi/select-series |
| 一覧閲覧 | eternalia.author.management.pi/list |
| 言語絞込 | eternalia.author.management.pi/filter-language |
| 編集要求 | eternalia.author.management.pi/open-edit |
| 作成要求 | eternalia.author.management.pi/open-create |
| 共通マスタ削除 | eternalia.author.management.pi/delete-master |

## 適用範囲
旧クエリの値は入力差であり、別の互換機能を要求しない。管理境界が所有するのは一覧の現在の種別・系列/言語条件と編集対象の遷移であって、個別エディターが所有する本文・未保存入力ではない。未保存保護と新規作成後の編集値の引継ぎは management.editor.handoff で規定する。削除可否の純粋判定は内部実装として再利用できるが、独立Process合格を削除動作全体の合格にしない。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
