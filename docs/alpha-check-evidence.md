# α版 GitHub Actions検証境界

CI workflow: `.github/workflows/alpha-checks.yml`。Push / Pull Requestで固定npm lockから `npm ci`、既存α探索的テスト、contracts/Nest/Nuxtビルド、Nuxt型検査を走らせる。

**この文書は検証計画であって結果ではない。** 成功・失敗は当該HEADのGitHub Actions実行記録とログを根拠に別途記録する。CI成功でも以下はそれぞれnot-run/未確認のまま: 正規CAT-TDD doctor/guard/Red/Green/conformance、PostgreSQL接続/移行、Discord OAuth2本人認証、ブラウザの実操作、旧v0.3画面との視覚比較、公開後の本番利用。

元の `apps/preview` はローカル用であり、Nest読取ブリッジもそれに依存する。PostgreSQL実装に移るまで本番デプロイ不可。
