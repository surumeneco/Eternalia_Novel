---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.route-composition-observation
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://github.com/surumeneco/Eternalia_Novel/blob/079ed09de9997e4a70fe0703f9954588a87a72be/scripts/audit-ui-component-deps.mjs
refs: []
semantic_contract: markdown-v2
language: ja
---

# UI6ページ・レイアウトと共通部品の合成参照観測（Draft）

## 根拠・適用範囲

試験導入が採用されたUI6の`ui.composition`は、コンポーネントの静的依存と画面上の表示合成を区別する。現行のSFC監査器は`apps/web/app/components/*.vue`の15件のみを対象にしており、実際のページ17件とレイアウト・Nuxtアプリ起点から部品への利用経路を報告していない。ここでは既存SFC監査器の字句的な範囲を再利用して、観測対象をアプリ内の実在する`.vue`ソースへ拡張する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.route.local-tags | ルート/レイアウトSFCが直接記述する既知のローカル共通部品タグを列挙する |
| eternalia.ui.route.static-imports | 別ディレクトリの相対`.vue` importを、解決したソースパス/不在/アプリ領域外へ分類する |
| eternalia.ui.route.runtime-outlets | `NuxtPage`/`NuxtLayout`等のフレームワーク表示境界は構文箇所として観測し、実行時の表示先を推測しない |
| eternalia.ui.route.authority | 観測できない直接/間接の合成関係・UI6許可依存・CAT Gateを合格扱いしない |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI6-ROUTE-01 | `pages/**/*.vue`、`layouts/**/*.vue`、`app.vue`に既知の共通部品タグがある | ページIDと部品名を決定的に記録し、文字列やコメント由来の偽タグを除外する | Node単体試験 |
| UI6-ROUTE-02 | ルートSFCが別ディレクトリの`.vue`を静的importする | 実在パスへの相対解決を記録し、無いファイル/アプリ外を別状態にする。曖昧なbasenameから辺を捏造しない | Node単体試験 |
| UI6-ROUTE-03 | フレームワーク表示境界やslot、動的componentを記述する | 局所字句の受け口・供給・動的箇所を表示し、実行時ターゲットは非決定扱いとする | Node単体試験 |
| UI6-ROUTE-04 | ソースに追加ページや削除ページがある | 既知ページ件数を設定で固定せず再列挙し、重複/欠落を回避する。コンポーネント従来グラフ・循環と15件試用分類を変更しない | Node単体試験 |
| UI6-ROUTE-05 | 監査が成功する | UI6規範許可依存・画面全DOM・認証・正式CAT Gateの受入状態を変更しない | Node試験・台帳 |

## 判断の境界

ページとレイアウトから観測するのは**直接のソース表記**であり、Nuxtの自動登録・動的ルーティング・条件分岐の実行結果やslotの内容投影先ではない。`main`や本体CAT-TDDへ規範規則を追加しない。独立のブラウザDOM受入と規範的な許可依存表は別に検証し、Draftを自律的にConfirmedへ変更しない。
