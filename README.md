# Eternalia_Novel — α版再実装（ドラフト）

旧v0.3のデザイントークン／情報階層を引き継いだ **Nuxt 4 + NestJS + PostgreSQL** のα版です。最初のNode標準ライブラリによるローカルプレビューも比較・単体確認用に残してあります。

現在の作業ブランチ: `draft/alpha-reimplementation-20261029`。ドラフトPR: [#2](https://github.com/surumeneco/Eternalia_Novel/pull/2)。CAT-TDDの正規GateとDiscord実アカウント・実ブラウザ検証は未完了です。**mainへマージしていません**。

## 選べる起動方法

1. **ローカル単体α（Discord/Postgres不要）**: Windows `start-alpha.cmd`、macOS/Linux `./start-alpha.sh`。旧プレビューと同じ読者・作者用URL（作者は起動時表示されるローカル専用キー）を使用します。UI配色はv0.3を継承。手順: [`docs/alpha-setup.md`](docs/alpha-setup.md)。
2. **採用構成の統合α（Nuxt/Nest/PostgreSQL/Discord）**: [`docs/alpha-nuxt-setup.md`](docs/alpha-nuxt-setup.md) に従って `.env`、Docker Compose、migration、Nuxt、Nestを起動。読者: `http://localhost:3000/`、作者: `http://localhost:3000/studio`。

どちらも本番インターネットへ公開しないでください。既存単体αのJSONとPostgreSQLの内容は自動同期されません。

## ディレクトリ

- `apps/web` — Nuxt 4：ホーム、ストーリー/設定集/辞書/年表、シリーズ、項目閲覧、ルビ・ページ区切り、作者の書斎
- `apps/api` — NestJS：公開専用API、作者限定CRUD/公開反映、Discord OAuth2+PKCE、PostgreSQL保存と競合制御
- `packages/contracts` — 純粋ドメイン：階層、下書き、公開スナップショット、祖先可視性、公開開始日、項目プリセット
- `db/migrations` — `content_nodes` / `published_snapshots` / OAuth state / author sessions
- `apps/preview` — オフライン用旧プレビュー（localhost限定キーとJSONストア、Discord認証とは別）
- `docs` — 設計継承、検証境界、機能別引継ぎ

## 検証と残課題

GitHub Actions `Alpha checks`: npm固定インストール、既存探索的α試験、Nuxt/Nest/契約ビルド、Nuxt型検査、PostgreSQL 17のmigrationと公開スナップショット／競合処理の探索的結合試験、作者ガード単体試験。実測結果は**コミットごとのCIログ**で確認してください。

未完了: CAT-TDD正規doctor・Guard／Conformance、Discord実アカウントOAuth2、UIのブラウザ操作とv0.3との実視覚比較、年表換算・意味別語源・管理マスタ等の詳細仕様。CI成功だけで正式α受入完了とは判断しません。詳しくは [`docs/alpha-check-evidence.md`](docs/alpha-check-evidence.md) と [`CAT-HANDOFF.md`](CAT-HANDOFF.md)。
