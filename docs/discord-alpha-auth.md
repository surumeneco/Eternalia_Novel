# Discord OAuth2（実装ドラフト、実機未検証）

- Discord Developer Portalでアプリを登録し、Redirect URLを `http://localhost:3000/api/auth/discord/callback`（実際のAPP_ORIGINに合わせる）として登録。
- `APP_ORIGIN` はブラウザが開くNuxtの正確なorigin。 `DISCORD_CLIENT_ID`、`DISCORD_CLIENT_SECRET`、`DISCORD_AUTHOR_USER_ID` は環境変数で設定。**Gitには秘密情報をコミットしない**。
- `DATABASE_URL` が必須。 `npm run db:migrate` で `002_auth.sql` を適用。
- ログイン開始: `GET /api/auth/discord` → Discord公式のAuthorization Code + PKCE →コールバックにstate cookieを照合→DiscordユーザーIDがallowlistの唯一の作者と一致したときのみセッション発行。
- 認証CookieはHttpOnly / SameSite=Lax、HTTPS設定時Secure、ランダムな64桁hex。DBにはハッシュだけ保存、Discordアクセストークンは保存しない。
- 作者向け変更加工は `AuthorGuard` がセッション・origin・JSON Content-Typeを検査してから実施する構造。単なるユーザー名や画面の表示状態による認可は行わない。
- `GET /api/auth/me` は `{configured,authenticated}` のみ返す。 `POST /api/auth/logout` はセッション破棄。
- `APP_ORIGIN` のHttp originは **localhost開発専用**。外部公開時はHTTPS、Cookie/Proxy/CSRFテスト、Discord Developer Portalの許可URLを再点検すること。

**未検証**: Discord実アカウント認証フロー、Cookieの各ブラウザ挙動、異常応答、実DBでのセッション破棄。CI成功はOAuth2実機確認を意味しない。
