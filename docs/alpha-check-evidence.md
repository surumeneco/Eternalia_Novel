# α版 GitHub Actions検証境界

CI: `.github/workflows/alpha-checks.yml`。固定npm lockから `npm ci`、既存探索的αテスト、contracts/Nest/Nuxtビルド、Nuxt型検査、PostgreSQL 17サービス起動、明示的migration適用、独立スナップショット・改訂競合・管理Guardの探索的結合/単体テストを実行する。

**実行結果は当該HEADのGitHub Actionsログで確認する。CI設定をコミットしただけで成功とはみなさない。**

CIが成功しても、以下は別途not-runまたは未確認: 正規CAT-TDD doctor/guard/Red/Green/conformance、Discord実アカウントによるOAuth2、**人間による作者編集操作**、旧v0.3画面との実スクリーンショット比較、年表換算・辞書の全仕様、公開後の利用者アクセス検証。合成作者セッションでのChromiumブラウザE2Eは後述のとおりCIで実施済みであり、実Discord認証と混同しない。CIの一時DBは破棄されるので本番データ保存を意味しない。

## 2026-10-31: CI失敗時にも独立して実行する検証

`Alpha checks` は各Push/PRで以下の3ジョブを独立実行する。

- `build-and-test`: 既存の探索的domain/preview試験、その後ビルド・型検査・DB試験を順次実行。前段が失敗すれば後段は未実施となる。
- `compile-and-typecheck`: domain試験の失敗とは独立してcontracts/Nest/Nuxtビルドを実行し、Nuxt型検査はビルド不合格時にも実行する。**元のジョブを無効化したものではない**。
- `postgres-integration`: 独立PostgreSQL 17環境にmigrationを適用し、contracts/Nestのビルド後に作者ガード・メモ・公開スナップショット・競合処理等のDB統合試験を実行する。

検証例: [Actions run 41089773500](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41089773500) では `postgres-integration` の9テストが全件成功。一方、`build-and-test` と `compile-and-typecheck` の失敗は独立して残り、**workflow全体はfailure**。各ジョブ・各テストの実際の結論は常に現在HEADのActionsで再照合する。

この証跡は正規CAT-TDD Gate、ブラウザE2E、Discord実アカウント認証の検証を代替しない。

## 2026-10-31: 実ChromiumブラウザE2Eの拡張（同一HEAD証拠）

[Actions #41213396614](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213396614)（commit `e6299061f3445207a599d9d1fbde7e1b397f5829`）で4ジョブすべてsuccess。実Nuxt/Nest/PG17/Chromiumのブラウザ試験15件・HTTP/SSR試験6件が全件成功した。

今回検証した代表的な操作: 5種類（章/TipSection/単語/文法/出来事）の下書き保存→再読込→明示公開→非公開→再公開、単語の意味・語源の保存、長文Unicodeの往復、2タブの409競合と入力保持、未保存離脱のキャンセル、作者320/390pxと読者390/768/1280px、合成作者のログアウトと他セッション保全、匿名検索・関連リンクの非公開制御。

CIの合成セッションをログアウトすると後続テストの共有トークンも失効する問題を [`b339483`](https://github.com/surumeneco/Eternalia_Novel/commit/b339483c82d151ce48fd6a33f85e77cb53ffdbd7) と [`047e94b`](https://github.com/surumeneco/Eternalia_Novel/commit/047e94bbe385e5ecb872b7ce5be461f925642486) で独立セッション化して解消。修正後の [Actions #41213292305](https://github.com/surumeneco/Eternalia_Novel/actions/runs/41213292305) は4ジョブsuccess。

これらは**探索的な実HTTP/ブラウザ検証**であり、正規CAT-TDDのRed/Greenや規範Gate、実Discord OAuth、実IME、旧v0.3の視覚比較、全AC合格を意味しない。AC-01〜78の網羅状態は `docs/alpha-ac-traceability.md`、実機手順は `docs/alpha-manual-acceptance.md` を参照。後続のUIスクリーンショットartifact収集は別のCI結果で検証する。
