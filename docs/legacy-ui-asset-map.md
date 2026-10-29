# 旧UI資産の継承元

- 原典: `surumeneco/Eternalia_frontend/develop@170fb60bfd2a46d673807e2de744e6a33fb4990e`
- 規範: Google Drive `forGPT/Eternalia_Novel/20_基本設計/220_ビジュアルデザイン・画面コンポーネント継承設計.md`
- 本コミット: 原典SCSSのテキストを無改変で保存（将来の視覚比較用）。稼働CSSへの変換とは別工程。

| 原典 | 現行の参照位置 |
| --- | --- |
| `assets/variables/_pallet.scss` | `apps/web/app/assets/legacy/variables/_pallet.scss` |
| `assets/variables/_color.scss` | `apps/web/app/assets/legacy/variables/_color.scss` |
| `assets/variables/_font-size.scss` | `apps/web/app/assets/legacy/variables/_font-size.scss` |
| `assets/variables/_margin.scss` | `apps/web/app/assets/legacy/variables/_margin.scss` |
| `assets/variables/_radius.scss` | `apps/web/app/assets/legacy/variables/_radius.scss` |
| `assets/styles/default.scss` | `apps/web/app/assets/legacy/styles/default.scss` |

色系統は sky / grass / void、意味ロールは concept / background / text / border。旧読者画面の空から草原への背景と石板面を基準とする。作者編集キャンバスへの全面適用は未決のまま維持。

状態: `source-imported`。Nuxt 4 ビルド、スクリーンショット比較、CAT-TDD Guardは未実施。