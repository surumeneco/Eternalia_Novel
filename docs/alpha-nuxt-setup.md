# α採用構成のローカル起動（Nuxt 4 / NestJS / PostgreSQL）

**対象ブランチ**: `draft/alpha-reimplementation-20261029`（PR #2）。Node.js 22以上、Docker/Compose、npmを利用します。リポジトリのルートで操作してください。

## 1. 依存と環境変数

```bash
npm ci
cp .env.example .env
```

Windows PowerShellではコピーを `Copy-Item .env.example .env` に置き換えます。以下をローカルの `.env` で設定してください。

- `POSTGRES_PASSWORD` を強いローカルパスワードに変更し、同じパスワードを `DATABASE_URL` に反映。URL中に予約文字がある場合はURLエンコード。
- `APP_ORIGIN=http://localhost:3000`（ブラウザでも必ず同じ `localhost` 名を使用）。
- Discord Developer Portalで作成したアプリの `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`。
- `DISCORD_AUTHOR_USER_ID` に**唯一許可する作者のDiscordユーザーID**。
- DiscordのOAuth2 Redirect URLを `http://localhost:3000/api/auth/discord/callback` に正確に登録。

`.env` は `.gitignore` 対象です。実際のクライアントシークレットをチャット、Issue、Gitへ貼らないでください。Discord OAuth2を設定しなくても匿名読者は確認できますが、作者APIは使用できません。

## 2. データベース

```bash
docker compose up -d database
npm run db:migrate
```

`db:migrate` はルートの `.env` を読み込み、未適用migrationだけを適用します。DBはDockerボリューム `pgdata` に永続化されます。既存本番DBでの実行は禁止です。

## 3. ドメインとサーバー

```bash
npm run build:contracts
npm run dev:api
```

このターミナルを開いたままにし、別ターミナルで以下を実行します。

```bash
npm run dev:web
```

APIのデフォルトは `127.0.0.1:3001`、Nuxtは `localhost:3000`。Nuxtサーバーからのみ `NUXT_API_INTERNAL_URL` を使用して内部APIをプロキシします。

- 読者: `http://localhost:3000/`（ホーム・4領域・シリーズ・項目）
- 作者: `http://localhost:3000/studio`（Discordログイン→管理）
- ヘルスチェック: `http://localhost:3000/api/health`

DBは初期状態では空です。作者画面でシリーズを作成し、下書きを保存し、**明示的な公開版反映**を行ってください。シリーズの各祖先も公開されて初めて子の章や設定が匿名読者に見えます。

## 4. 検証の境界

`npm run test:alpha` は旧プレビューと純粋ドメインの探索的テスト。`npm run test:db` は**PostgreSQL起動・migration・APIビルドが完了した状態**で実行してください。CIはそれらをPostgreSQL 17の一時コンテナで検査します。

この手順は実装コードから構成したものです。ユーザー端末でのDiscord認証・ブラウザ描画、CAT-TDDの規範Gate、実ユーザー認証付き管理APIの総合受入はまだ実測していません。エラーが出た場合はCIログと環境変数の不一致を切り分けてください。
