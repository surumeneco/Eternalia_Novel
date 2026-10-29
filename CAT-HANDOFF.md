# Eternalia_Novel α版 — 実装・検証引継ぎ

> 2026-10-29更新。CAT-TDDのconfirmed仕様、機械的Gate、α受入の完了証跡ではない。
> 本記録のコード基準は `734e15ece6c5d16c372d256f220fe26f339bdcb3`（本記録更新の直前）。
> 次回はGitHubの現在HEAD、PR、CIを再取得すること。

## 正本・開発境界

- Repository: `surumeneco/Eternalia_Novel`
- Branch: `feature/alpha-reimplementation-20261029`; PR: [#3](https://github.com/surumeneco/Eternalia_Novel/pull/3) → `develop`、Draft/open、未マージ
- `develop` / `main` はリリース対象の受入を満たすまで変更しない。
- 採用済み要件・設計・受入条件の正本はGoogle Driveの `forGPT/Eternalia_Novel/` 内、特に `100_機能仕様.md`、`200_情報構造・画面設計.md`、`220_ビジュアルデザイン・画面コンポーネント継承設計.md`、`300_データモデル.md`、`310_API・セキュリティ.md`、`400_受入検証計画.md`。段階計画は `430_α版段階的実装計画・引継ぎ_20261029.md`。
- CAT-TDDは `cat-tdd-development` → `issue-work` または `spec-implementation`。本環境では正規実行系とローカルcheckout不在、GitHubのDNS解決不能。正規doctor/guard/Queue/Red/Green/implementation-conformanceは `not-run`。GitHub APIでのコード更新やActions成功はCATの代替ではない。

## 実装済み（ただしブラウザ受入未完了）

| Workの一部 | 実装・テスト |
| --- | --- |
| A1/A2 下書き・公開/閲覧 | NestJS+PostgreSQL、Discord OAuth2の許可作者だけの編集、スナップショット、祖先遮断、版競合、Nuxtストーリー本文・目次・前後章・ルビ・ページ区切り表示 |
| A3 設定集 | 公開カテゴリ→Tip→TipSection、検索・カテゴリ絞込、新規Tip用カテゴリプリセットの作者UI（既存項目へ非伝播） |
| A4 辞書 | 言語別の公開単語/文法、検索と品詞絞込、**独立IDを持つ複数意味と意味別語源**、別シリーズ参照拒否、非公開参照語のID/タイトル遮断、構造化した作者UI・読者UI |
| A4 言語 | **文字・発音・語頭/語末許容・後続文字関係・品詞マスタ**の保存/検証、作者UI・読者UI。品詞マスタを単語意味エディターと接続 |
| A5 年表 | 公開年代区分・出来事一覧・区分絞込、**同じ区分内のみ**相対年でソート。区分をまたぐ年代換算は未決/未実装 |
| A6 公開管理 | 4領域横断の公開版更新、公開/非公開切替、状態/領域/名称絞込、公開日時編集、作者編集画面への導線 |
| A6 共通 | 実公開データによる新着・更新情報（未公開/非公開を秘匿）、読者詳細から作者のみ編集へのリンク、未保存離脱確認 |
| A6 メモ | **作者のみの別DBテーブル**・改訂競合検出・タグ付きメモ保存、一覧/検索/新規/編集UI、APIガード |

## 現行CIの独立証拠

- `734e15ec` の Push [40864473111](https://github.com/surumeneco/Eternalia_Novel/actions/runs/40864473111) と PR [40864482955](https://github.com/surumeneco/Eternalia_Novel/actions/runs/40864482955) は `completed/success` を取得。
- `npm run test:alpha`: ドメイン・公開境界・辞書意味/語源・言語の文字関係・年代区分内ソート等の探索的単体試験。
- `npm run build`、Nuxt typecheck、`npm run db:migrate`、`npm run test:db`：CIで成功。PostgreSQLで下書き/公開版、競合、語源公開参照と作者メモの保存を検証。
- **未実施**: 実Discordログインの本人/他人検証、ブラウザE2E、旧FEとの画像比較、デスクトップ/タブレット/スマートフォンの操作、長文/IME、CAT規範Gate、デプロイと実機受入。

## α受入を満たすための残Work（優先）

1. **公開設定の縦断E2E**: 全4領域の作成→保存→再読込→公開→匿名アクセス→非公開、時刻境界と関連経路、作者以外による拒否。実DB/ブラウザ/Discordの外部証拠が必要。
2. **設定のタグ・設定間関連**: 参照先の実効公開に従った投影、作者編集、カテゴリ横断検索。前セッションの該当書込は安全性チェックで拒否。拒否された変更は未反映として扱い、回避はしない。
3. **年表の年代間換算**: 相対年と基準年の換算式・入力精度が未確定。区分をまたぐ勝手な換算は行わない。
4. **領域共通の順序変更・表示**: 編/部/章・TipSection・辞書・年代など。下書き/公開稿と順序変更の反映境界を設計してから実装。
5. **削除・無効化**: 非公開・無効化・削除の契約、参照/子孫/公開稿/復旧の作用が未決。旧ゴミ箱UIは明示保留だが、削除と無効化全体は継承対象。
6. **多言語固定UI/エラー文言、スケルトン表示、UIの端末幅別実機検証**、仕様IDとAC-01〜AC-78への証跡対応。ドメイン編集時のテキスト操作も要検証。
7. **CAT-TDD正規実行環境**: 対象checkoutと検証済みCAT runtimeを取得したうえでdoctor→stage routing/guardsと正規証拠を実行する。

**判定**: 現時点でCIは成功しているが、α版の全受入条件は未達。`develop` へのマージ、`main` への反映、α完成宣言は行わない。 
