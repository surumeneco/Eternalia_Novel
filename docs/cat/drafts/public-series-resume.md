---
cat_version: '0.3'
kind: domain-spec
id: eternalia.public.series-resume
status: draft
process: eternalia.public
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 公開シリーズ目次の復帰時再検証（Draft）

## 既存設計

100_機能仕様 PB-03/PB-05/PB-10/11と310_API・セキュリティ §5.1により、非公開または未来予約のシリーズ・子孫情報を公開API、読者画面、キャッシュに残さない。PR #87でTipと章の公開詳細に導入された`usePublicReaderRevalidation`を再利用し、シリーズ目次だけを補完する。別のライフサイクル機構は作らない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.public.series.resume | 公開シリーズ目次・子孫項目の再検証 |
| eternalia.public.series.failure | 非公開化・通信失敗時の旧データ遮断 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SERIES-RESUME-01 | 匿名のシリーズ目次を非表示にする | 既表示のシリーズと子孫のテキストを即座に隠す | SERIES-RESUME-01 |
| SERIES-RESUME-02 | 非表示中にシリーズを未来公開へ変更し復帰する | 公開APIを再取得し404時に旧一覧/パンくずを表示しない | SERIES-RESUME-02 |
| SERIES-RESUME-03 | 非表示中にシリーズを再公開し復帰する | 同一URLで最新の公開目次を取得し表示する | SERIES-RESUME-03 |
| SERIES-RESUME-04 | BFCache風復帰後の公開APIが503を返す | 旧公開結果を再利用せず既存のエラーUIを表示する | SERIES-RESUME-04 |

## 限界

現行Nest公開判定・SSR・公開稿と下書きの分離は変更しない。Headless Chromiumでは可視状態イベントを合成して検証し、実OSタブ切替・実BFCache/CDN・常時前面の即時失効は未検証。DraftおよびWorkの構文確認は正式CAT Gateの完了ではない。
