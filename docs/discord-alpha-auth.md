# Discord OAuth2（実装ドラフト、実機未検証）

- Discord Developer Portalでアプリを登録し、Redirect URLを `http://localhost:3000/api/auth/discord/callback`（実際のAPP_ORIGINに合わせる）として登録。
- `APP_ORIGIN` はブラウザが開くNuxtの正確なorigin。 `DISCORD_CLIENT_ID`、`DISCORD_CLIENT_SECRET`、`DISCORD_AUTHOR_USER_ID` は環境変数で設定。**Gitには秘密情報をコミットしない**。
- `DATABASE_URL` が必須。 `npm run db:migrate` で `002_auth.sql` を適用。
- ログイン開始: `GET /api/auth/discord` → Discord公式のAuthorization Code + PKCE →コールバックにstate cookieを照合→DiscordユーザーIDがallowlistの唯一の作者と一致したときのみセッション発行。
- 認証CookieはHttpOnly / SameSite=Lax、HTTPS設定時Secure、ランダムな64桁hex。DBにはハッシュだけ保存、Discordアクセストークンは保存しない。
- 作者向け変更加工は `AuthorGuard` がセッション・origin・JSON Content-Typeを検査してから実施する構造。単なるユーザー名や画面の表示状態による認可は行わない。
- `GET /api/auth/me` は `{configured,authenticated}` のみ返す。 `POST /api/auth/logout` はセッション破棄。
- `APP_ORIGIN` のHttp originは **localhost開発専用**。外部公開時はHTTPS、Cookie/Proxy/CSRFテスト、Discord Developer Portalの許可URLを再点検すること。

**受入境界**: state/PKCE、Cookie処理、模擬Discord token交換、作者/非作者セッション・失効は合成HTTP/一時PostgreSQLの探索的試験を実施済み（対象HEADごとの結果は [AC台帳](alpha-ac-traceability.md) と [Actions](https://github.com/surumeneco/Eternalia_Novel/actions) で照合）。**実Discordアカウント**による認証、各端末/ブラウザのCookie挙動、実サービス障害時の操作は未受入。合成成功をCAT正式Gateや実OAuth2受入に昇格させない。
