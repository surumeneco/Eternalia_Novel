# α版 GitHub Actionsの検証範囲

CIの現行構成は [`.github/workflows/alpha-checks.yml`](../.github/workflows/alpha-checks.yml) が正本。ジョブ構成・環境・コマンドは変更され得るので、**この説明より現行workflowと対象commitの[Actions](https://github.com/surumeneco/Eternalia_Novel/actions)を優先**する。

## 現行の4ジョブ

| ジョブ | 実行内容・役割 |
| --- | --- |
| `build-and-test` | Node 22 / `npm ci`、既存探索的domain/HTTPテスト、AC台帳構造検査、JUnit実行器自己試験、contracts/Nest/Nuxtビルド・型検査、PostgreSQL 17 migrationとDBテスト |
| `compile-and-typecheck` | domain試験が失敗しても独立にビルド/型エラーを検出する |
| `postgres-integration` | 別のPostgreSQL 17サービスへmigrationを適用し、トランザクション・作者ガードをJUnitで確認 |
| `http-ssr-acceptance` | Ubuntu 24.04・固定Playwright/Chromium・一時PostgreSQLで実ビルド済みNest/Nuxtの匿名HTTP、SSR、公開判定、作者UIを検証し、JUnitとスクリーンショットを収集 |

実行前の `npm ci`、migration、検証専用DBとCI実行時の証拠を区別する。失敗した先行stepのため後段が未実行の場合、「全テスト失敗」や「Red確認済み」とは扱わない。**workflow全体のsuccessを確認するには同じcommitの4ジョブの結果を照合する。**

## 合否を代替できないもの

実DiscordアカウントOAuth2、Windows/AndroidのIME・Undo・実タブ/OS BFCache、実データの本番運用、旧v0.3画面との人間による視覚比較、CAT-TDD正規のClosure/Model/Queue/Conformance/Red-GreenはCI成功からは推定できない。合成作者セッションや合成可視状態イベントのChromium成功は、実サービス/実OSの合格証拠ではない。性能SLAを未合意の合成データ件数から推定しない。

個々の受入条件とコード/CI/不足条件の結び付けは [AC台帳](alpha-ac-traceability.md)、手動受入の実測は [MAN台帳](alpha-manual-acceptance.md) が保持する。ビルド/CIの履歴を時系列で本書へ増補しない。

## 過去の検証が示したこと（履歴）

- [2026-10-31 Actions #41089773500](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41089773500) は当時の3ジョブ構成でPostgreSQLの9テストが成功したが、他2ジョブが失敗しworkflow全体はfailureだった。**過去の構成であり、現在のジョブ数ではない。**
- [Actions #41213396614](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213396614) は当時の4ジョブ成功、初期実Chromium 15件・HTTP/SSR 6件の探索的証拠。後続HEADの検証や実機確認の代わりにはならない。
- 合成セッションをログアウトすると共有トークンが失効する問題を [b339483](https://github.com/surumeneco/Eternalia_Novel/commit/b339483c82d151ce48fd6a33f85e77cb53ffdbd7)・[047e94b](https://github.com/surumeneco/Eternalia_Novel/commit/047e94bbe385e5ecb872b7ce5be461f925642486) の独立セッション化で修正。以降の証拠は個別AC行とCI履歴で追跡する。
