# 現行Vueコンポーネント依存の観測台帳（UI6試験導入）

## 対象と権威

- 対象: `apps/web/app/components/*.vue`（読者・作者で共有するVue SFC群）。
- この記録は現行コードを起点にした**観測**であり、Drive正本 `010_UI構造契約・CAT-TDD試験導入方針.md` の6分類規則を確定したものではない。
- UI6の`room/furniture/partition/equipment/structure/decor`は試験導入方針のみ採用。許可依存表、分類境界、DOM契約と例外は依然草案。AC-73の正式合格やCAT規範Gateを意味しない。
- 閲覧時には必ず最新HEADに対して `node scripts/audit-ui-component-deps.mjs` を実行する。この文書に固定された個数や構成を最新状態として扱わない。

## 現行コードから見える代表例

| コンポーネント | 観測される利用または責務 | UI6の分類状態 |
| --- | --- | --- |
| `PublicCollectionPage.vue` | `AuthorCreateLink`・`ReaderPanel`・`ReadingSkeleton`・`TopicPath`を合成する公開一覧の統合要素 | `room` / `furniture` 等の境界未決 |
| `ReaderPanel.vue` | `stone-panel`スタイルのSectionとslotを提供する | `structure`候補、未決 |
| `ReadingSkeleton.vue` | 読込中の進捗とスケルトンの表示 | `structure` / `decor` / `furniture` 境界未決 |
| `AuthorReferencePanel.vue` | 作者編集用の資料参照、`WordMeaningsReader`合成 | `room` / `furniture` 境界未決 |
| `TipLinksEditor.vue` | 関連設定とタグの選択・順序・削除操作 | `equipment` / `furniture` 境界未決 |
| `RichContent.vue` | 順序付き本文ページとルビを表示し、JS有効時はページ移動を扱う | 表示と操作の複合責務。分割要否も未決 |

上表は候補の整理であり、**個別の分類や分類間依存を規範承認していない**。名前やDOM深度で分類を機械的に決めない。

## 観測機械と検証可能範囲

`scripts/audit-ui-component-deps.mjs` は、同一ディレクトリ内で見つかるSFCの名前を列挙し、PascalCaseで書かれたタグと明示的な `.vue` 静的importからグラフを作る。節点と依存先は辞書順で固定し、循環経路があれば報告する。依存がないか確認するには `node scripts/audit-ui-component-deps.mjs --assert-acyclic` を使用する。

試験は一意列挙、二段依存、自分自身への依存と複数段の循環検出、現行コンポーネント群の静的循環有無を検証する。

**検査できないこと**: ディレクトリをまたぐ依存、Nuxtの動的コンポーネント解決、kebab-case参照、型専用import、slotsを通した合成、ブラウザ実DOMの親子関係、分類上の責務、許可依存表への意味的適合。これらの不在をもって適合合格とはしない。

## 次に必要な判断

1. SFCを個別に読む実例で、分類の主責務・複合責務・再利用境界を確認する。
2. 静的import・テンプレートによる合成・slot委譲を区別した許可依存表と例外を決定する。
3. DOM契約を必要な画面で定義し、分類/依存のVerifierをCAT正本と照合して試験導入の適否を判断する。
4. 正規CAT Gate・実画面/実機受入の証拠を別管理し、AC-73の状態を自動的にpassへ変えない。
