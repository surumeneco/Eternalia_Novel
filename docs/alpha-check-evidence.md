# α版 GitHub Actions検証境界

CI: `.github/workflows/alpha-checks.yml`。固定npm lockから `npm ci`、既存探索的αテスト、contracts/Nest/Nuxtビルド、Nuxt型検査、PostgreSQL 17サービス起動、明示的migration適用、独立スナップショット・改訂競合・管理Guardの探索的結合/単体テストを実行する。

**実行結果は当該HEADのGitHub Actionsログで確認する。CI設定をコミットしただけで成功とはみなさない。**

CIが成功しても、以下は別途not-runまたは未確認: 正規CAT-TDD doctor/guard/Red/Green/conformance、Discord実アカウントによるOAuth2、ブラウザの作者編集導線、旧v0.3画面との実スクリーンショット比較、年表換算・辞書の全仕様、公開後の利用者アクセス検証。CIの一時DBは破棄されるので本番データ保存を意味しない。

## 2026-10-31: CI失敗時にも独立して実行する検証

`Alpha checks` は各Push/PRで以下の3ジョブを独立実行する。

- `build-and-test`: 既存の探索的domain/preview試験、その後ビルド・型検査・DB試験を順次実行。前段が失敗すれば後段は未実施となる。
- `compile-and-typecheck`: domain試験の失敗とは独立してcontracts/Nest/Nuxtビルドを実行し、Nuxt型検査はビルド不合格時にも実行する。**元のジョブを無効化したものではない**。
- `postgres-integration`: 独立PostgreSQL 17環境にmigrationを適用し、contracts/Nestのビルド後に作者ガード・メモ・公開スナップショット・競合処理等のDB統合試験を実行する。

検証例: [Actions run 41089773500](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41089773500) では `postgres-integration` の9テストが全件成功。一方、`build-and-test` と `compile-and-typecheck` の失敗は独立して残り、**workflow全体はfailure**。各ジョブ・各テストの実際の結論は常に現在HEADのActionsで再照合する。

この証跡は正規CAT-TDD Gate、ブラウザE2E、Discord実アカウント認証の検証を代替しない。
