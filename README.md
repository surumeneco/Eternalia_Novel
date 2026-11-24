# Eternalia_Novel — 小説執筆・公開・閲覧Webアプリ（α版）

作者向けの小説・設定集・創作言語/辞書・年表の編集管理と、匿名読者向けの公開/閲覧を行うWebアプリ。採用構成は **Nuxt 4 / Vue / TypeScript + NestJS / TypeScript + PostgreSQL + Discord OAuth2**。下書き保存と明示的な公開版更新を分離し、公開可否はサーバー側で祖先の状態・公開開始日時を含めて判定します。

**α版開発は2026-11-17に完了しました。** 完了条件は、採用された主要機能が`develop`に統合され、利用者が実機確認を開始できることです（[完了判定と受入検証の正本](https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view)）。**実機確認・受入判断・確認後の不具合修正や意図との差異の調整・β版開発はα版完了後の工程**です。

**実機確認対象は `develop`**。変更は作業ブランチで検証して随時 `develop` に統合します。`main` への統合・リリースはユーザーの明示的な承認を要します。GitHub Actionsの自動テスト成功は実Discord認証・実機操作・CAT-TDD正式Gate・旧v0.3視覚受入の完了を意味しません。

## 起動・確認

- **採用構成を確認する**: [Nuxt/Nest/PostgreSQLのローカル起動](docs/alpha-nuxt-setup.md)。既存クローンでは `git switch develop` → `git pull --ff-only origin develop` の後、専用検証DBを使って起動します。読者 `http://localhost:3000/`、作者 `http://localhost:3000/login` → `/admin`。
- **旧独立プレビューの比較を行う**: [ローカルNodeプレビュー](docs/alpha-setup.md)。`apps/preview` のJSONストア・ローカル専用キーは採用構成のDB・Discord OAuthと独立しており、現在の機能・認証の受入に使いません。両者のデータは自動同期されません。

## 実装コードと構成

| 所在 | 主な責務 |
| --- | --- |
| `apps/web/` | Nuxtの公開4領域、シリーズ/詳細/章の読者UI、作者Studio/管理UI、i18n固定文言 |
| `apps/api/` | Nestの公開/作者API、Discord認証、公開状態と権限判定 |
| `packages/contracts/` | 領域モデル、下書き/公開投影、階層/検索/保存の共有処理 |
| `db/migrations/` | PostgreSQLスキーマとマイグレーション |
| `apps/preview/` | 旧Node単体プレビュー。探索・比較用であり本番アプリではない |

## 文書の正本と実測

| 用途 | 参照先 |
| --- | --- |
| **要件・設計・旧版の採否** | [Driveプロジェクトインデックス](https://drive.google.com/file/d/1iyt-eHelLjROHcgO699p86poC0Y_-7pd/view)（要件100、採用決定215、受入条件400など） |
| **α版完了後の実機確認・改善Work** | [CAT-HANDOFF.md](CAT-HANDOFF.md) |
| **AC-01〜78のコード/自動試験証拠と未検証境界** | [ACトレーサビリティ](docs/alpha-ac-traceability.md) |
| **実機・実Discord・旧UI対比の手順と実測** | [MAN-01〜15](docs/alpha-manual-acceptance.md)、[IME/Android補助手順](docs/verification/editor-ime-android-handoff.md) |
| **CIの構成と証拠の解釈** | [workflow](.github/workflows/alpha-checks.yml)、[検証境界](docs/alpha-check-evidence.md)、[Actions](https://github.com/surumeneco/Eternalia_Novel/actions) |
| **CAT-TDDのWork/Candidates** | `docs/cat/`、`Lifecycle/`。Draftは正式Confirmedではない |
| **旧v0.3の視覚資産** | [旧UI資産対応](docs/legacy-ui-asset-map.md) |

READMEと引継ぎには可変の最新SHA・ジョブ数の実測値を重複保存しません。最新状態は当該ブランチのコード・CI・受入台帳を再取得してください。編集や公開の機能が実装されていても、正式CAT Gateや実端末の受入は独立して判定します。
