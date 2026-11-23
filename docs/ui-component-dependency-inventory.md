# 現行Vueコンポーネント依存の観測台帳（UI6試験導入）

## 対象と権威

- 対象: `apps/web/app/components/*.vue`（既存同一ディレクトリ監査）および `apps/web/app/{app.vue,layouts/**/*.vue,pages/**/*.vue}`（ページ/レイアウト合成の追加観測）。
- この記録は現行コードを起点にした**観測**であり、Drive正本 `010_UI構造契約・CAT-TDD試験導入方針.md` の6分類規則を確定したものではない。
- UI6の`room/furniture/partition/equipment/structure/decor`は**試験導入方針のみ採用**。この文書と`docs/cat/drafts/ui6-role-trial.md`に24件の試用分類を具体化したが、分類の意味的正当性、許可依存表、DOM契約・例外はまだDraftである。AC-73の正式合格やCAT規範Gateを意味しない。
- 閲覧時には必ず最新HEADに対して `node scripts/audit-ui-component-deps.mjs` を実行する。この文書に固定された個数や構成を最新状態として扱わない。

## 現行24部品のソース確認に基づく試用分類

分類対象はVue SFC自身の**主たる責務**であり、コンポーネントのサイズ・DOM深度・名前ではない。複数の入力操作を持つ複合編集UIは、単一のボタン/入力部品（`equipment`）ではなく、現段階では用途を持った合成部品（`furniture`）とみなす。この判断の根拠・例外候補は[CAT Draft](cat/drafts/ui6-role-trial.md)へ集約し、確定仕様ではなく変更可能な試用表として扱う。

| 試用分類 | 対象SFC | 根拠となる現行責務 |
| --- | --- | --- |
| `room` | `PublicCollectionPage`, `ReaderDomainDetail`, `ReaderDomainListing`, `AdminChapterPreview`, `AdminEditBridge`, `AdminMasterIndex`, `AdminMasterCatalog`, `AdminNodeGrid`, `AdminPublicationPage` | 公開一覧と詳細・章プレビュー・作者用種別別管理・編集統合を行う画面領域。`AdminMasterCatalog` は共通Tag/Divの表編集と作成/保存/削除を組み合わせた独立管理領域 |
| `furniture` | `AuthorReferencePanel`, `CategoryPresetEditor`, `LanguageStructureEditor`, `LanguageStructureReader`, `RichContent`, `TipLinksEditor`, `TipLinksReader`, `TopicPath`, `WordMeaningsEditor`, `WordMeaningsReader` | 参考資料検索、複合フォーム、表/読み物、本文ページ、パンくず等の目的別合成部品 |
| `partition` | `AppDialogHost` | 開閉と確認結果・フォーカスを管理するモーダル境界 |
| `equipment` | `AuthorCreateLink`, `AuthorEditLink` | 認証状態に応じた作成/編集ナビゲーションの単一操作 |
| `structure` | `ReaderPanel` | 子コンテンツを受けるstone-panelの構造とslot |
| `decor` | `ReadingSkeleton` | 非操作のロード状況の視覚・テキスト表現 |

`RichContent`は読書表示にページ移動操作を持ち、表示と操作の**複合責務**として分割要否をレビュー対象にする。各分類の確定判定、全画面DOMの構造適合、他ディレクトリの役割被覆とは区別する。

## 観測機械と検証可能範囲

`scripts/audit-ui-component-deps.mjs` は、同一ディレクトリ内で見つかるSFCの名前を列挙し、Vue SFCのtemplate領域で実際に開始タグとして現れるPascalCase/kebab-case表記と、script領域の行頭に現れる、同一ディレクトリの `.vue` への直接的な `./Name.vue` 静的importからグラフを作る。別ディレクトリにある同名SFCへのimportは、この限定観測器では別ノードとして扱わず、同名のローカルSFC依存にも誤算入しない。コメント・script文字列・style・引用符内属性値はテンプレート依存として数えない。節点と依存先は辞書順で固定し、循環経路があれば報告する。依存がないか確認するには `node scripts/audit-ui-component-deps.mjs --assert-acyclic` を使用する。**既存の `components[].dependsOn` はタグ参照・直接importの和集合として保持**し、出所別情報を別の `compositionEvidence[]` に返す。

