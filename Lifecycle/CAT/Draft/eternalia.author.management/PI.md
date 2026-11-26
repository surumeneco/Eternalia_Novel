---
cat_version: '0.3'
kind: pi
id: eternalia.author.management.pi
status: draft
process: eternalia.author.management
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: []
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# PI: eternalia.author.management.pi

利用者が区別する値・操作・結果の意味上の境界。レコードは境界上の必要な射影であり、HTTP DTOやDOMタグの形を固定しない。値の有無は操作ごとに区別する。受付入力は各操作の必要項目だけを保持し、提供Operationは同一論理実行の結果観測を区別する。操作別の未変換結果条件はTCEと領域別仕様を維持する。

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.actor.author | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.シリーズID | 受信 | string | 不在 |
| 入力.一覧系列ID | 受信 | nullable<string> | 不在 |
| 入力.一覧種別 | 受信 | enum{series,volume,part,chapter,category,tip,tipSection,language,word,grammar,periodization,event} | 不在 |
| 入力.マスタ種別 | 受信 | enum{tag,div} | 不在 |
| 入力.削除確定 | 受信 | boolean | 不在 |
| 入力.言語ID | 受信 | nullable<string> | 不在 |
| 入力.対象ID | 受信 | string | 不在 |
| 入力.親ID | 受信 | nullable<string> | 不在 |
| 入力.作成系列ID | 受信 | nullable<string> | 不在 |
| 入力.種別 | 受信 | string | 不在 |
| 入力.旧item | 受信 | string | 不在 |
| 入力.旧create | 受信 | string | 不在 |
| 入力.改訂 | 受信 | integer | 不在 |
| 出力.一覧取得結果 | 送信 | enum{取得済み,取得失敗} | 任意 |
| 出力.一覧 | 送信 | sequence<record<id:string,title:string,order:integer,parentId:nullable<string>,editTargetId:string,isPublic:boolean,hasSnapshot:boolean>> | 任意 |
| 出力.言語候補 | 送信 | sequence<record<id:string,title:string>> | 任意 |
| 出力.章所属 | 送信 | sequence<record<chapterId:string,volumeId:string,partId:string>> | 任意 |
| 出力.選択言語 | 送信 | nullable<string> | 任意 |
| 出力.編集対象ID | 送信 | string | 任意 |
| 出力.画面 | 送信 | enum{管理入口,管理一覧,新規作成,個別編集,ログイン,対象拒否} | 任意 |
| 出力.選択系列ID | 送信 | string | 任意 |
| 出力.削除結果 | 送信 | enum{削除成功,競合,参照あり,認可拒否,削除失敗,確認不能} | 任意 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| select-series | 受付 | 系列選択 |
| list | 受付 | 一覧閲覧 |
| filter-language | 受付 | 言語絞込 |
| open-edit | 受付 | 編集要求 |
| open-create | 受付 | 作成要求 |
| delete-master | 受付 | 共通マスタ削除 |
| select-series-view | 提供 | 系列選択 |
| list-view | 提供 | 一覧閲覧 |
| filter-language-view | 提供 | 言語絞込 |
| open-edit-view | 提供 | 編集要求 |
| open-create-view | 提供 | 作成要求 |
| delete-master-view | 提供 | 共通マスタ削除 |

## 操作別存在
| 操作 | 項目 | 存在 |
| --- | --- | --- |
| select-series | 入力.シリーズID | 必須 |
| list | 入力.一覧種別 | 必須 |
| list | 入力.一覧系列ID | 必須 |
| filter-language | 入力.言語ID | 必須 |
| open-edit | 入力.シリーズID | 必須 |
| open-edit | 入力.対象ID | 必須 |
| open-edit | 入力.種別 | 必須 |
| open-create | 入力.種別 | 必須 |
| open-create | 入力.親ID | 必須 |
| open-create | 入力.作成系列ID | 必須 |
| open-edit | 入力.旧item | 任意 |
| open-edit | 入力.旧create | 任意 |
| delete-master | 入力.対象ID | 必須 |
| delete-master | 入力.マスタ種別 | 必須 |
| delete-master | 入力.改訂 | 必須 |
| delete-master | 入力.削除確定 | 必須 |
| select-series-view | 出力.画面 | 必須 |
| open-edit-view | 出力.画面 | 必須 |
| open-create-view | 出力.画面 | 必須 |

## 制約
| 式 |
| --- |

一覧系列IDは実URLの系列ID（最上位シリーズ一覧はなし）。実IDの所属、対象の同一性、操作に固有の結果Presenceは未形式化のTCEおよび領域別関係を参照する。共通TagとDivは異なるマスタ種別であり、削除の同一性は種別と安定IDの組で定まる。分類の内部kindと共通マスタ種別を混同しない。適合/不適合はPIの値でない。
