# Eternalia_Novel α版 — 開発・受入の現行入口

この文書は**いま進めるべきWorkの分類と、証拠の参照先**だけを扱う。要求・設計の正本は [Google Drive プロジェクトREADME](https://drive.google.com/file/d/1iyt-eHelLjROHcgO699p86poC0Y_-7pd/view)、実装状態は [developの現行コード](https://github.com/surumeneco/Eternalia_Novel/tree/develop)、検証結果は [AC-01〜78台帳](docs/alpha-ac-traceability.md) / [実機受入](docs/alpha-manual-acceptance.md) が正本。固定SHA・PR状態・CI結果は作業ごとに取得する。

## 受入・リリースの境界

- **利用者確認対象は `develop`**。まとまった変更を検証して随時統合するが、ユーザー受入の代わりにはしない。`main` への統合・リリースは利用者の明示的な許可が必要。
- Nuxt 4 / NestJS / PostgreSQL / Chromiumの自動テストが成功していても、**Discord実アカウント、Windows/Android実IME、実OS BFCache、旧v0.3との目視比較、CAT-TDD正式Gate**の受入が自動的に完了することはない。
- 年代区分間の共通年は現行実装で `C = Periodization.RelativeYears + Event.Year` を使用（PR #79）。**旧v0.3には符号式の明記がなく、正式仕様への昇格は未了**。年0/負年/公開投影の実装テストと、仕様承認・実操作の合否は別。
- 78件のACの `not-run` は「未実装78件」を意味しない。原則として各採用要求を「コードの挙動／自動証拠／CAT正式Gate／実機受入」の4軸で判定する。適用除外AC-13（ゴミ箱）・AC-77（独立無効化）は勝手に復活させない。

## 残Workの分類・次の具体的判定

| Work | 現在の証拠・未充足の条件 | 進め方 |
| --- | --- | --- |
| **R0 証拠整合** | ACごとに複数の部分試験証拠があるが、全体の人間受入は別。PR #111の**187ノード公開ツリー**はID完全性・秘匿の部分証拠であり、性能SLAではない。PR #112は**意味別語源と未公開祖先**のDomain部分証拠 | 過去CIを最新HEADへ転用せず、該当ACにソース・実行ID・残境界を接続する。記録更新を新規機能実装と数えない |
| **R1 公開情報の保護** | 章/設定/辞書/年表、検索/新着/関連リンク、匿名HTTP、復帰時の**合成**ライフサイクルには実PostgreSQL/Chromium証拠がある。実OS BFCache/CDN、未被覆参照・大規模件数等は別 | 現行の公開可視性述語・読者投影を起点に、欠落が実測された条件だけ試験/修正。高負荷の実測閾値は未合意のまま勝手に合否化しない |
| **R2 旧版機能・UI6照合** | AC-05/55/56/58/66/67/71/74の一部やv0.3共通機能に、実装不足の疑いと単なる受入証拠不足が混在する。AC-67には設定/辞書UIの検索・フィルタ・編集コンポーネント実装が確認済み | Drive要件ID・現行画面/API/テストを1対1照合。欠陥があれば独立Work化。UI6静的観測/実DOM部分証拠を規範依存表・全DOMの合格扱いにしない |
| **R3 年代表現** | `C=R+E` と全区分時系列・公開スナップショット相対年投影は実装/探索的テスト済み（PR #79） | 実機年表・旧版対照・符号解釈を評価し、Confirmed仕様と正式CAT Gateを分ける |
| **R4 CAT-TDD正式検証** | 多数の `docs/cat/` ArtifactはDraft。CIのNode/PG/Chromium成功はClosure/Model/Conformance/Red-Greenではない | Work単位で正規スクリプト・入力版/ハッシュ・状態の証拠を収集。承認根拠のないDraftはConfirmedへ昇格しない |
| **R5 実認証・実機操作** | [MAN-01〜15](docs/alpha-manual-acceptance.md) にDiscord本人・非本人、IME、長文、通信断、競合、公開/非公開と端末操作がある | テスト用DB・秘密情報保護・対象develop SHAと実操作/結果を記録。自動テストの模擬主体では代替しない |
| **R6 画面・視覚受入** | 旧v0.3色/role tokenの静的対照とスクリーンショット自動取得は部分証拠。利用者による旧画面と現行の見比べは未実施 | 公開4領域/作者/管理画面、320〜1280pxと実端末を対照。作者の長文編集キャンバスは旧配色の機械的強制を避け、採用済みUXと照合 |
| **R7 最終受入** | `develop`統合≠ユーザー受入≠公開 | 未確認の条件を判定した後、明示承認された範囲だけ `main` に統合 |

## 作業を選ぶ手順

1. [AC台帳](docs/alpha-ac-traceability.md) と [現在のIssue](https://github.com/surumeneco/Eternalia_Novel/issues)、[PR](https://github.com/surumeneco/Eternalia_Novel/pulls)、[Actions](https://github.com/surumeneco/Eternalia_Novel/actions) を、**その時点の `develop` HEAD** と照合する。
2. 仕様欠落、実装不具合、試験欠落、CAT Gate、実機待ち、単なる記録ずれに分類する。疑いだけで欠陥確定/仕様変更へ昇格しない。
3. 採用済み仕様に沿う独立Workを作り、必要なCAT工程とテストを実行し、変更差分・CI・ブランチを検証して `develop` へ統合する。証拠の追加は具体的な未被覆条件の解消を根拠にする。
4. 実機でしか確認できない条件は [MAN台帳](docs/alpha-manual-acceptance.md) に保持し、推測でpassにしない。

**履歴**：旧PR/CI/時点別の判断と実装の長文経緯は [凍結した初期引継ぎ](docs/history/alpha-handoff-through-2026-11-15.md) に保存する。この文書へ時点別追補や過去ログを積層しない。