試験は一意列挙、二段依存、自分自身への依存と複数段の循環検出、現行コンポーネント群の静的循環有無、擬似タグ・コメント由来の偽依存除外、kebab-caseの参照認識、別ディレクトリの同名SFCをローカル依存と取り違えないことを検証する。追加した出所別監査は、`templateTags`（ローカルSFCに一致する開始タグ）、`staticImports`（同一ディレクトリへの行頭静的`.vue` import）、`slotOutlets`（`<slot>`の名前、動的名は`[dynamic]`）、`slotProviders`（`#name` / `v-slot`）、`dynamicComponentSites`（`<component :is>`等のタグ名）を**字句証拠**として分類する。slotの接続先や`:is`の対象を依存辺に推測追加しない。`scripts/audit-ui-component-deps.test.mjs`は既存7件＋新規3件で検証した。

### ページ・レイアウトからの部分的な合成参照観測

`node scripts/audit-ui6-route-composition.mjs` は、現行24コンポーネントの静的グラフとは**独立して** `app.vue`、`layouts/**/*.vue`、`pages/**/*.vue` を読み取り、各ソースで直接表記された既知の共通SFC開始タグ（`localComponents`）、NuxtPage/NuxtLayout/RouterViewの表示境界（`frameworkOutlets`）、slot受口/供給構文、動的`:is`構文を報告する。相対`.vue`の行頭静的importは**basenameではなく起点ファイルからの実パス**で確認し、`resolved`/`missing`/`outside-app`/`unresolved-alias`に分ける。アプリ境界外ファイルは探索しない。個々のソースを毎回再列挙し、現行の構成を固定数として仮定しない。

これらは**静的字句サイトと限定的な相対ファイル存在判定**であり、Nuxtのルート解決結果、条件分岐後の実DOM、`slotProviders`の受け先、コンポーネント自動登録の完全性を証明しない。出力の`compositionObservationStatus: lexical-partial`に対し、`runtimeResolution`、`normativeClassification`、`normativeDependencyRules`、`domContract`は全て`not-run`。観測器は`scripts/audit-ui6-route-composition.test.mjs`で合成ソースの誤認防止・実パス解決・導入時の17ページ検証を、現行72ページ＋1レイアウト＋app起点に改訂した検証を行う。**PR #107で既存16件＋新規3件のNode19/19成功**（[Push #43693273219](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43693273219)・[PR #43693377359](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43693377359)各4ジョブ成功）。既存`components[].dependsOn`の互換グラフは変更しない。

### 試用分類の決定的レポート（規範判定ではない）

`node scripts/audit-ui6-trial.mjs` は、上記のソース由来候補と**現在の静的依存グラフ**を突き合わせ、候補被覆・不正なrole・一覧外に残る登録、role付きfrom→to、確認を要する逆方向の疑いを報告する。`--check-trial-coverage` は**候補表の陳腐化のみ**を失敗として検知し、意味上の役割合格や許可依存の合格は判定しない。新しいSFCを名前だけで勝手に分類しない。出力には`normativeClassification: not-run`、`normativeDependencyRules: not-run`、`domContract: not-run`を明示する。試用レポートも出所別観測を`compositionEvidence`として含め、観測入力がある場合のみ`compositionObservationStatus: lexical-partial`、ない場合は`not-run`と表示する。検査実装の回帰試験は`node --test scripts/audit-ui6-trial.test.mjs`。

**既存の同一ディレクトリ監査器だけでは検査できないこと**: 複数ディレクトリの合成/依存、`:is`等の動的参照先の実解決、複雑なJavaScript/Vue構文の完全解析、型専用import、slotの受け口と供給先の実際の対応・内容のDOM投影、ブラウザ実DOMの親子関係、分類上の責務、許可依存表への意味的適合。**`slotOutlets`/`slotProviders`は同一SFC内の構文観測だけ**で、子孫合成やアクセシビリティの成立証明ではない。これらの不在をもって適合合格とはしない。

