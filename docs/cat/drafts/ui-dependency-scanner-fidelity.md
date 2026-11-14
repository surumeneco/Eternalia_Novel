---
cat_version: '0.3'
kind: domain-spec
id: eternalia.ui.dependency-scanner-fidelity
status: draft
process: eternalia.ui
source_refs:
  - https://drive.google.com/file/d/1XqbwPJhSK946BSFlAoG7hM2jcQYi8gn1/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# Vueコンポーネント依存観測の誤検出・見落とし改善（Draft）

## 観測された欠陥と位置付け

PR #72で追加した`scripts/audit-ui-component-deps.mjs`はVue SFC全文を`/<PascalCase>/`相当の正規表現で走査する。スクリプトの文字列・CSS・HTMLコメント・属性値に現れる擬似タグを実際のtemplateコンポーネント参照と誤認し、架空の依存や循環を出力し得る。またNuxtのkebab-caseタグ表記を認識しない。後続のPR #74までの修正でこれらは改善されたが、別ディレクトリの `../other/ReaderPanel.vue` のような静的importをbasenameだけで同ディレクトリの `ReaderPanel.vue` と誤認する経路が残る。

このWorkは**観測機械の検査範囲と正確性**を改善する。Driveの010_UI構造契約では6分類の試験導入方針のみ採用され、分類規則・依存許可表・DOM契約は草案である。これらを自動的に正式合格として扱わず、`classificationStatus: undecided`を維持する。

## 対象

| Ref | Aspect |
| --- | --- |
| eternalia.ui.observed.template | template本体の実コンポーネント開始タグと非参照の区別 |
| eternalia.ui.observed.script | script内の静的Vue SFC importとコメント等の区別 |
| eternalia.ui.observed.graph | 既存の決定論的循環検出とUI6権威境界の維持 |

## 規則

| ID | 条件 | 要求 | 検証 |
| --- | --- | --- | --- |
| UI-DEP-OBS-04 | 文字列・CSS・HTMLコメント・引用符付き属性値にのみ同名の擬似タグがある | テンプレートの実際の開始タグとして誤認せず、依存グラフに加えない | UI-DEP-OBS-04 |
| UI-DEP-OBS-05 | 実テンプレートにPascalCaseまたはkebab-caseの既知Vue SFCタグがある | 同一SFCに対応する依存を一意に抽出し、内側のtemplateとその後の兄弟参照も落とさない | UI-DEP-OBS-05 |
| UI-DEP-OBS-06 | `<script setup>`に静的な`.vue` importと、コメント中の偽importが混在する | 実際の静的importのみを抽出し、コメント中の偽依存を除外する。既存循環検出と決定論的並び順を維持する | UI-DEP-OBS-06 |
| UI-DEP-OBS-07 | 同名の `.vue` ファイルが別ディレクトリにあり、`../other/ReaderPanel.vue` または別名パスを静的importしている | **同一ディレクトリ内の既知コンポーネント**の依存として数えない。`./ReaderPanel.vue` の直接importだけをこの限定観測器の静的import依存とする。templateタグによる既知コンポーネント参照と循環検出は維持する | UI-DEP-OBS-07 |

## 検証・未決境界

実ブラウザDOM、ディレクトリ横断/動的コンポーネント登録、スロット越しの合成、UI6役割判定、許可依存表の意味適合、実機受入をこの検査だけで確認済みとはしない。Vue SFCの字句走査は限定された観測器であり、完全なVueコンパイラの代替ではない。

CATの固定版`896cae83`で当Draftを構文検査するが、構文成功はConfirmed・Process Closure・Model Conformance・Implementation Conformanceの通過と無関係である。
