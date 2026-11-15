# 現行Vueコンポーネント依存の観測台帳（UI6試験導入）

## 対象と権威

- 対象: `apps/web/app/components/*.vue`（読者・作者で共有するVue SFC群）。
- この記録は現行コードを起点にした**観測**であり、Drive正本 `010_UI構造契約・CAT-TDD試験導入方針.md` の6分類規則を確定したものではない。
- UI6の`room/furniture/partition/equipment/structure/decor`は**試験導入方針のみ採用**。この文書と`docs/cat/drafts/ui6-role-trial.md`に15件の試用分類を具体化したが、分類の意味的正当性、許可依存表、DOM契約・例外はまだDraftである。AC-73の正式合格やCAT規範Gateを意味しない。
- 閲覧時には必ず最新HEADに対して `node scripts/audit-ui-component-deps.mjs` を実行する。この文書に固定された個数や構成を最新状態として扱わない。

## 現行15部品のソース確認に基づく試用分類

分類対象はVue SFC自身の**主たる責務**であり、コンポーネントのサイズ・DOM深度・名前ではない。複数の入力操作を持つ複合編集UIは、単一のボタン/入力部品（`equipment`）ではなく、現段階では用途を持った合成部品（`furniture`）とみなす。この判断の根拠・例外候補は[CAT Draft](cat/drafts/ui6-role-trial.md)へ集約し、確定仕様ではなく変更可能な試用表として扱う。

| 試用分類 | 対象SFC | 根拠となる現行責務 |
| --- | --- | --- |
| `room` | `PublicCollectionPage` | 公開4領域のシリーズ一覧取得・各状態・他部品を統合 |
| `furniture` | `AuthorReferencePanel`, `CategoryPresetEditor`, `LanguageStructureEditor`, `LanguageStructureReader`, `RichContent`, `TipLinksEditor`, `TipLinksReader`, `TopicPath`, `WordMeaningsEditor`, `WordMeaningsReader` | 参考資料検索、複合フォーム、表/読み物、本文ページ、パンくず等の目的別合成部品 |
| `partition` | *該当候補なし* | この15件にダイアログ/ドロワー等の開閉境界を主担当とするSFCなし。六分類の全種類の存在は必須ではない |
| `equipment` | `AuthorCreateLink`, `AuthorEditLink` | 認証状態に応じた作成/編集ナビゲーションの単一操作 |
| `structure` | `ReaderPanel` | 子コンテンツを受けるstone-panelの構造とslot |
| `decor` | `ReadingSkeleton` | 非操作のロード状況の視覚・テキスト表現 |

`RichContent`は読書表示にページ移動操作を持ち、表示と操作の**複合責務**として分割要否をレビュー対象にする。各分類の確定判定、全画面DOMの構造適合、他ディレクトリの役割被覆とは区別する。

## 観測機械と検証可能範囲

`scripts/audit-ui-component-deps.mjs` は、同一ディレクトリ内で見つかるSFCの名前を列挙し、Vue SFCのtemplate領域で実際に開始タグとして現れるPascalCase/kebab-case表記と、script領域の行頭に現れる、同一ディレクトリの `.vue` への直接的な `./Name.vue` 静的importからグラフを作る。別ディレクトリにある同名SFCへのimportは、この限定観測器では別ノードとして扱わず、同名のローカルSFC依存にも誤算入しない。コメント・script文字列・style・引用符内属性値はテンプレート依存として数えない。節点と依存先は辞書順で固定し、循環経路があれば報告する。依存がないか確認するには `node scripts/audit-ui-component-deps.mjs --assert-acyclic` を使用する。

試験は一意列挙、二段依存、自分自身への依存と複数段の循環検出、現行コンポーネント群の静的循環有無、擬似タグ・コメント由来の偽依存除外、kebab-caseの参照認識、別ディレクトリの同名SFCをローカル依存と取り違えないことを検証する。

### 試用分類の決定的レポート（規範判定ではない）

`node scripts/audit-ui6-trial.mjs` は、上記のソース由来候補と**現在の静的依存グラフ**を突き合わせ、候補被覆・不正なrole・一覧外に残る登録、role付きfrom→to、確認を要する逆方向の疑いを報告する。`--check-trial-coverage` は**候補表の陳腐化のみ**を失敗として検知し、意味上の役割合格や許可依存の合格は判定しない。新しいSFCを名前だけで勝手に分類しない。出力には`normativeClassification: not-run`、`normativeDependencyRules: not-run`、`domContract: not-run`を明示する。検査実装の回帰試験は`node --test scripts/audit-ui6-trial.test.mjs`。

**検査できないこと**: ディレクトリをまたぐ依存、Nuxtの動的コンポーネント解決、複雑なJavaScript文字列・式や全構文の完全解析、型専用import、slotsを通した合成、ブラウザ実DOMの親子関係、分類上の責務、許可依存表への意味的適合。これらの不在をもって適合合格とはしない。

一方、**静的観測器とは独立したブラウザ観測**は `apps/web/browser-acceptance/ui6-public-collection-dom.test.mjs` にまとめている。PR #82の公開4領域コレクションに加え、PR #98で公開シリーズ詳細・Tip詳細・章本文の `Shell → TopicPath → ReaderPanel` のDOM順序、匿名時の作者編集リンク非表示、章本文/ナビゲーションの配置、幅320/390/768/1280pxの横溢れ、およびJavaScript無効の公開タイトル・章全ページSSRを観測した。匿名Chromiumと使い捨てPostgreSQLによる既存2件＋追加2件のJUnit4/4（[Push #43682024526](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682024526)、[PR #43682027116](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43682027116)、いずれも全4ジョブ成功）。この実DOMの部分証拠は静的観測器の検査範囲を拡張したことや、UI6規範分類・許可依存表・正式CAT Gateの合格を意味しない。

PR #100で作者`/studio/publication`と`/studio/order`の`Shell → TopicPath → ReaderPanel`、匿名時の管理UI非描画と管理APIの401、幅320/390/768/1280pxの横溢れを実DOMで確認した。管理2画面の`types/kinds`をリアクティブな翻訳辞書へ変更し、公開管理行の可変幅を是正した。新Chromium JUnitは[Red #43685857862](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43685857862) 1/3（旧言語ラベル残存・768pxで1141px溢れ）→[Push #43686117276](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686117276) / [PR #43686153150](https://github.com/surumeneco/Eternalia_Novel/actions/runs/43686153150) 3/3（各全4ジョブ成功）。これは画面DOMと表示挙動の観測であり、UI6規範依存表の承認・作者編集やメモ画面の受入・実Discord認証の代わりにはならない。

## 次に必要な判断

1. 現行15件は個々のSFCを読んで候補へ対応付け済み。公開シリーズ・Tip詳細・章の本文とナビゲーション配置はブラウザDOMで部分観測済み。次は`RichContent`の複合責務の妥当性、作者参考パネル・作者編集/メモ等の未検証ページレイアウト境界を追加観測し、根拠があれば試用候補を修正する。
2. 依存観測結果に役割候補を重ねて検討する。静的import・template合成・slot委譲の区別を補ってから、許可依存表と例外を試行し、単純な全順序を規範化しない。
3. DOM契約を必要な画面で定義し、分類/依存のVerifierをCAT正本と照合して試験導入の適否を判断する。
4. 正規CAT Gate・実画面/実機受入の証拠を別管理し、AC-73の状態を自動的にpassへ変えない。
