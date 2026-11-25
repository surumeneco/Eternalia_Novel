---
cat_version: '0.3'
kind: pi
id: eternalia.author.publication.pi
status: draft
process: eternalia.author.publication
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

# PI: eternalia.author.publication.pi

利用者が区別する値・操作・結果の意味上の境界。レコードは境界上の必要な射影であり、HTTP DTOやDOMタグの形を固定しない。値の有無は操作ごとに区別する。受付入力は各操作の必要項目だけを保持し、提供Operationは同一論理実行の結果観測を区別する。操作別の未変換結果条件はTCEと領域別仕様を維持する。

## 境界
| 相手Process | 方向 |
| --- | --- |
| eternalia.actor.author | 双方向 |

## 項目
| ID | 方向 | Domain | 存在 |
| --- | --- | --- | --- |
| 入力.シリーズID | 受信 | string | 不在 |
| 入力.対象ID | 受信 | string | 不在 |
| 入力.公開絞込 | 受信 | enum{すべて,公開,非公開,未公開稿} | 不在 |
| 入力.公開フラグ | 受信 | boolean | 不在 |
| 入力.公開日時 | 受信 | nullable<instant> | 不在 |
| 入力.改訂 | 受信 | integer | 不在 |
| 出力.管理行 | 送信 | sequence<record<id:string,isPublic:boolean,effectivelyPublic:boolean,status:enum{未公開稿,自身非公開,日時未設定,公開前,祖先非公開,公開中},publicSince:nullable<instant>>> | 任意 |
| 出力.公開絞込 | 送信 | enum{すべて,公開,非公開,未公開稿} | 任意 |
| 出力.選択系列ID | 送信 | string | 任意 |
| 入力.一括対象 | 受信 | sequence<record<id:string,revision:integer,isPublic:boolean,publicSince:nullable<instant>>> | 不在 |
| 出力.一括結果 | 送信 | sequence<record<id:string,result:enum{成功,競合,認可拒否,失敗}>> | 任意 |
| 出力.更新結果 | 送信 | enum{成功,競合,認可拒否,失敗,確認不能} | 任意 |

## 操作
| ID | 方向 | 起点 |
| --- | --- | --- |
| select-series | 受付 | 系列選択 |
| view | 受付 | 公開管理閲覧 |
| filter | 受付 | 公開絞込 |
| update-visibility | 受付 | 公開設定変更 |
| batch-visibility | 受付 | 一括公開設定変更 |
| publish | 受付 | 明示公開版更新 |
| select-series-view | 提供 | 系列選択 |
| view-view | 提供 | 公開管理閲覧 |
| filter-view | 提供 | 公開絞込 |
| update-visibility-view | 提供 | 公開設定変更 |
| batch-visibility-view | 提供 | 一括公開設定変更 |
| publish-view | 提供 | 明示公開版更新 |

## 操作別存在
| 操作 | 項目 | 存在 |
| --- | --- | --- |
| select-series | 入力.シリーズID | 必須 |
| filter | 入力.公開絞込 | 必須 |
| update-visibility | 入力.シリーズID | 必須 |
| update-visibility | 入力.対象ID | 必須 |
| update-visibility | 入力.公開フラグ | 必須 |
| update-visibility | 入力.公開日時 | 必須 |
| update-visibility | 入力.改訂 | 必須 |
| batch-visibility | 入力.一括対象 | 必須 |
| publish | 入力.対象ID | 必須 |
| publish | 入力.シリーズID | 必須 |
| publish | 入力.改訂 | 必須 |
| update-visibility-view | 出力.更新結果 | 必須 |
| update-visibility-view | 出力.管理行 | 不在 |
| update-visibility-view | 出力.公開絞込 | 不在 |
| update-visibility-view | 出力.選択系列ID | 不在 |
| update-visibility-view | 出力.一括結果 | 不在 |
| publish-view | 出力.更新結果 | 必須 |
| publish-view | 出力.管理行 | 不在 |
| publish-view | 出力.公開絞込 | 不在 |
| publish-view | 出力.選択系列ID | 不在 |
| publish-view | 出力.一括結果 | 不在 |
| batch-visibility-view | 出力.一括結果 | 任意 |

## 制約
| 式 |
| --- |

実IDの所属、対象の同一性、操作に固有の結果Presenceは未形式化のTCEおよび領域別関係を参照する。適合/不適合はPIの値でない。
