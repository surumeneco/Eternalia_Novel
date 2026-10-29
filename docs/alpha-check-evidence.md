# α版 GitHub Actions検証境界

CI: `.github/workflows/alpha-checks.yml`。固定npm lockから `npm ci`、既存探索的αテスト、contracts/Nest/Nuxtビルド、Nuxt型検査、PostgreSQL 17サービス起動、明示的migration適用、独立スナップショット・改訂競合・管理Guardの探索的結合/単体テストを実行する。

**実行結果は当該HEADのGitHub Actionsログで確認する。CI設定をコミットしただけで成功とはみなさない。**

CIが成功しても、以下は別途not-runまたは未確認: 正規CAT-TDD doctor/guard/Red/Green/conformance、Discord実アカウントによるOAuth2、ブラウザの作者編集導線、旧v0.3画面との実スクリーンショット比較、年表換算・辞書の全仕様、公開後の利用者アクセス検証。CIの一時DBは破棄されるので本番データ保存を意味しない。