一方、**静的観測器とは独立したブラウザ観測**は `apps/web/browser-acceptance/ui6-public-collection-dom.test.mjs` にまとめている。PR #82の公開4領域コレクションに加え、PR #98で公開シリーズ詳細・Tip詳細・章本文の `Shell → TopicPath → ReaderPanel` のDOM順序、匿名時の作者編集リンク非表示、章本文/ナビゲーションの配置、幅320/390/768/1280pxの横溢れ、およびJavaScript無効の公開タイトル・章全ページSSRを観測した。匿名Chromiumと使い捨てPostgreSQLによる既存2件＋追加2件のJUnit4/4（[Push #43682024526](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682024526)、[PR #43682027116](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682027116)、いずれも全4ジョブ成功）。この実DOMの部分証拠は静的観測器の検査範囲を拡張したことや、UI6規範分類・許可依存表・正式CAT Gateの合格を意味しない。

PR #100で作者`/studio/publication`と`/studio/order`の`Shell → TopicPath → ReaderPanel`、匿名時の管理UI非描画と管理APIの401、幅320/390/768/1280pxの横溢れを実DOMで確認した。管理2画面の`types/kinds`をリアクティブな翻訳辞書へ変更し、公開管理行の可変幅を是正した。新Chromium JUnitは[Red #43685857862](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43685857862) 1/3（旧言語ラベル残存・768pxで1141px溢れ）→[Push #43686117276](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686117276) / [PR #43686153150](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686153150) 3/3（各全4ジョブ成功）。これは画面DOMと表示挙動の観測であり、UI6規範依存表の承認・他の作者管理画面の受入・実Discord認証の代わりにはならない。

PR #102で`/studio/memos`、章/Tipの`/studio?item=…`をさらに実DOM観測した。共通Shell→`TopicPath`→`ReaderPanel`と、章/Tip編集内部の`AuthorReferencePanel`を匿名/作者の両経路で確認し、管理API401と幅320/390/768/1280px横溢れなしを確認。メモ保存409の英語UIローカライズ欠陥も[Red #43687834836](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43687834836) 2/3→[Push #43688099772](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43688099772)・[PR #43688141203](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43688141203) 3/3（各CI4ジョブ成功）で確認・是正した。これらはブラウザ合成DOMと表示の**部分証拠**であり、SFC責務候補の機械的正当性や規範CAT Gate、実機受入を立証しない。

PR #106では匿名JavaScript無効のホーム・ストーリー一覧と、合成作者のメモ・Tip編集について、`ReaderPanel`の既定slot由来の見出し・フォーム・一覧が**石板領域の直接子**として実DOMに存在することを追加検証し、既存4＋新2件のChromium JUnit6/6を[PR CI #43692531155](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43692531155)（全4ジョブ成功）で実証した。静的slot構文と実DOMの二種類の証拠を結びつけた**限定例**であり、すべての名前付きslot・画面の投影適合や正式CAT Gate合格を意味しない。

## 次に必要な判断

1. 現行24件は個々のSFCを読んで候補へ対応付け済み。公開シリーズ・Tip詳細・章の本文とナビゲーション配置はブラウザDOMで部分観測済み。次は`RichContent`の複合責務の妥当性、作者参考パネルの動的内容・他の作者操作画面や未観測のページレイアウト境界を追加観測し、根拠があれば試用候補を修正する。
2. 出所別に取得した同一ディレクトリSFC依存とページ/レイアウトの`localComponents`・相対`.vue`import解決を照合し、観測済みの既定slot直接子以外の受け口/供給接続、Nuxt動的ルートの実表示先、名前付きslotの実DOM投影を別途確認した上で、試用許可依存表と例外を検討する。単純な全順序を規範化しない。
3. DOM契約を必要な画面で定義し、分類/依存のVerifierをCAT正本と照合して試験導入の適否を判断する。
4. 正規CAT Gate・実画面/実機受入の証拠を別管理し、AC-73の状態を自動的にpassへ変えない。
