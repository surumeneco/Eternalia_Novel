---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.http-clock-boundary
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 匿名公開APIの日時等号境界をHTTPで固定時計検証する（Draft）

## 採用仕様と既存の証拠

PB-05/10～12、AC-45/54/70の公開条件は、UTC epoch msの現在時刻が公開開始日時より前なら不可視、**等号を含めて以降なら公開可能**、ただし全祖先の実効公開条件・公開スナップショットの存在が必須という採用済み規則である。

共有ドメインの純粋関数の境界テストおよび実PostgreSQL/Nest/Nuxt HTTPの未来予約/解除テストは存在する。一方、実Nest公開HTTPリクエストが`開始日時-1ms/等号/+1ms`で同じ公開稿を投影することの決定的な証拠は不足する。コントローラの`Date.now()`をHTTPテストで安全に置換できるよう、時計をNest内部の注入可能なサービスに分離する。**実アプリの日時を上書きする環境変数や外部管理APIは作らない。**

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.http-clock.reader | 公開item/series/tree/recentの時刻取得元を統一しHTTP境界試験で固定可能にする |
| eternalia.publication.http-clock.path | パンくず取得も同じ時刻と公開制御に従わせる |
| eternalia.publication.http-clock.boundary | 4領域の未来予約を実DBへ保存し、同じスナップショットが-1ms/等号/+1msで正しく公開されるか検証 |
| eternalia.publication.http-clock.ancestor | シリーズ祖先の時刻条件を等号でも適用し、子だけが先行して公開されないことを検証 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| CLOCK-HTTP-01 | 章・設定・単語・出来事が未来開始日時Tで公開予約 | 実Nest HTTPのT-1msでは直接404、ツリー/新着/パンくずに含めず、秘密のタイトルを漏らさない | CLOCK-HTTP-01 |
| CLOCK-HTTP-02 | 同じ実DBと公開稿で時計をTに進める | 実Nest HTTPのTちょうどで4領域すべてが公開され、タイトル/本文が元の公開稿と一致する | CLOCK-HTTP-02 |
| CLOCK-HTTP-03 | 時計をT+1msに進める | 4領域の公開可否とスナップショットが変化せず、公開中のままである | CLOCK-HTTP-03 |
| CLOCK-HTTP-04 | 祖先シリーズをT+10msに予約する | T+9msでは子の直接/パンくずを遮断し、T+10ms以降のみ全祖先条件が成立する | CLOCK-HTTP-04 |

## CAT境界

本Draftは既定仕様を観測できるようにする内部の時計注入設計であり、規範のConfirmed化やCAT正式Gateではない。固定時計の差替えは**テストで直接作成したNestアプリのDI内だけ**で実施し、本番公開APIに時刻操作の入り口を提供しない。
