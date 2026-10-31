# α採用構成のローカル起動（Nuxt 4 / NestJS / PostgreSQL）

**対象ブランチ**: `feature/alpha-reimplementation-20261029`（PR #3、統合先は`develop`）。Node.js 22以上、Docker/Compose、npmを利用します。リポジトリのルートで操作してください。

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

### HTTP/SSR統合試験（データを投入するため、空の検証専用DBだけで実施）

CIは一時PostgreSQLに対し、NestJSとNuxtの実HTTP、公開・非公開、4領域の作者作成→保存→公開、公開稿/下書き分離、作者以外の拒否、ログアウト後の失効を検証します。ブラウザ操作や実Discord OAuth2ログインの試験ではありません。

ローカルでも試す場合は、既存の作品・作者セッションが一切入っていない、**破棄可能な専用DB**に `DATABASE_URL` を向け、`npm run build` と `npm run db:migrate` の後に実行してください。試験はDBに架空の作品とランダムな一時作者セッションを投入します。空でないDBへのシードは拒否します。

```bash
HTTP_ACCEPTANCE_DISPOSABLE_DB=1 NODE_ENV=test node --env-file-if-exists=.env scripts/check-http-acceptance.mjs
```

PowerShellでは実行前に `$env:HTTP_ACCEPTANCE_DISPOSABLE_DB='1'` と `$env:NODE_ENV='test'` を設定してください。実運用DBや普段の執筆DBには決して実行しないでください。

### 実ChromiumブラウザE2E（追加）

GitHub Actionsの `http-ssr-acceptance` ジョブはUbuntu 24.04上でPlaywright 1.56.1/Chromiumを導入し、実Nuxt画面のスマートフォン幅閲覧・ページ送り、4領域の詳細表示、合成作者セッションでのシリーズ作成→下書き→明示公開、作者用メモ/並べ替え/公開管理の表示、ルビ選択範囲、未保存変更の遷移確認を実行します（`apps/web/browser-acceptance/browser-acceptance.test.mjs`）。Discordの実OAuth2ログインと本人/別人の手動試験、実IME変換は**含みません**。

ローカルでブラウザE2Eを追加実行する場合は、前節の**空の破棄可能なDB**とマイグレーション完了を前提として、Playwright 1.56.1 と対応Chromiumを用意し、`HTTP_BROWSER_ACCEPTANCE=1` を加えて同じスクリプトを起動します。PlaywrightはCI専用のためアプリ本体の依存には含めていません。

```bash
npm install --no-save --package-lock=false playwright@1.56.1
npx playwright install chromium
HTTP_ACCEPTANCE_DISPOSABLE_DB=1 HTTP_BROWSER_ACCEPTANCE=1 NODE_ENV=test node --env-file-if-exists=.env scripts/check-http-acceptance.mjs
```

PowerShellでは最後の実行前に `$env:HTTP_ACCEPTANCE_DISPOSABLE_DB='1'`、`$env:HTTP_BROWSER_ACCEPTANCE='1'`、`$env:NODE_ENV='test'` を設定します。Nuxtの `stories/tips/dictionaries/timeline` と `studio` は子ルートを描画する必要があり、SSR・ブラウザ試験がその退行を検出します。

この手順は実装コードから構成したものです。ユーザー端末でのDiscord認証・ブラウザ描画、CAT-TDDの規範Gate、実ユーザー認証付き管理APIの総合受入はまだ実測していません。エラーが出た場合はCIログと環境変数の不一致を切り分けてください。
