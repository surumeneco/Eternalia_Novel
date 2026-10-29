# α版実装・CAT-TDD引継ぎ（2026-10-29時点）

> このファイルは作業状態の記録であり、CAT-TDDの確認済みProcess/PI/TCE、Gate出力またはα版受入結果ではない。

## 正本・Git

- 対象: `surumeneco/Eternalia_Novel`（Nuxt 4 / NestJS / PostgreSQL / Discord OAuth2）
- 要件・受入正本: Google Drive `forGPT/Eternalia_Novel/` の `100_機能仕様.md`、`200_情報構造・画面設計.md`、`220_ビジュアルデザイン・画面コンポーネント継承設計.md`、`300_データモデル.md`、`310_API・セキュリティ.md`、`400_受入検証計画.md`
- 開発計画: 同フォルダの `40_開発・検証/430_α版段階的実装計画・引継ぎ_20261029.md`
- 作業ブランチ: `feature/alpha-reimplementation-20261029`（確認した基準SHA: `57d82906bf4a2b47465545387adc07c8c6b15466`）
- `develop` / `main`: `7d23cbf43b37bcafef29abacdb6802657ae16cdc`
- [PR #3](https://github.com/surumeneco/Eternalia_Novel/pull/3): feature → develop、open/draft、未マージ。mainへ直接反映しない。

## 実コードで存在を確認した構成（α受入ではない）

- `apps/web`: Nuxt 4公開ホーム・領域入口・シリーズ／汎用項目閲覧・作者用汎用フォーム。
- `apps/api`: NestJSの作者制限付きノード作成／編集／公開操作、公開閲覧API、Discord OAuth2。
- `packages/contracts`: ノード階層、下書き・公開スナップショット、祖先を含む公開可否を扱う純粋関数。
- `db/migrations`: PostgreSQLの保存と認証状態管理のためのmigration。
- `apps/preview`: 開発中の比較用Nodeローカルプレビューであり、正式なNuxtアプリの代替ではない。

## 検証状況（対象を混同しない）

| 検証 | 状態 | 根拠・限界 |
| --- | --- | --- |
| GitHub Actions `Alpha checks` | `passed`（基準SHAのみ） | [Run 40822331572](https://github.com/surumeneco/Eternalia_Novel/actions/runs/40822331572) は completed/success。新しいコミットへ成功を転用しない |
| CAT-TDD runtime doctor / stage guard | `not-run` | このチャット実行環境には正規CATランタイム・対象repoのcheckoutがなく、GitHubのGit接続も名前解決に失敗 |
| CAT process-closure / TestModel / vectors / Queue / Red / Green / implementation-conformance | `not-run` | 探索的テスト、CI、GitHub APIを正規Gateの代用にしない |
| Discord実アカウント認証 / ブラウザE2E / 旧v0.3視覚比較 | `not-run` | CI成功だけでは成立しない |
| α受入 / developマージ / mainリリース / デプロイ | `not-run` | 不足する領域固有機能を完成扱いしない |

## 機能上の残作業

現行の `/stories`・`/tips`・`/dictionaries`・`/timeline` はシリーズ入口中心、`/series/[id]` と `/items/[id]` は汎用ノード表示、`/studio` は一画面の汎用フォームに留まる。**作品を執筆・公開し読むためのα完成には不足**している。

1. 公開・作者の画面責務／URL契約とデザイン継承を具体化し、不要な宣伝的文言を除く。
2. ストーリー: 編→部→章、本文・ルビ・ページ区切り・前後章、保存・公開・読書のE2E。
3. 設定集: 1階層カテゴリ、Tip/TipSection、作成時のみの項目プリセット複製、タグ・関連。
4. 辞書: 言語・文字/音韻・文法、単語の複数意味・品詞、意味別の語源、検索。
5. 年表: 年代区分／出来事・統合表示。年換算式の未決事項は実装で推測しない。
6. 4領域共通の公開日時・祖先公開条件・下書き非漏洩と更新競合、検索・新着・認可・削除/無効化契約の検証。

## 開発工程の再開条件

`cat-tdd-development` → `issue-work`、確定仕様に基づく実装Workでは `spec-implementation` に引き渡す。正規CAT-TDDリビジョン、`routing.json`、`doctor`、Guardと対象checkoutを取得した環境で進める。Workごとに `feature/*` → `develop` のPR、機能単位のコミット、受入条件ごとの証拠を記録する。CATが実行不能の間は、GitHubの直接編集によって必要なGuardを迂回しない。
