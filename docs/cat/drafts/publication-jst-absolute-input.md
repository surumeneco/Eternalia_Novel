---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.jst-absolute-input
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# PB-05 / AC-45・54: 公開日時は常にJST入力→UTCエポック保存（Draft）

## 確定した要求と旧挙動

2026-11-12採用：UIの入力は日本時間（UTC+09:00）とし、保存と比較はUTC（Epoch milliseconds）。公開判定は「現在時刻が開始時刻と等しい」場合を含む。親子の条件と公開版の有無が優先される。

観測した既存コード `apps/web/app/pages/studio.vue`, `studio/publication.vue` は `new Date('YYYY-MM-DDTHH:mm')` と端末の `getTimezoneOffset()` を使用していた。これはブラウザのOSタイムゾーンをJSTと誤認し、例えば米国やUTC設定で公開時刻がズレる。機能要件と矛盾する。

## 作業対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.jst.input | `datetime-local` の文字列を端末TZから独立して日本標準時と解釈 |
| eternalia.publication.jst.roundtrip | サーバEpoch msの日時を端末TZに依存せずJSTへ復元 |
| eternalia.publication.jst.validate | 2/30や13月、欠けた数字、負のEpoch等の不正入力を拒否し、保存リクエストを送らない |
| eternalia.publication.jst.gate | 公開許可は全祖先と本人の公開稿・isPublic・日時の条件が必須。前刻非公開/等号可/後刻可 |

## 受入条件

| ID | 条件 | 期待結果 |
| --- | --- | --- |
| JST-01 | UTC端末で`2031-02-03T09:15`を入力 | UTC Epoch `2031-02-03T00:15:00Z`でサーバ保存 |
| JST-02 | America/Los_Angeles端末で同じ日時 | JST-01と同一のEpochを保存 |
| JST-03 | 保存されたEpochがロードされる | `2031-02-03T09:15`と表示され、端末TZ変更でも不変 |
| JST-04 | 不正日付（2/30）や非正規形 | APIを書き換えず、編集者へ入力エラー |
| JST-05 | 自身または祖先の日時が現在より未来 | 匿名API/検索/直URLでは不可視、等号の瞬間から可視。既存公開稿の内容のみ |
| JST-06 | 作者の書斎と公開管理、ja/en画面切替 | 両日時入力導線で同一の変換器を使い、JSTを明示。別のタイムゾーンを採用しない |

## 検証とGate境界

本Artifactは既存の採用決定を意味論として引用したDraft。新たな規範Confirmed、Process Closure、Model Conformance、Generated Queue、Implementation Conformanceを主張しない。探索的Node/PG/Nuxt/Chromium受入を正式CAT Gateに代替しない。
