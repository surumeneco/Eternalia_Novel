# Eternalia_Novel α版 — 現行入口と開発履歴

## 現行の引継ぎ境界（2026-11-15照合）

- **受入確認対象は `develop`**。照合したHEAD: `a810fb84155211f3ff2f501e4ece72629c0f3239`（PR #112まで統合）。未統合PRの有無は作業のたびに再取得する。`main`は`7d23cbf43b37bcafef29abacdb6802657ae16cdc`で未リリース。次回作業開始時には必ず最新のHEAD/PR/CIを再取得し、この固定SHAを恒久的な最新状態とみなさない。
- 実装済みの後続単位: 章ページ配列（PR #38）、同綴単語の編集引継ぎ（#40）、章自動保存/復旧（#43/#44）、Tipカテゴリ間の下書き移動と公開稿所属維持（#46）、非公開済対象の論理削除（#47）、整数年・年代区分相対年保存（#48）、固定UI ja/enと作者エラー（#50/#51/#53）、公開時刻のJST入力/UTC比較と4領域の予約遮断（#55/#56）、公開検索の非漏洩（#61）、読者画面のJST日時表示（#62）、SSR HTMLのHTTP no-store（#63）、関連TipのHTTP秘匿（#64）、APIのサーバー発行RequestIdヘッダー（#65）、水和前言語切替ボタンの無効化（#66）、公開APIのミリ秒等号境界テスト（#67）、共通Shellのキーボード本文移動・水和前モバイルメニュー保護（#69）、JavaScript無効でも章の全ページを読めるSSRと水和後ページ切替（#70）、Vue SFCの静的依存グラフ・循環検出と未承認UI6分類の境界を分離した探索的台帳（#72）、Vue検査器の偽依存排除・kebab-case検出（#74）、設定タグ・辞書意味の下書き/公開版隔離と祖先予約遮断の匿名Chromium検証（#75）、年代区分間の共通年換算・統合読者年表と公開スナップショットのRelativeYears投影（#79）、15件のVue部品の試用UI6主責務割当と陳腐化監査（#81）、公開4領域一覧の実DOM意味構造・非JS SSR/画面幅検証（#82）、作者の章長文編集面の行長/行間/編集高の試行改善と320/390/1280pxの回帰試験（#83）、匿名公開検索の非表示・復帰時キャッシュ無効化/再取得と合成ブラウザライフサイクル受入検査（#85）、公開Tip詳細・章本文・祖先パンくず/章導線の復帰時公開再検証（#87）、シリーズ公開目次（#90）、ホーム・公開4領域一覧（#92）、4領域のシリーズ別公開画面（#94）の復帰時再検証、公開検索での既存共通ガード再利用（#95）、匿名検索のシリーズ間タグ・辞書意味・祖先予約化の負例受入検証（#97）、公開シリーズ・Tip詳細・章のDOMとJS無効SSR検証（#98）、作者公開管理・並べ替えの固定種別ラベル即時ja/en追随と公開管理の768px幅溢れ修正・作者DOM/匿名認可受入検証（#100）、作者メモ保存409のja/enローカライズ・入力保持とメモ/章/Tip作者画面のDOM・匿名保護実測（#102）、UI6の静的import/テンプレートタグ出所別観測とslot/動的箇所の未解決証拠・互換回帰16/16（#104）、既定slotの匿名SSR/作者水和DOM直接子検証6/6（#106）、17ルート＋layout＋app起点からの直接部品参照/相対Vue importパス解決と観測Node19/19（#107）、匿名公開検索の系列×ドメイン×検索語×3並べ替えと親予約遮断のChromium実測1/1（#109）。
- 最新機能PR #69の[Push CI #43574545954](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43574545954)と[PR CI #43574549887](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43574549887)、PR #70の[Push CI #43575432493](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43575432493)と[PR CI #43575436650](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43575436650)は各4/4成功。PR #69マージ後`develop@ba72948`の[CI #43574863885](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43574863885)も4/4成功。PR #70マージ後`develop@e11a57f`の[CI #43575774254](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43575774254)も4/4ジョブ成功を確認。新JUnitはShell本文移動と章のJS無効SSR/水和後ページ切替を各1件/失敗0で通過。PR #74の[Push #43582538869](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43582538869)と[PR #43582585768](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43582585768)、PR #75の[Push #43583739844](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43583739844)と[PR #43583744164](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43583744164)はすべて4/4ジョブ成功。#74の依存検査6/6、#75の公開検索メタデータChromium JUnit 1/1を確認。#74マージ後`develop@8b1dc7e`の[CI #43582924119](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43582924119)も4/4。#75マージ後`develop@2d66c13`の[CI #43584096435](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43584096435)も全4ジョブ成功を確認。 PR #76は観測/受入台帳の同期、PR #77は静的Vue SFC観測で同名の別ディレクトリimportをローカル偽依存と数える不具合の修正。#77修正前のRedは[CI #43590031859](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43590031859)で当該UI-DEP-OBS-07のみ失敗（6/7）、修正後のPR CI [#43590343924](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43590343924)は7/7かつ全4ジョブ成功。マージ後`develop@84f1785`のCI [#43590718136](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43590718136)は同一HEAD・全4ジョブ成功を確認。PR #79のC=R+E実装と公開投影修正は[Push CI #43593203321](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43593203321)・[PR CI #43593274180](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43593274180)とも全4ジョブ成功を実測し、`develop@52ed3e5`に統合（統合後の[CI #43593596304](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43593596304)は4/4成功）。PR #81の部品15件の役割試用監査5/5、既存7件と合わせて12/12は[Push #43602366741](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43602366741)・[PR #43602418960](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43602418960)とも4/4成功、マージ後`develop@879022ea`の[CI #43602799860](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43602799860)も4/4。PR #82の公開コレクションDOM/JS無効SSR試験はChromium JUnit2/2、[PR CI #43603298457](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43603298457)とマージ後`develop@5e514e1`の[CI #43603704196](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43603704196)はいずれも4/4成功。PR #83は原文textareaに専用執筆CSSがないことを[Red CI #43603909357](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43603909357)で5/6失敗として実証し、章専用class・最大72ch・行間1.95・高さclamp・明朝通常ウェイトで修正。[Push #43604242733](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43604242733)・[PR #43604245303](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43604245303)は各4/4、Chromium Mobile JUnit6/6成功。マージ後`develop@bfa7a01`の[統合CI #43604747020](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43604747020)は全4/4成功。#84でAC台帳を同期し、[統合CI #43605190821](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43605190821)も全4/4成功。PR #85は公開検索で過去の公開結果を無期限に保持する問題を検証するため[Red #43608775136](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43608775136)を実施。ヘッドレスChromiumのタブ可視状態を合成発火するようテストを是正し、[Push CI #43609540403](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43609540403)・[PR CI #43609545079](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43609545079)とも同一HEAD 4/4成功、browser-public-search-resume JUnit2/2。`develop@75101cca`へのマージを確認、統合HEAD自身のCIは別途照合する。
- **最新統合の追加証拠（2026-11-15）**: PR [#110](https://github.com/surumeneco/Eternalia_Novel/pull/110) は検索の証拠整理、[#111](https://github.com/surumeneco/Eternalia_Novel/pull/111) は187ノード公開ツリーの完全性・秘匿、[#112](https://github.com/surumeneco/Eternalia_Novel/pull/112) は意味別語源の参照ID・公開版境界に関する探索的試験。#111/#112は本番ソースを変更していない。`develop@a810fb84`のCI 4/4 成功を確認し、CAT正式Gate・実機受入は依然未実施。
- [AC-01〜78台帳](docs/alpha-ac-traceability.md)は**not-run 76件、pending-decision 0件、scope-excluded 2件**。not-runは「未実装76件」ではなく、部分的な自動試験の証拠があっても**人間受入または正式Gateを完了していない**という意味。[MAN-01〜15](docs/alpha-manual-acceptance.md)はすべてnot-run。
- CATの正規CLI/固定ソースの取得は可能であり、各WorkのDraft・Work契約/構文検査と規範Process Closure / Model Conformance / Implementation Conformanceの**合格は別**。Confirmedに昇格するには根拠となる意思決定が必要。ローカルテスト、GitHub CI、合成作者セッション、実Discord OAuth、実機IMEを混同しない。
- 機能決定の正本はDrive `forGPT/Creating/Projects/Websites/Eternalia_Novel/10_要件定義/100_機能仕様.md`、検証条件は同`40_開発・検証/400_受入検証計画.md`、実装状態は現在のコード/CI。v0.3原則継承、独立Disabledなし、ゴミ箱復元UIなし、作者作成本文は翻訳しない。**年代区分間換算式は旧v0.3を踏まえたC=R+Eという調整可能な実装解釈を採用済み（正式CAT Confirmedではない）。作者画面の最終視覚判定は実機受入未実施。v0.3意匠と既採用の長文編集UX方針から実装・改善を自走できる**。

## α版 残Workと依存関係（実施対象を混同しない）

### 残Workの性質別判定と収束条件（2026-11-15、develop @ a810fb84）

**基準値**: PR #112までdevelopに統合、open PR 0件、main未リリース。最新同一HEADの [Alpha checks #43701010433](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43701010433) は4ジョブ成功。AC-01〜78の記録は **not-run 76 / scope-excluded 2 / pass 0**、MAN-01〜15は全件not-run。これらの数を実装未完了数や実装率に変換しない。次の表は既存R0〜R7を**原因・検証境界で横断分類**するものであり、下のWork表の代替仕様ではない。

| 性質 | 該当する残件・確認済み範囲 | 進め方と終了判定 |
| --- | --- | --- |
| **実装不足（確認前）** | AC-05/55/56/58/66/67/71/74、旧v0.3共通機能、UI6動的合成等に差分候補。現段階で全件の未実装を実コードで確定したわけではない。Issue #1のOpenだけでは実装不足を証明しない | 現行ソース・画面/APIと採用済み要求を1対1照合。再現可能な欠落・誤動作だけを独立Workにし、テスト・修正・同一HEAD検証後に閉じる。既存実装なら不足の種類を「検証」へ移す |
| **自動検証不足** | R1/R2の公開・参照・検索・管理の未網羅経路。PR #111で187ノード合成ライブラリの公開ID完全性/祖先秘匿、PR #112で同品詞別意味の語源ID・下書き/非公開祖先隔離を探索的に検証 | 未確認の受入条件を先に列挙し、既存試験が代替する場合は重複テストを増やさず証拠を接続する。追加試験は具体的な未被覆の条件・不具合・回帰を対象にする。**187ノード成功は本番負荷SLAの証明ではない** |
| **CAT-TDD正式Gate待ち** | R4。複数のWorkとDomainSpecはDraft、現行のNode/PostgreSQL/Chromium/CI成功は正式Process Closure・Model/Implementation Conformanceの代替ではない | 意思決定根拠のある規範Artifactだけを適正に確定し、正規CLIの入力版・実行証拠をWorkへ接続。未承認DraftをAIだけでConfirmedにしない |
| **実機・実サービス受入待ち** | R5/R6。MAN-01〜15全件未実行。実Discord本人/非本人、Windows/Android日本語IME、実タブ/BFCache、通信断、旧v0.3視覚対比 | 同一develop HEAD・実操作・環境・結果を記録。シミュレーションのCI成功を実機passに昇格させない。MAN-14の年表C=R+Eは暫定実装として操作・表示を確認し、最終仕様承認と分離 |
| **証拠・記録整理のみ** | R0。PR #110は複合検索の証拠整理、#111/#112は本番ソースを変更しない探索的テスト追加。Issue #5/#39/#41は実装済み部分を含むOpen状態 | GitHub HEAD・PR・CIとAC行を同期し、Issueには「実装・探索的検証済み／正式Gate・実機受入残」を分記。証拠の再掲だけのPRを新たな機能進捗と数えない |
| **最終統合・リリース** | R7。developは受入対象、mainは初期コミット | 上記の必須条件とユーザー受入を照合し、明示的なリリース指示がある範囲のみmainへ統合。develop統合とmain公開を同一視しない |

**収束性の評価単位**: 「PR数」「テスト総数」「not-runの総数」ではなく、各採用要求について **(a) 現行コードの挙動が確認されたか、(b) 必要な自動証拠が揃ったか、(c) 正式Gateがあるか、(d) 実機受入が済んだか**を分離し、未被覆の条件が減るかで判定する。新しい探索的テストやドキュメント更新の効果は、どの未被覆条件を実際に解消したかに紐づける。確認済み欠陥の修正と必要な新規実装を優先し、既存試験と同じ事実を示すだけの追加作業を既定化しない。

この表は**現状に対する作業順序と受入条件**の実行入口である。仕様正本ではなく、要件・承認状態やACの正式判定は各正本を優先する。独立Workは小さいPRに分け、CIと差分を検証して随時`develop`へ統合し、`main`は利用者の受入・リリース指示まで変更しない。

| 順位/Work | 現状・対象 | 次の実作業と完了条件 | 対応する証拠・依存 |
| --- | --- | --- | --- |
| **R0 現状と受入台帳の同期** | PR #61〜112のAPI/HTTP/Chromium・Domain探索的証拠を該当AC行へ統合。#69/#70の読者UIはAC-03/59/63/65/78、#74のUI依存検査6/6と#77の同名別ディレクトリimport誤検出是正7/7はAC-73、#75の設定タグ・単語意味の公開検索/下書き/祖先の秘匿はAC-31/41/70、#81のUI6候補分類15件・試用依存監査5/5と#82の公開4領域DOM/JS無効SSR 2/2はAC-63/65/73、#83の章本文の長文用文字組み・レスポンシブ検証6/6はAC-65/78、#85の公開検索復帰時再検証JUnit2/2、#87の詳細/章本文復帰時再検証JUnit3/3、#90のシリーズ目次復帰時検証JUnit1/1、#92のホーム・公開4領域一覧復帰時検証JUnit2/2、#94の4領域シリーズ別画面復帰時検証JUnit2/2、#95の検索共有Guardへの無挙動変更回帰JUnit2/2はAC-70に反映。**PR #97でシリーズ間の同一タグ/意味・予約祖先の匿名検索分離をChromium JUnit1/1で検証し、AC-25/70へ追加**。**PR #98で公開シリーズ・Tip詳細・章のDOM、320〜1280px、JS無効SSRを既存UI6 JUnit4/4で検証し、AC-63/65/73へ追加**。**PR #100で作者管理の固定種別即時ja/en、匿名認可、幅320〜1280px DOMのRed 1/3→Green 3/3をAC-59/63/65/73に追加**。**PR #102のメモ競合エラーRed 2/3→Green 3/3と作者メモ/章/Tip編集DOM・匿名管理API401をAC-58/59/63/65/73に統合**。**PR #104でUI6の出所別依存・slot/動的箇所の部分観測16/16をAC-73に同期**。**PR #106の既定slot実DOM 6/6とPR #107のページ/レイアウト静的合成観測19/19をAC-73へ追加**。**PR #109で匿名検索の複合条件・3種ソート・祖先未来予約後の領域分離をAC-25/31/70へ追加**。#39/#41は実装有無ではなく正式CAT Gate・人間受入の残件として管理 | 全78件の合格判定は未承認のまま維持。AC-10/42はC=R+Eの試行実装によりユーザー決定待ちではなく実機受入・正式CAT Gateの`not-run`へ移す。新CIの同一HEADとJUnitを今後の受入時に再照合し、正式Gate・実機未実行をpassにしない | [AC台帳](docs/alpha-ac-traceability.md)、[Actions](https://github.com/surumeneco/Eternalia_Novel/actions) |
| **R1 公開境界と横断経路の自動試験不足を埋める** | PR #55/#56のJST/UTCと4領域予約公開、#61匿名検索、#63 SSR no-store、#64関連Tip公開投影、#67実HTTP T-1ms/等号/T+1ms、#75タグ/意味の公開投影を実証。#85で検索の非表示/復帰時再取得JUnit2/2、#87でTip詳細・章本文/祖先パンくず・前後章ナビの失効JUnit3/3、#90で公開シリーズ目次の失効JUnit1/1。**PR #92でホームの公開シリーズ・新着と4領域共通一覧へ同じ復帰時再検証を追加**。祖先未来予約→旧情報遮断、再公開→同一画面復帰、BFCache風503時旧情報非表示を実PostgreSQL＋合成ブラウザライフサイクルのChromium JUnit2/2で実証。[Red #43619053606](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43619053606)0/2→[Push #43619121734](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43619121734)と[PR #43619255387](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43619255387)は各全4ジョブ成功。**PR #94でストーリー・設定集・辞書・年表のシリーズ別公開画面に同じ共通Guardを適用**し、公開情報消去・祖先予約化404/再公開200・BFCache風503を匿名Chromium＋実PostgreSQLでJUnit2/2検証（[統合CI #43620482653](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43620482653) 4/4）。**PR #95で公開検索に残っていた独自ライフサイクル処理を共通Guardへ置換**し、既存の公開検索JUnit2/2を無改変で[Push #43679645606](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43679645606)・[PR #43679772685](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43679772685)（ともに4/4）で回帰確認。**PR #97で公開シリーズA/Bの同一タグ・辞書意味を検索条件として分離し、非公開シリーズCと未来予約されたB言語配下の単語・意味を匿名検索から遮断**。合成作者セッション＋実PostgreSQL/Chromium JUnit1/1、[Push #43681582724](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43681582724)・[PR #43681605052](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43681605052)とも全4ジョブ成功。**PR #109で同一検索語を持つA/B系列の設定タグ・Aの辞書意味をドメイン×ソートを変えながら正確な結果ID/順序で分離し、Aカテゴリの未来予約後は検索/匿名直URL404、A公開単語とB設定は保持**。実PostgreSQL+Chromium JUnit1/1、[Push #43694326895](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43694326895)・[PR #43694376357](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43694376357)各4ジョブ成功。正式CAT refactor-baseline/regression Gate、実OSタブ・実BFCacheは未実行。すべて探索的証拠であり正式CAT Gateではない | **残**: 実OSでのタブ/アプリ切替と実BFCache/CDN、前面維持タブへの即時公開失効配信、大量データでの件数・遅延・メモリ・正確なページ境界、全参照型/公開版世代、実Discord・実機/正式CAT Gate。AC-45/54/55/69/70を自動証拠だけでpassにしない | PR #55/#56/#61/#63/#64/#67/#75/#85/#87/#90/#92/#94/#95/#97/#109、[AC台帳](docs/alpha-ac-traceability.md) |
| **R2 v0.3共通機能・構造継承の残差監査** | AC-66/67/71/73/74等の残差は未実装の断定でなく照合不足。PR #65でX-Request-Id、#62/#66で日時と水和前UIを改善。PR #72/#74/#77でSFCの静的依存・偽依存除外・循環7/7を観測。**PR #81で全15件のSFCをソースから読み、room1/furniture10/equipment2/structure1/decor1/partition0の主責務候補と試用監査5件を追加**（[CI #43602418960](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43602418960)4/4）。**PR #82で公開4領域のコレクションDOM親子・パンくず/石板面・JS無効SSR・幅320〜1280pxをChromium JUnit2/2で実測**（[CI #43603298457](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43603298457)4/4）。**PR #98で公開シリーズ・Tip詳細・章本文のShell→TopicPath→ReaderPanel合成、本文/章導線、320/390/768/1280px横溢れ、JavaScript無効SSR全章ページを追加観測**。既存公開一覧2件＋新詳細2件のChromium JUnit4/4を[Push #43682024526](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682024526)と[PR #43682027116](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682027116)（各4ジョブ成功）で実証。**PR #100で作者の公開管理/並べ替え画面を匿名/認証ChromiumでDOM観測し、種別表示が言語切替に追随しない欠陥と公開管理768pxの横溢れを修正**。[Red #43685857862](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43685857862)追加JUnit1/3 → [Push #43686117276](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686117276)・[PR #43686153150](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686153150)追加JUnit3/3、両CI4ジョブ成功。**PR #102で作者メモの409競合が英語UIでも日本語API文言のまま表示される欠陥を共通ローカライズへ修正し、メモ・章・Tip編集のShell/パンくず/石板面/参照パネル、幅320/390/768/1280pxと匿名メモAPI401をChromiumで実測**。[Red #43687834836](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43687834836) JUnit2/3 → [Push #43688099772](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43688099772)・[PR #43688141203](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43688141203) JUnit3/3、各CI4ジョブ成功。**PR #104で静的importとテンプレートの出所を別々に観測し、slot受け口/供給構文と動的`:is`箇所を未解決証拠へ分離**。ローカル・CIのNode 16/16、[Push #43690305998](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43690305998)・[PR #43690365633](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43690365633)各4ジョブ成功。旧15 SFC依存グラフ・循環は不変。**PR #106で匿名SSRホーム/ストーリー一覧と作者メモ・Tip編集の既定slot直接子をChromium JUnit6/6で確認**（[PR #43692531155](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43692531155)4/4）。**PR #107で現行17ページ＋layout＋appの部品参照・Nuxtルート口・相対Vue importパスを観測**（Node19/19、[Push #43693273219](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43693273219)・[PR #43693377359](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43693377359)各4/4）。これらは試行分類・部分観測であり規範UI6許可依存表や全DOMの合格ではない | 引き続き旧FE/BEのマスタ/検索/導線・DTO・内部例外秘匿/言語独立性を正本に照合。UI6は複合責務（RichContent等）と既知の逆参照疑義を検討し、既定slotの部分DOM実測とルート別静的参照を基に、**未解決の名前付きslot投影・Nuxt動的ルートの実解決・許可依存候補**を別々に試用検証する。未観測の詳細・作者その他管理操作DOM、正式CAT Gate・実機受入を別Workとして埋める。AC-58/66/67/71/73/74は自動証拠だけで完了にしない | [試用UI6台帳](docs/ui-component-dependency-inventory.md)、[AC台帳](docs/alpha-ac-traceability.md)、Issue #1 |
| **R3 年代区分間の換算・統合時系列** | TL-03/TL-06、AC-10/42/68。年0/負年/安全整数・区分別表示はPR #48まで、**旧v0.3から合理的に推定した共通年C=R+E、全区分統合表示、公開版RelativeYears投影はPR #79で実装し`develop`へ統合**。これはv0.3原典に未記載の符号を採用した暫定実装判断であり正式CAT Confirmedではない | 年代区分・出来事の公開稿と欠損・安全整数の扱いを維持し、2026-11-14の[PR #79 CI](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43593274180) 4/4の証拠で実装残件を閉じる。以後は実機で年表表示・暫定符号の使い勝手と旧v0.3の挙動を評価し、必要に応じて補正。**単なる符号の推測可能性を利用者への先行ブロッカーにしない**。正式CAT Gate・実機受入は残件 | [Issue #5](https://github.com/surumeneco/Eternalia_Novel/issues/5)、PR #79、AC-10/42/68 |
| **R4 CAT-TDD正式検証** | 多数のDomainSpec/WorkはDraft、既存のCIは探索的検証。正式なClosure/Model/Queue/Conformanceの全件成功証拠は未確認 | 各機能の規範Artifactと決定根拠を照合、承認が必要なDraftは保持し、正規CATスクリプトで可能なGateを実行し入力ハッシュ/結果をWorkに保持。未承認は`blocked`/未実行を明記して誤昇格しない。今後の新規実装はWorkごとに並行して実施 | `Lifecycle/Works/`、`docs/cat/`、CAT各正規CLI |
| **R5 実Discord認証・実端末での操作受入** | Discord API模擬・合成セッション・Chromiumと、実Discord/Windows/Android IME操作は独立。MAN-01〜09/11〜15は未実施 | 実作者/非作者アカウントでOAuth・ログアウト/403を検証。長文・ルビ/ページ編集・日本語IME変換中・2タブ競合・通信断復旧・カテゴリ移動・論理削除・ja/en切替を実機で記録。秘密値をIssue/ログへ残さない | [MAN台帳](docs/alpha-manual-acceptance.md)、AC-18/19/65/72/75 |
| **R6 v0.3視覚設計の対照・利用性受入** | 旧SCSSトークンと実CSSの静的照合/スクリーンショット取得は自動化済み。PR #69のShell/本文移動・フォーカスを実測。**PR #83で作者用の章本文textareaだけを長文向けの最大72ch・明朝通常ウェイト・行間1.95・最低高さclamp/適応余白で試行改善**。修正前専用class欠落の[Red #43603909357](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43603909357)5/6→修正後の[PR CI #43604245303](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43604245303)4/4・Chromium6/6。**実OSのIME・旧FEとの同一内容画像対比・作者編集キャンバスの人間受入は未実施** | 旧v0.3の青・黒・緑/石板パネルと現行220の作者執筆UXを維持し、公開ホーム/4領域/作者/管理画面の320/390/768/1280px比較と必要な修正を**自主的に続ける**。長文・IME・スクリーンリーダー・可読性の実端末評価、実画像比較と差分理由の記録を別試験で埋める。試行CSS値は確定デザイン承認に昇格しない。実機指摘があれば補正する | AC-60〜65/78、[旧UI原典](docs/legacy-ui-asset-map.md)、MAN-10 |
| **R7 最終受入とリリース判定** | 実装統合は受入ではなく、`main`未リリース | 主要必須ACの規範/自動/人間受入を区別して結果を記録し、全残件を判定。利用者が`develop`の対象機能にOKを出しリリースを指示した場合に限って承認範囲を`main`へ統合 | AC台帳、MAN台帳、develop CI |

**直近の着手順**: R0 → R1とR2を独立PRで進める。R3は旧v0.3の基準年要件から実装解釈を自律採用して`develop`へ統合済み。正式CAT承認と実機受入は別工程として継続し、実機で不一致が分かった場合は補正する。R4は各Workと併走して正式証拠を増やし、R5は実アカウント・実端末受入を行い、R6はv0.3と既採用UXを根拠に先行実装して実機評価で補正する。Issue #39/#41は機能再実装待ちとして扱わず、残る正式Gate・実機受入を追跡する。

## 過去の引継ぎログ（2026-10-29〜31、各節は**当時**の観測・未実施・停止判断）

> 以下の「Draft/open」「develop未統合」「CAT実行環境がない」「実ブラウザ未検証」等は**履歴であり現行の実行制約ではない**。その後に実装・検証・統合されている項目について、旧記述を実装が無い証拠や作業停止理由として用いない。
> 当時のコード基準は `734e15ece6c5d16c372d256f220fe26f339bdcb3`。最新コード・CI・設計正本を優先して照合する。

## 2026-10-29時点の正本・開発境界（履歴）

- Repository: `surumeneco/Eternalia_Novel`
- 当時のBranch: `feature/alpha-reimplementation-20261029`; 当時のPR [#3](https://github.com/surumeneco/Eternalia_Novel/pull/3) → `develop` はDraft/open・未マージだった（現在はマージ済み）。
- 当時の保留方針は現在には適用しない。現在は `develop` に検証済み実装単位を随時統合し、`main` のみ受入後のリリース指示を待つ。
- 採用済み要件・設計・受入条件の正本はGoogle Driveの `forGPT/Creating/Projects/Websites/Eternalia_Novel/` 内、特に `100_機能仕様.md`、`200_情報構造・画面設計.md`、`220_ビジュアルデザイン・画面コンポーネント継承設計.md`、`300_データモデル.md`、`310_API・セキュリティ.md`、`400_受入検証計画.md`。段階計画は `430_α版段階的実装計画・引継ぎ_20261029.md`。
- 当時のCAT実行環境では正規CLIを取得できなかったが、現在は上記の固定配布物をChat Pythonで検証・実行できる。正式CAT Gateの合否は**各Workの実証拠**で独立に判断する。GitHub CIの成功はCAT Gate合格ではない。

## 2026-10-29時点の実装済み観測（後続CIによる検証は上の現行入口を参照）

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

## 2026-10-29時点のCI証拠（履歴）

- `734e15ec` の Push [40864473111](https://github.com/surumeneco/Eternalia_Novel/actions/runs/40864473111) と PR [40864482955](https://github.com/surumeneco/Eternalia_Novel/actions/runs/40864482955) は `completed/success` を取得。
- `npm run test:alpha`: ドメイン・公開境界・辞書意味/語源・言語の文字関係・年代区分内ソート等の探索的単体試験。
- `npm run build`、Nuxt typecheck、`npm run db:migrate`、`npm run test:db`：CIで成功。PostgreSQLで下書き/公開版、競合、語源公開参照と作者メモの保存を検証。
- **未実施**: 実Discordログインの本人/他人検証、ブラウザE2E、旧FEとの画像比較、デスクトップ/タブレット/スマートフォンの操作、長文/IME、CAT規範Gate、デプロイと実機受入。

## 2026-10-29時点で挙げた残Work（現在の未完了一覧ではない）

1. **公開設定の縦断E2E**: 全4領域の作成→保存→再読込→公開→匿名アクセス→非公開、時刻境界と関連経路、作者以外による拒否。実DB/ブラウザ/Discordの外部証拠が必要。
2. **設定のタグ・設定間関連**: 参照先の実効公開に従った投影、作者編集、カテゴリ横断検索。前セッションの該当書込は安全性チェックで拒否。拒否された変更は未反映として扱い、回避はしない。
3. **年表の年代間換算**: 相対年と基準年の換算式・入力精度が未確定。区分をまたぐ勝手な換算は行わない。
4. **領域共通の順序変更・表示**: 編/部/章・TipSection・辞書・年代など。下書き/公開稿と順序変更の反映境界を設計してから実装。
5. **削除・無効化**: 非公開・無効化・削除の契約、参照/子孫/公開稿/復旧の作用が未決。旧ゴミ箱UIは明示保留だが、削除と無効化全体は継承対象。
6. **多言語固定UI/エラー文言、スケルトン表示、UIの端末幅別実機検証**、仕様IDとAC-01〜AC-78への証跡対応。ドメイン編集時のテキスト操作も要検証。
7. **CAT-TDD正規実行環境**: 対象checkoutと検証済みCAT runtimeを取得したうえでdoctor→stage routing/guardsと正規証拠を実行する。

**判定**: 現時点でCIは成功しているが、α版の全受入条件は未達。`develop` へのマージ、`main` への反映、α完成宣言は行わない。 

## 2026-10-29 追加: A7 HTTP/SSR受入検証の実行器

- 2026-10-29作業開始コミット `ce13d536`。新規 `scripts/seed-http-acceptance.mjs` は実PostgreSQLとドメイン関数で公開/下書き/祖先非公開/予約公開/未公開のフィクスチャを挿入し、検証対象IDを一時マニフェストに出力する。
- `apps/api/http-acceptance/http-acceptance.test.mjs` は実Nuxtプロキシ/Nest API、SSRページ、直接URL、公開版と下書き分離、匿名の管理API拒否を検査する。**ブラウザ操作やDiscord実アカウント試験の代替ではない**。
- `scripts/check-http-acceptance.mjs` を作成。Node 22+、既存の `npm ci`・`npm run build`・`npm run db:migrate` 完了、`DATABASE_URL` に破棄可能なテストDBを指定した状態で `node --env-file-if-exists=.env scripts/check-http-acceptance.mjs` を実行する。**ランナーはDBへ実際にテストデータを作成する。実運用DBには実行禁止**。
- 旧位置 `apps/api/tests/http-acceptance.test.mjs` と新位置の重複を確認。旧ファイル削除は安全性チェックで拒否されたため**未整理**。代わりに `test:db` はDB単体/統合の明示列挙、`test:http` は起動済みサービス向けの別コマンドとした。削除拒否の回避は行っていない。
- `.github/workflows/alpha-checks.yml` へのHTTPジョブ追加も安全性チェックで拒否され、**CIには未接続**。このHTTP受入試験を実行済み・passedと表示しない。既存のBuild/DB CIの結果とは別管理とする。
- 作者編集 `apps/web/app/pages/studio.vue` の公開操作後の再読込で未保存入力が失われ得る問題を確認したが、修正書き込みが拒否された。**未修正**。
- CAT正規doctor/Guard/Model/Queue/Red/Greenは未実施。Draft PR #3を維持し、受入未達のためmergeしない。

## 2026-10-29 追加: 公開順序・作者参照・読者遷移・辞書診断

実装Workと変更範囲（本段落追加前のソースHEAD: `9fbbfcd2`。正式CAT-TDD Queueではない）:

- **WR-03 / ST表示順 / A2・A6**: `packages/contracts/src/reorder.ts`、`apps/api/src/author-order.controller.ts`、`apps/web/app/pages/studio/order.vue`。同親・同種の全兄弟IDで順序を指定。楽観的競合チェック、許可作者のみ、明示操作で公開一覧順を変更。ドメイン探索テストと実PostgreSQLテストを追加。公開順序変更が独立した公開操作になる仕様詳細は別途正本への確定が必要。
- **LG-08**: `packages/contracts/src/spelling-diagnostics.ts`。同一言語の完全一致綴りと、文字・語頭・後続・語末の音韻経路に一致しない登録候補を作者編集で警告。拒否／警告の契約未決につき非破壊の診断のみ。探索的テスト追加。
- **WR-04 / ST-06**: `apps/web/app/components/AuthorReferencePanel.vue` を章・設定の作者編集に接続。同一シリーズの設定・単語・文法の作者下書き参照を、認可済み管理画面内に限定。
- **CM-01・PB-03 / 読者ナビゲーション**: `packages/contracts/src/public-path.ts` と `apps/api/src/public-path.controller.ts` で全祖先の公開判定とスナップショットに従う公開パンくず取得を追加。URL直接アクセスの章からシリーズを特定し、目次/前後章へ戻れるようNuxt修正。汎用シリーズ/項目詳細の導線とパンくずも改善。私的・予約公開祖先の負例テスト追加。
- **CM-05**: `apps/web/app/components/ReadingSkeleton.vue` とホーム・ストーリー・設定・辞書・年表・詳細・章・共通公開一覧へスケルトン読込表示を適用。reduced motion配慮。
- 実CIにて追加テストの構文エラーを発見、`c8bc846b`で修正済み。以降のPush/PR結果は**最終HEAD**のrunで再取得すること。

未実施/決定要の残Work: **設定タグ・順序付き設定関連の公開投影**（先行のコード書込が安全性チェックで拒否）、**年代区分をまたぐ換算式**、**独立した無効化/非公開済み削除と復旧契約**、固定UI/エラーの多言語化、長文/IME/ルビのブラウザ検証、本人/他人のDiscord実ログイン、画面横断のブラウザE2E、実HTTP検証スクリプトの実行、正規CAT Gate。既知の未保存入力が公開操作後の再読込で失われ得る問題は依然未修正。

**α受入判定**: 上記未完了が残るため未成立。CI greenはCAT Gate/実ブラウザ/実機/デプロイ/公開リリースを意味しない。PR #3はDraftのままとし、`develop`/`main`にはマージしない。


## 2026-10-30 追加: 固定UI文言と本文記法ヘルパー（CAT正規Gate未実施）

- 引継ぎ時HEADは `450fcf2b`。継続したfeatureブランチで作業し、PR #3はDraft、develop/mainへの統合なし。
- 固定UI辞書 `apps/web/app/composables/useUiLocale.ts`（前回追加）を公開シリーズ・章・設定・辞書・年表のナビゲーションおよび詳細パンくずへ接続。辞書は日本語だけを提供し、追加言語は確定/翻訳後の拡張対象。作者の作品本文は翻訳しない。
- `apps/web/app/utils/manuscript-markup.ts` と `apps/web/tests/manuscript-markup.test.mjs`：現行の本文ルビ記法 `｜漢字《かんじ》` / `[[page]]` の選択範囲挿入をUTF-16オフセットで扱う純粋関数。Nodeテストは `npm run test:alpha` 内で実行。ただし**作者UIには未接続**。
- 新規 `ManuscriptEditor.vue` にNuxt型エラー（`HTMLTextAreaElement.isComposing`）があり、型チェック失敗を観測。修正書込みが拒否されたため、問題の未接続コンポーネントだけをコミット `164f0f0b` で削除し、GitHub CIをGreenに復旧。ヘルパーとテストは維持。
- `PublicCollectionPage.vue` の共通ラベル更新、既存の `studio.vue` 公開操作後の未保存入力保護、設定タグ/関連や年代換算、無効化/削除等は**未実装**。拒否された編集を別の場所へ迂回して同等実装を追加していない。
- 実HTTP実行、Discord本人/他人認証、ブラウザE2E、デバイスでの長文・IME・Undo・ルビ検証、CAT-TDD正規doctor/Guard/Queue/Red/Greenは**未実施**。既存CIの型チェック・単体/DB成功をCATやα受入合格へ読み替えない。
- この段落追加前の最終コードSHA: `0cc5fae22799c8c0730f7abb607d383d330c1251`。Push/PR Actionsを**本段落を含む最終HEAD**で再取得し、結論を確認すること。

## 2026-10-30 継続実装: ST-04/ST-05/ST-09 設定タグ・関連設定

- 仕様根拠: `forGPT/Eternalia_Novel/10_要件定義/100_機能仕様.md` の ST-04（タグ）、ST-05（順序付き設定間関連）、ST-09（タグ・カテゴリ検索）、および `30_詳細設計/300_データモデル.md` の公開参照制約。
- 開始時の feature HEAD は `05da0b20`。変更は `feature/alpha-reimplementation-20261029` へ単位別にコミットし、`develop` / `main` は変更していない。
- 新規 `packages/contracts/src/tip-links.ts`: タグ・関連先IDの上限制約、重複・空値・構造不正検査。既存 `content.details` を使用し、DBスキーマ変更は不要。
- `packages/contracts/src/novel.ts`: 他シリーズ・自身・非Tip・不存在参照を拒否。公開スナップショットの `tags` は公開し、`relatedTipIds` は公開APIに出さず、祖先公開判定と公開稿を満たす参照先だけを `relatedTips` として射影。非公開関連先のID/タイトルを秘匿。
- `apps/web/app/components/TipLinksEditor.vue` と `apps/web/app/pages/studio.vue`: 作者のタグ編集、同シリーズの関連設定選択・並べ替え・解除を下書きフォームへ接続。
- `apps/web/app/components/TipLinksReader.vue` と `apps/web/app/pages/items/[id].vue`: 公開タグと公開済み関連先へのリンクを表示。汎用 details 出力から内部JSONを分離。
- `apps/web/app/pages/tips/[id].vue`: 公開設定をタグで横断検索/絞り込み。非公開設定のタグは一覧に入らない。
- 探索的テスト `packages/contracts/exploratory/tip-links.test.mjs` を実装より前に追加。`5083e52d` の Actions `40993897207` は未実装 export により Red（失敗）。ドメイン実装 `f41239b3` の Actions `40993972057` は Green（成功）。**これはCAT生成Queueの正式Red/Green証拠ではなく、GitHub CIで観測した探索的テスト結果**。
- 最終実装HEAD: `cf4eda352aec68606bbcc2bab64e45e3407ca79c`。Push Actions `40994135327`、PR Actions `40994140433` が双方 `completed/success`。既存単体/DBテスト、Nuxt/Nestビルド、Nuxt型検査が成功。
- CAT規範の doctor/guards/process-closure/model/vectors/Queue/implementation-conformance は正規ランタイム未取得のため未実施。利用者が許可した代替手順に従い探索的Red/Green・CIと静的推論を開発上の進捗として採用するが、正規CAT Gate通過とは称さない。
- **なお未実施**: 実ブラウザでのタグ編集・入力と読者検索、Discord本人/別人、長文IME、全4領域のE2E、年代換算・削除/無効化の未決仕様。PR #3はDraftを維持しα版の正式受入・mergeは保留。前節の「設定タグ・関連は未実装」という記述は本節の実装分に限り更新される。

## 2026-10-31 継続実装: Nuxt CI修復・HTTP/SSR統合受入

- 対象は既存 `feature/alpha-reimplementation-20261029` → Draft PR #3 → `develop`。新しいfeature/PRは作成せず、`develop` / `main` を変更していない。
- 開始時HEAD `13500d4468a36fefbd8f005398fb3c1e14385752` のActions失敗をジョブログまで確認。原因は `apps/web/app/pages/tips/[id].vue` の `computed(...)` 閉じ括弧不足（Nuxt `Unexpected token` / TypeScript `TS1005`）。`ca3e0632960b23feb7d5f604fa0ecdc09a649ef1` で修正。Push/PR双方のCI成功（Push run `41167346631` / PR run `41167350099`）。
- `308630cbdb2ffedd533e79a1a088f955b459ade9` でCI `http-ssr-acceptance` ジョブを新設。Node22、使い捨てPostgreSQL 17、NestJS/Nuxtビルド・DB migration・実HTTP/SSR受入試験をGitHub Actionsで実行。
- `64225704` / `ecb8fbf4` で実Discord APIに接続しない**合成作者セッション／非作者セッション**をテストDBに作成する前提を追加。`71b25929a15d4cdc9af3453c7c447e48c5df7ee4` で管理APIの4領域作成→下書き→公開→匿名取得、下書き/公開稿分離、409改訂競合、誤Originの403、非作者401、祖先非公開/復帰、ログアウト後401のHTTP受入を追加。Push `41167620218` / PR `41167624669` は `completed/success`。
- 誤って通常DBにテストレコードと一時セッションを投入しないため、`a43dfcc0` / `43f98256` で `HTTP_ACCEPTANCE_DISPOSABLE_DB=1` 明示指定と空DB確認を導入。`e3aa12a6` でCIにフラグを追加、`9b3316470e0249508361f8cf0c4176d38abb5f92` で `docs/alpha-nuxt-setup.md` に手順と禁止事項を追加。**このコードHEAD**でPush `41167766207`・PR `41167768149` とも `completed/success`、4ジョブ全成功。最終反映は本段落を加えたHEADで再照合すること。
- **テストの限界**: CIの合成DBセッションはDiscord OAuth2実ログインの本人/他人確認を代替しない。ブラウザE2E、レスポンシブ画像比較、長文IME・ルビ編集操作、各ACの証跡、年代表の年代区分間換算（式未決）、独立した削除/無効化（作用契約未決）、正式CAT-TDD doctor/Guard/Queue/Red・Green/implementation-conformanceは未完了。従来の保留を勝手に仕様決定しない。α正式受入まではDraft PR #3を維持する。

## 2026-10-31 継続: 実ブラウザ受入とNuxtネストルート復旧

- 作業開始時のfeature HEAD `bbc5bd330e53b16ac59d9b8f47eac4bf4c5c3fec` とPR #3（feature → develop、Draft/open）、Push/PR CI成功を再取得した。
- `apps/web/browser-acceptance/browser-acceptance.test.mjs` を新規実装。使い捨てPostgreSQL+ビルド済みNest/Nuxtを実Chromiumで操作。匿名モバイルの目次・章本文ページ送り、全4領域の詳細画面、合成作者セッションでのシリーズ作成→下書き保存→未公開検証→公開、未保存編集の破棄確認、章ルビ挿入・選択範囲、作者のメモ/並べ替え/公開管理サブルートを検証する。日本語IMEの実変換・実Discord OAuth2とは独立。
- `scripts/check-http-acceptance.mjs` に `HTTP_BROWSER_ACCEPTANCE=1` 指定時のみブラウザ試験起動を追加。ブラウザで作者セッションを使い終えた後、HTTP試験がそのセッションのログアウト失効を検証する。テストDBの明示opt-inと空DB確認は維持。
- `.github/workflows/alpha-checks.yml` の既存 `http-ssr-acceptance` にPlaywright 1.56.1/Chromiumインストールを追加。Ubuntu26.04上ではPlaywright 1.56.1が未対応（run `41169643771` の実ログ）であったため、ジョブ単独でUbuntu24.04へ固定。
- Chromiumで `/stories/:id` を開いた際に、専用目次ではなく親コレクションだけが描画される不具合を実測。Nuxtネストルートで親 `stories.vue` に `NuxtPage` がなかったことが原因。同構造の `tips.vue`/`dictionaries.vue`/`timeline.vue` と `studio.vue` も修正。作者親ページは子ルートへ移動する際の `onBeforeRouteUpdate` を追加して未保存編集の破棄確認と保持を検証。
- `apps/api/http-acceptance/http-acceptance.test.mjs` へ4領域の実専用画面マーカーを確認する退行試験を追加し、単にシリーズ名がHTMLに含まれるだけの偽陽性を排除。
- `d5782936cb1c08266eeff3984aedf4d4e6b58a8a`（実装＋試験）でPush `41170398589` / PR `41170403421` がともに completed/success。実Chromiumブラウザ試験1/1、HTTP統合試験6/6、ビルド・型チェック・DB結合試験成功をジョブログから確認。`c8e59069f2c19a17749db98c20bfa6ed13a42376` にローカルブラウザ検証手順を追記。以後の最終HEAD/CIは再照合する。
- 残件：実Discord本人・非本人・ログイン/ログアウト検証、実日本語IME/長文/複数デバイス、旧v0.3 UI画像比較、年表の年代区分間換算（規則未確定）、削除・無効化（状態遷移契約未確定）、AC-01〜78の網羅証跡、CAT規範Runtime/Gate、実環境デプロイ。これらは未達のまま。Draft PR #3を維持し、`develop`/`main` にマージしない。
