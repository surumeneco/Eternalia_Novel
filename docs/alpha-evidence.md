---
title: Eternalia_Novel α版の検証結果（独立ローカルプレビュー）
project: Eternalia_Novel
status: exploratory-verified
updated: 2026-10-28
scope: alpha-local-preview
---

# α版ローカル検証結果

## 対象と位置付け

- 対象: ZIP提供の `Eternalia_Novel_alpha`。GitHub `surumeneco/Eternalia_Novel` 本体への反映は未実施。
- 採用済みスタック: Nuxt 4、NestJS、PostgreSQL、TypeScript。ZIPに各アプリの初期骨格は含むが、**今回動作したのはローカル限定の標準Node.jsプレビューサーバー**。
- 規範仕様: `forGPT/Eternalia_Novel/10_要件定義/100_機能仕様.md`、`20_基本設計/215_採用技術・原稿公開方式_20261028.md`。CATの `domain-spec` Draft はDriveの `40_開発・検証/415_CAT-Draft_公開境界.md`。
- ローカル実行モード: `node apps/preview/src/server.mjs`、127.0.0.1限定。開発用一時キーで管理APIを保護。**Discord OAuth2ではない**。

## 実際に実施した確認

1. `tsc -p packages/contracts/tsconfig.json` 成功（型チェック・コンパイル）。
2. `npm run test:alpha` 成功: Node.js test runner による**20件**の探索的テスト、失敗0。
3. 上記テストには実際のHTTPサーバーを別プロセスで起動し、シリーズ・編・部・章をHTTP APIで作成、公開、下書き編集、競合(409)、再公開、上位非公開、直接URLの404、JSONファイルの永続化、再起動後の可視性を確認するシナリオを含む。
4. `node --check` でローカルプレビューのサーバー・管理画面・読者画面のJavaScript構文検証を実施。
5. `node apps/preview/src/seed.mjs` でデモデータを生成可能であること、デモデータが既に存在する場合は拒否することを実行確認。
6. 公開読者向けAPIはカテゴリの作者用`presets`情報を返さないことを追加テストで確認。
7. ホスト名偽装とクロスオリジンの更新要求を拒否することをHTTP統合テストで確認。
8. HTML/CSS・UIの実ブラウザでのクリック操作は**未確認**。コンテナ上のChromiumはheadless screenshotがタイムアウト。外部からのUI実動作については利用者のローカルブラウザ確認を待つ。

## 既知の制約（Gate別の状態）

| 確認対象 | 状態 | 理由 |
| --- | --- | --- |
| TypeScriptドメインのbuild | passed (local exploratory) | tsc終了コード0 |
| ドメイン・HTTP探索的テスト | passed (20/20) | Node test runner実行結果。CAT生成テストではない |
| αプレビュー実サーバー起動/API | passed (local) | localhostのHTTP API応答と統合試験 |
| Nuxt 4 アプリの起動/build | not-run | npmレジストリに接続不可・依存未インストール |
| NestJSアプリの起動/build | not-run | 同上 |
| PostgreSQL接続・DB migrate | not-run | この実行環境にDockerがない |
| Discord OAuth2 | not-implemented | OAuth用の認証情報・実行環境なし |
| CAT `runner.py doctor` | blocked/not-run | 検証済みのCAT正規ランタイムをローカルへ取得不可 |
| CAT scope order / closure / TestModel / Queue / Red-Green / conformance | not-run | 正規runtime/guard未使用。探索的testを代用扱いしない |
| GitHub PR / merge / CI | not-run | GitHub Git接続不可、CAT正規handoff未実施 |
| デプロイ・実利用 | not-run | 127.0.0.1専用で実環境公開不可 |

## 今後の本番系実装Work

- **W0.1/W0.2**: 正規CATランタイム/doctor、Issue→Task→Work、仕様closure。
- **W0.3/W0.4**: Nuxt/Nest/Postgresの統合、migration、CI、UI確認。
- **W1**: Discord OAuth2と作者認可、CSRF/Session。プレビューのローカルキーを本番採用しない。
- **W2**: 下書き・公開スナップショットの永続化をPostgreSQLで実装し、APIからの匿名情報非漏洩を証跡付きで検証。
- **W3+**: 意味別語源・年表換算・編集ワークフロー、作品階層の操作/検索拡充。

本書は**ローカルで観測できた結果**の台帳であり、CATの機械生成Gate証拠ではない。
