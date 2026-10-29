# α作者管理API — 保護されたNestJS実装ドラフト

全て `AuthorGuard` によりDiscordセッションを検証。変更要求では `Origin === APP_ORIGIN` と `Content-Type: application/json` を必須にする。環境変数 `DATABASE_URL` がない場合は書込不可（ローカルJSONへはフォールバックしない）。

- `GET /api/admin/nodes`: 作者のみに下書き・公開状態を返す
- `POST /api/admin/nodes`: kind,parentId,content → サーバー採番 UUID
- `PATCH /api/admin/nodes/:id`: expectedRevision,content。楽観競合時409
- `POST /api/admin/nodes/:id/publish`: expectedRevision。下書きを明示的に公開スナップショットへコピー
- `POST /api/admin/nodes/:id/visibility`: expectedRevision,isPublic,publicSince

各操作で `LibraryStorageService.mutate` のPostgreSQLトランザクション、既存ドメインの階層／内容検証を実施する。作者APIと匿名公開APIは異なるDTO。

**検証境界**: コードとCI型検査の可否はGitHub Actionsに依存。認証済みDiscordユーザーのブラウザから実際に書込／改訂競合／予約公開／公開解除の結合試験をまだ行っていない。CAT-TDD Gateも未実施。
