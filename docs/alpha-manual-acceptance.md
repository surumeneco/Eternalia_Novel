# α版 実機受入チェックリスト（未実施）

対象: `surumeneco/Eternalia_Novel` / PR #3 / `feature/alpha-reimplementation-20261029`。正本は `forGPT/Eternalia_Novel/40_開発・検証/400_受入検証計画.md`。本書は実機検証の手順と記録欄であり、実施済み証拠ではない。

**現在の判定: 全件 not-run（人間による実機検証）。** GitHub Actionsの合成セッション/一時PostgreSQL/Chromium成功はDiscord本人認証、実IME、端末、旧v0.3デザイン承認を代替しない。

## 準備と安全条件

1. `docs/alpha-nuxt-setup.md` に従い、Node.js 22以上、Docker PostgreSQL、`npm ci`、`npm run db:migrate`、`npm run dev:api` と `npm run dev:web` を準備。作業用の**検証専用DB**を使用し、既存の執筆データを保護する。CIシード用 `scripts/check-http-acceptance.mjs` は既存データ入りDBに対して実行しない。
2. Discord Developer PortalでOAuth2 Redirect URLを `http://localhost:3000/api/auth/discord/callback` に登録。`.env` に `APP_ORIGIN=http://localhost:3000`、`DISCORD_CLIENT_ID`、`DISCORD_CLIENT_SECRET`、`DISCORD_AUTHOR_USER_ID`、`DATABASE_URL` を設定。秘密値、Cookie、認証コード、実ユーザーIDを証跡へ転記しない。
3. **本人のDiscordアカウント**と、作者allowlistに含まれない**別の検証アカウント**を使う。別人の認証情報を共有しない。作者認可とログイン成功を別々に判定する。
4. ブラウザの通常ウィンドウ（作者）とプライベートウィンドウ（匿名読者）を分ける。各検証の開始時刻、ブラウザ/OS、feature HEAD、観測結果を記録する。

## 実操作シナリオ

| ID / AC | 操作 | 期待結果 | 判定 |
| --- | --- | --- | --- |
| MAN-01 / AC-18,72 | `/studio` → Discordログイン → 認可同意 → コールバック | 作者本人だけが管理UIに入り、`/api/auth/me` は認証済み。state/PKCE不一致・期限切れは拒否。秘密値はURL/ログに残らない | not-run |
| MAN-02 / AC-19,22 | 非作者の別Discordアカウントでログインし、`/studio` と管理APIを試す | 認証済みでも作者権限を取得できず、作成/編集/公開/削除が拒否される。DBに変更なし | not-run |
| MAN-03 / AC-21,23 | 未ログインでホームと公開4領域を閲覧し、管理画面/APIへアクセス | 公開情報はログイン不要、作者用本文・メモ・操作は不可視、保護APIは401/403 | not-run |
| MAN-04 / AC-01,16,69 | シリーズ→編→部→章、設定項目、単語/意味別語源、文法、年代区分→出来事を作成。下書き保存後に匿名画面、明示公開後に再確認 | 下書きだけでは旧公開版が保持され、明示公開で新内容が読者に反映。再読込しても下書きと公開稿が混同されない | not-run |
| MAN-05 / AC-17,28〜32,35〜44,70 | 公開済み親を非公開→匿名の一覧/検索/直URL/API/関連リンク確認→親を再公開 | 非公開の子孫・件数・本文が全経路で漏れない。子自身の非公開は親再公開後も維持 | not-run |
| MAN-06 / AC-12,14 | 同じ章を2つの作者タブで開き、Aで保存後、古いBで保存 | 競合が明示され、Aの保存内容は上書きされず、Bの未保存入力を失わない | not-run |
| MAN-07 / AC-18,23 | 作者がログアウト→再読込→保護APIを試し、別ブラウザで再ログイン | ログアウトしたセッションだけ失効し、管理操作が拒否。再ログインは新セッション | not-run |
| MAN-08 / AC-03,15,33,57,65 | 長文（例: 日本語1万字）、改行、`｜漢字《かんじ》`、`[[page]]`、絵文字・アクセント文字を編集、保存・再読込・公開 | 文字欠落・変換崩れ・ルビ/ページ区切りの破損なし。選択範囲/Undo/フォーカスが維持 | not-run |
| MAN-09 / AC-65 | Windows日本語IMEで変換中にルビ操作・保存・候補選択、確定後に再編集 | 変換途中のテキストが壊れず、確定済み文字列・カーソル位置・Undoが正常 | not-run |
| MAN-10 / AC-60〜64,78 | PC・タブレット・390px・320pxで読者/作者UIを確認し、旧v0.3の公開UIと画像比較 | 青/黒/緑、石板風面、ナビ/パンくず/トークンの継承が説明でき、横スクロールや操作不能なし。作者キャンバスは未承認デザインを強制しない | not-run |
| MAN-11 / AC-45,54,76,77 | 公開日時境界・削除・無効化の操作仕様を確認 | **仕様未決**。決定前は実装・合格を強制せず pending-decision として保留 | pending-decision |


## 自動撮影した比較用スクリーンショット（人間の判定は未実施）

[Actions #41213912611 の alpha-ui-screenshots（11枚）](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213912611/artifacts/13047567293) は `8a6f24d0cac82ef98c58fea80d404f3b06f420df` の実Chromium/一時DBで取得した。読者4領域の390px・1280px、作者のデスクトップ・390px・320pxを含み、4ジョブ成功、ブラウザ15件・HTTP6件成功。CI artifactは**7日間保持**で、期限後の再生成には該当feature HEADのCIを実行する。

比較原典は `docs/legacy-ui-asset-map.md` に記載の旧 `Eternalia_frontend/develop@170fb60` と `forGPT/Eternalia_Novel/20_基本設計/220_ビジュアルデザイン・画面コンポーネント継承設計.md`。スクリーンショットの**取得成功は視覚的一致・利用者承認ではない**。MAN-10で旧UIとの画像対照を行い、差分と採否を記録する。

## 証跡記録テンプレート

`test_id / AC-ID / 実施日時(JST) / OS・ブラウザ・画面幅 / feature HEAD / テストデータ（匿名化） / 操作 / 期待結果 / 実結果 / スクリーンショット・ログ参照 / pass・fail・not-run・pending-decision / 再現手順` を1件ごとに記録する。スクリーンショットは認証Cookie・OAuthコード・個人情報を隠す。実施していない項目をCIの成功でpassにしない。

自動化済み部分の証拠は `docs/alpha-ac-traceability.md` とGitHub Actionsを参照する。実機検証が成功しても、CAT-TDD正式Gate・未決仕様の承認・PRマージは独立した工程。
