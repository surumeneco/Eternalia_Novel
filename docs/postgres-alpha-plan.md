# PostgreSQL α永続化（実装途上）

- 現行設計正本: Drive `215_採用技術・原稿公開方式_20261028.md` / `300_データ設計.md`。
- 旧SQL Serverは使用しない。
- DB初期migration `001_library.sql` は `content_nodes`（下書き・階層・可視性）と `published_snapshots`（読者用独立公開版）を分離する。
- 実行: `DATABASE_URL=postgres://... npm run db:migrate`。Compose DBを事前に起動し、パスワードと接続先を一致させる。
- 順序と親IDの参照整合はDB制約とドメイン層の両方で検査する。未公開子孫の秘匿、公開日時判定はAPI側が担う。
- このコミットでは **migrationの適用結果・DB接続・ORM/クエリ統合・Discord認証は未検証／未実装**。
- 本スキーマは初期αの保存骨格。意味別語源、年表正規化、タグ/管理マスタ等の詳細テーブル確定前に本番データを投入しない。
