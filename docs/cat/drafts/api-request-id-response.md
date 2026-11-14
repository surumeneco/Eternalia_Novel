---
cat_version: '0.3'
kind: domain-spec
id: eternalia.api.request-id-response
status: draft
process: eternalia.api
source_refs:
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
  - https://drive.google.com/file/d/1Kq3Ubm5cKJopx09DpvrX79Z8mrcvimsJ/view
  - https://drive.google.com/file/d/1Cco3i2LFhdkB1wguoQ1Rb6N79GmzbeDY/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# API応答のRequestId追跡ヘッダー（Draft）

## 根拠と非採用事項

AC-71では旧Backendのエラーエンベロープ、RequestId、内部例外メッセージ秘匿、言語コンテキスト独立性を実APIで確認する。旧Backendの`meta.requestId`はガイドと実Interceptorに不一致があり、旧エラー形式そのものは移植確定ではない（920旧コード資産監査、310_API・セキュリティ）。

現行Nest APIには`Cache-Control: no-store`等の全応答ヘッダー処理があるが、リクエスト単位の追跡IDが無い。現行UIとの後方互換性を保つため既存JSON成功/失敗レスポンスのshapeは変更しない。旧エンベロープの全面採用や500内部例外のフォーマット変更はこのWorkに含めない。HTTPの`X-Request-Id`のみを新しく付与する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.api.request-id.per-request | 全APIリクエストごとにサーバー生成の新しい追跡IDを割り当てる |
| eternalia.api.request-id.errors | 200/401/404等の成功・認証拒否・不存在応答で同じヘッダーを利用可能にする |
| eternalia.api.request-id.proxy | Nuxt APIプロキシ経由の応答でも追跡IDを消失させない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| API-REQUEST-ID-01 | Nest APIの公開成功レスポンスを2回呼ぶ | 各応答に一意のUUID v4形式`X-Request-Id`があり、同一値の使い回しがない | API-REQUEST-ID-01 |
| API-REQUEST-ID-02 | 未認証の管理APIと非公開項目を読む | 401/404応答でも追跡IDを提供し、成功/エラーJSONとキャッシュ制御を維持する | API-REQUEST-ID-02 |
| API-REQUEST-ID-03 | 攻撃者の`X-Request-Id`を付けてNest/APIプロキシを呼ぶ | 入力ヘッダーを信用・反射せず、サーバー側が安全な新しいIDを付与する | API-REQUEST-ID-03 |

## 限界

これは旧v0.3のエラーエンベロープそのものをConfirmed化したものではない。後方互換の追跡ヘッダーを追加する探索的WorkのDraftであり、正式CAT Process Closure/Model/Implementation Gate合格も実Discord受入も意味しない。
