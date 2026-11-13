---
cat_version: '0.3'
kind: domain-spec
id: eternalia.publication.search-schedule-browser
status: draft
process: eternalia.publication
source_refs:
  - https://drive.google.com/file/d/1LqX-Noytb_oWymIrpO01eO5PvThGlVGx/view
  - https://drive.google.com/file/d/14no6MWmkFuyWYPVS6QdcRmbLbrUBbOpc/view
refs: []
semantic_contract: markdown-v2
language: ja
---

# 予約公開と祖先非公開の読者検索境界（Draft）

## 既定の採用仕様

PB-05・PB-10〜12とAC-31・54・55・70を適用する。匿名検索は対象シリーズで実効公開中の公開スナップショットだけを表示する。公開日時が未来の要素、非公開祖先の子孫、作者の下書きは匿名検索結果・件数・名称・説明に混入しない。公開日時をクリアして再公開しても公開稿は変わらない。

## 独立の検証範囲

既存の実PostgreSQL/Nest/Nuxt HTTP試験は、予約中の4領域の直取得・ツリー・新着・パンくずを検証する。このWorkは **Chromiumでの実際の検索表示** に限定し、検索コンポーネントの読者取得後のフィルタ・再読込・祖先遮断を確認する。テスト用のシリーズ・カテゴリ・設定だけを破棄可能DBへ作成し、既存fixtureの読者公開状態を変更しない。

| ID | 操作 | 期待結果 |
| --- | --- | --- |
| PUB-SEARCH-01 | 公開シリーズ内の公開済み設定を匿名検索する | その公開稿の名称と本文が検索結果に表示される |
| PUB-SEARCH-02 | 設定を未来日時へ予約して新規読者ページで再検索、続いて予約解除 | 予約中はタイトル・本文・検索結果に含まれず、解除すると同じ公開稿へ戻る |
| PUB-SEARCH-03 | 設定を公開したまま祖先シリーズを未来日時へ予約 | シリーズ候補から消え、読者検索に子孫の名称・本文が出ない |

## 状態と正式検証境界

本DomainSpecはユーザー採用済み公開要件から作成する探索的受入試験のDraftであり、規範Confirmed、Process Closure、Model Conformance、spec-test-sync、TDD Queueの成功を意味しない。実Chromium/PGのJUnitレシートも正式CAT Gateや実端末受入ではない。
