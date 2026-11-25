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
| 状態.選択言語 | nullable<string> |
| 状態.編集対象 | nullable<string> |
| 状態.未保存入力 | json-object |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.認証役割 | サーバーの作者認可 | enum{作者,非作者,未ログイン} |
| 観測.資料階層 | 対象と実祖先・所属・種別 | sequence<record<id:string,parentId:nullable<string>,seriesId:string,kind:string,title:string,order:integer>> |
| 観測.共通マスタ | Tag/Divの保存済み状態と改訂 | sequence<record<id:string,kind:enum{tag,div},revision:integer,name:string>> |
| 観測.マスタ参照 | 現在の参照関係 | sequence<record<masterId:string,targetId:string>> |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |
| 作用.削除対象 | 共通Tag/Divの確定削除 | string |

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
旧クエリの値は観測すべき入力差であり、別の互換機能を要求しない。削除可否の純粋判定は内部実装として再利用できるが、独立Process合格を削除動作全体の合格にしない。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
