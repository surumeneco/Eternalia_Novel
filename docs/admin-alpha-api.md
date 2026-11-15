# 作者管理API — NestJS実装の入口

全て `AuthorGuard` によりDiscordセッションを検証。変更要求では `Origin === APP_ORIGIN` と `Content-Type: application/json` を必須にする。環境変数 `DATABASE_URL` がない場合は書込不可（ローカルJSONへはフォールバックしない）。

- `GET /api/admin/nodes`: 作者のみに下書き・公開状態を返す
- `POST /api/admin/nodes`: kind,parentId,content → サーバー採番 UUID
- `PATCH /api/admin/nodes/:id`: expectedRevision,content。楽観競合時409
- `POST /api/admin/nodes/:id/publish`: expectedRevision。下書きを明示的に公開スナップショットへコピー
- `POST /api/admin/nodes/:id/visibility`: expectedRevision,isPublic,publicSince
- `POST /api/admin/nodes/:id/move-category`: 同一シリーズ内の設定下書きカテゴリ移動（公開稿の所属変更とは別）
- `POST /api/admin/nodes/:id/soft-delete`: 公開済みで非公開化済み等、制約を満たす対象の論理削除

各操作で `LibraryStorageService.mutate` のPostgreSQLトランザクション、既存ドメインの階層／内容検証を実施する。作者APIと匿名公開APIは異なるDTO。

**検証境界**: PostgreSQL・Nuxt/Nest・Chromiumを使用した合成作者/匿名セッションのHTTP統合試験、公開制御・改訂競合テストは [AC証拠台帳](alpha-ac-traceability.md) と当該HEADの[Actions](https://github.com/surumeneco/Eternalia_Novel/actions)にある。ただし**実Discordアカウントによる認証/編集操作**、全UI操作、CAT-TDD正式Gateは未受入であり、CI成功からは断定しない。API契約の現在値は実際のcontrollerとドメインコードを優先する。
