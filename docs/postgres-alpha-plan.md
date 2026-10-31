# PostgreSQL α永続化（実装ドラフト）

- 現行設計正本: Drive `215_採用技術・原稿公開方式_20261028.md` / `300_データ設計.md`。
- 旧SQL Serverは使用しない。
- Migration `001_library.sql` は `content_nodes`（下書き・階層・可視性）と `published_snapshots`（読者用独立公開版）を分離する。
- `PostgresLibraryService`: 単一作者向けにトランザクション・アドバイザリロック内で全階層を読込み、純粋ドメインで検証した差分をパラメタ化SQLで更新する。下書き保存は公開版の更新を含まない。
- `LibraryStorageService`: `DATABASE_URL` があれば PostgreSQLを使用。なければ従来のローカルJSONを**読取専用**で利用する。管理操作の書き込みをJSONへ黙ってフォールバックしない。
- 初期設定: ComposeのPostgresを起動後、接続情報に合う `DATABASE_URL` を渡して `npm run db:migrate`。Nest起動時に勝手にschemaを更新しない。
- 公開APIは `publicSeries / publicTree / toReader` で独立公開版だけを投影し、祖先非公開・公開日時を全段階で判定する。
- 初期αの実装形式であり、意味別語源・年表換算・作者認証・競合と大規模負荷の包括受入前に本番データを投入しない。

**検証境界**: CIでTypeScriptやビルドが通っても、PostgreSQL実接続・migration・書込・再起動を通した結合試験を別途実施するまで完了とはしない。CAT-TDD正規Gateも別途必要。
