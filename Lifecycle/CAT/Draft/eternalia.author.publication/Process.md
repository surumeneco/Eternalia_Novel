---
cat_version: '0.3'
kind: process
id: eternalia.author.publication
status: draft
process: eternalia.author.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1G4q4DbJZdOk7jIfgvuZu0a2e4L1LIMti/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://github.com/surumeneco/Eternalia_Novel/issues/165
refs: ["eternalia.author.publication.pi", "eternalia.author.publication.tce", "eternalia.author.publication.relations"]
base_revision: 961d291f493df219ac36cf88108d302d680c51ef
semantic_contract: markdown-v2
language: ja
---

# Process: eternalia.author.publication

作者が公開状態と実効公開状態を同一系列で確認・編集する境界。保存済み下書きと保持公開版を別状態として扱い、公開版の親を辿る。作者の公開管理表示を読者からの観測結果と一致させる。

本DraftはW07の採用済み差分を再配置する。全機能をこの部分仕様だけで閉包したとは扱わない。相手は実際の利用者という外部Processであり、検証用の論理サービスを捏造しない。

## 契約
閉世界: 真

## 境界
| PI |
| --- |
| eternalia.author.publication.pi |

## 仕様状態
| ID | Domain |
| --- | --- |
| 状態.選択シリーズ | nullable<string> |
| 状態.公開絞込 | enum{すべて,公開,非公開,未公開稿} |

## 観測能力
| ID | 情報源 | Domain |
| --- | --- | --- |
| 観測.認証役割 | サーバーの作者認可 | enum{作者,非作者,未ログイン} |
| 観測.現在時刻 | 公開判定の時刻 | instant |
| 観測.系列ID | 系列選択の実在シリーズID（不在はなし） | nullable<string> |
| 観測.公開対象ID | 明示公開版更新の認可・改訂判定時に解決した実在未削除資料ID | nullable<string> |
| 観測.公開対象系列ID | 同一対象の下書き所属を辿った正規系列ID | nullable<string> |
| 観測.公開対象改訂 | 同一対象の保存済み下書き改訂（不在はなし） | nullable<integer> |
| 観測.下書き資料 | 下書き資料ID・親・所属と改訂 | sequence<record<id:string,parentId:nullable<string>,seriesId:string,revision:integer>> |
| 観測.公開資料 | 保持公開版の資料ID・公開版上の親と所属 | sequence<record<id:string,parentId:nullable<string>,seriesId:string>> |
| 観測.公開設定 | 現在の各資料自身の公開設定（公開版内容と独立） | sequence<record<id:string,isPublic:boolean,publicSince:nullable<instant>>> |

## 作用能力
| ID | 対象 | Domain |
| --- | --- | --- |
| 作用.公開設定更新 | 対象の公開設定 | record<id:string,isPublic:boolean,publicSince:nullable<instant>> |
| 作用.公開版更新 | 対象資料IDの確定済み公開版更新（要求送信だけではない）。更新内容は publication.snapshot.commit に従う | string |

## 起点
| ID | 由来 |
| --- | --- |
| 系列選択 | eternalia.author.publication.pi/select-series |
| 公開管理閲覧 | eternalia.author.publication.pi/view |
| 公開絞込 | eternalia.author.publication.pi/filter |
| 公開設定変更 | eternalia.author.publication.pi/update-visibility |
| 一括公開設定変更 | eternalia.author.publication.pi/batch-visibility |
| 明示公開版更新 | eternalia.author.publication.pi/publish |

## 適用範囲
現在時刻・公開版の有無・実祖先関係を仕様の観測に戻す。公開物理保存方式や時刻精度の未決事項をこの作業で新規固定しない。

未形式化のEffect・Condition・外部観測関係をTCE・領域別仕様に保持する。Compilerの対応範囲に合わせて要求を削らず、正式Gateは未完了。
