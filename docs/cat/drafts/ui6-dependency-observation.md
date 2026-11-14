---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.ui6-dependency-observation
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# UI6構造・静的コンポーネント依存の観測（Draft）

## 正本の状態

010_UI構造契約・CAT-TDD試験導入方針は、6分類（room/furniture/partition/equipment/structure/decor）の**試験導入方針のみ承認**されており、個々の分類規則、許可依存表、例外、画面DOM契約は未確認の草案である。AC-73では6分類とDOM、依存を対象ごとに検証し、自動Verifier未整備なら受入をnot-runとする。

このWorkではVue SFCの静的な依存グラフを**現状の観測**として取得する。UI6分類をAIが確定しない。画面DOMの親子関係をJavaScriptのstatic importと同一視しない。Nuxtの自動登録コンポーネントはPascalCaseの明示タグで認識する。動的な`resolveComponent()`やglob依存の完全検出を偽装しない。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.observed.component-inventory | 現在の `apps/web/app/components/*.vue` を列挙し、明示的なVueコンポーネントタグと静的相互依存を抽出 |
| eternalia.ui.observed.graph-check | 観測グラフに循環がある場合、構成要素と依存経路を報告する |
| eternalia.ui.observed.classification-boundary | UI6分類や許可方向の自動合否とは分け、未決項目を未決として記録する |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI-DEP-OBS-01 | 現行のVueコンポーネント群を入力 | 同名ファイルを一意に列挙し、明示タグ/静的importによる内部参照を報告 | UI-DEP-OBS-01 |
| UI-DEP-OBS-02 | 複数段のコンポーネント依存が循環 | 記録可能な経路とともに循環を検出し、同じ入力なら同じ出力となる | UI-DEP-OBS-02 |
| UI-DEP-OBS-03 | 未確認のUI6分類と依存制約を機械的に判定しようとする | 対応する規範ゲートをpassedと宣言せず、抽出可能なソース上の事実だけを検証 | UI-DEP-OBS-03 |

## 限界

本Draftと一般的なテストはCATの新しい規範Verifierではない。DOM親子、Nuxtによる動的コンポーネント解決、SFC型やスロット越しの合成、主責務と分類の正当性は別途の仕様・検証対象として保留する。
