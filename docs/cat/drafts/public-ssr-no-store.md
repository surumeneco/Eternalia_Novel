---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.ssr-no-store
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 読者用SSR公開情報のHTTPキャッシュ抑止（Draft）

## 仕様根拠と適用判断

PB-10〜12は親の非公開化により子孫の一覧・詳細・検索・直接参照を遮断する。AC-31はキャッシュを再取得した場合も子孫情報を開示しないことを要求する。公開APIはNestの共通ミドルウェアで既に`Cache-Control: no-store`を返しているが、Nuxtのサーバー描画HTMLは別のHTTP応答であり、同じ条件が明示されていない。

既存ページのURLや表示仕様を変更せず、作者の書斎と読者のページに対して`Cache-Control: private, no-store`を指定し、HTTPキャッシュに公開済みコンテンツや編集中画面を保存させない。アセットの長期キャッシュやAPIプロキシのレスポンスは変更しない。これはHTTPキャッシュ向けの指示であり、開いたままのブラウザタブや既取得DOMを無条件に消す保証ではない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.publication.ssr.headers | ホーム、公開領域、個別章・設定・検索等のSSR HTML応答にno-storeを指定 |
| eternalia.publication.ssr.author | 作者専用の書斎にもキャッシュ抑止を適用 |
| eternalia.publication.ssr.assets | APIプロキシと静的Nuxtアセットのキャッシュ方針を変更しない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| SSR-CACHE-01 | 匿名で公開ホーム・検索・章・設定のSSR HTMLをGET | 200応答が`private, no-store`を含み、公開稿は引き続き表示される | SSR-CACHE-01 |
| SSR-CACHE-02 | 非公開・予約公開の個別章・項目のURLをGET | 該当応答がキャッシュ可能な公開稿や秘匿本文を返さない | SSR-CACHE-02 |
| SSR-CACHE-03 | API直接呼出とNuxt APIプロキシをGET | 既存のAPI no-storeおよび認証境界を維持し、静的Nuxtアセットへの追加抑止を行わない | SSR-CACHE-03 |

## 検証とCAT境界

このDraftは採用済みの公開・祖先遮断規則から導いた実装上の防御措置であり、規範ConfirmedやCAT Gate合格ではない。テストで確認するのはHTTP応答ヘッダーと現在の本文投影であり、すべてのブラウザ履歴/BFCache、CDN構成、実機のキャッシュ挙動を一括で保証しない。
